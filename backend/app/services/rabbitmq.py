import asyncio
import json
import uuid
from typing import Any

import aio_pika

from app.core.config import settings


class RabbitRpcClient:
    def __init__(self) -> None:
        self.connection: aio_pika.RobustConnection | None = None
        self.channel: aio_pika.RobustChannel | None = None
        self.callback_queue: aio_pika.Queue | None = None
        self.futures: dict[str, asyncio.Future[dict[str, Any]]] = {}
        self.enabled = True

    async def connect(self) -> None:
        last_error: Exception | None = None
        for attempt in range(30):
            try:
                self.connection = await aio_pika.connect_robust(settings.rabbitmq_url)
                break
            except Exception as exc:
                last_error = exc
                await asyncio.sleep(min(1 + attempt * 0.25, 5))

        if self.connection is None:
            if settings.rabbitmq_required:
                raise RuntimeError("RabbitMQ bağlantısı kurulamadı") from last_error
            self.enabled = False
            return

        self.channel = await self.connection.channel()
        self.callback_queue = await self.channel.declare_queue(exclusive=True)
        await self.callback_queue.consume(self._on_response)

    async def close(self) -> None:
        if self.connection:
            await self.connection.close()

    async def _on_response(self, message: aio_pika.IncomingMessage) -> None:
        correlation_id = message.correlation_id
        if correlation_id and correlation_id in self.futures:
            future = self.futures.pop(correlation_id)
            future.set_result(json.loads(message.body.decode()))

    async def call(self, operation: str, payload: dict[str, Any], timeout: float = 5.0) -> dict[str, Any]:
        if not self.enabled:
            return {
                "ok": False,
                "operation": operation,
                "message": "RabbitMQ kullanılamıyor; işlem RPC olmadan yerel olarak döndürüldü.",
            }

        if self.channel is None or self.callback_queue is None:
            raise RuntimeError("RabbitMQ RPC istemcisi bağlı değil")

        correlation_id = str(uuid.uuid4())
        loop = asyncio.get_running_loop()
        future: asyncio.Future[dict[str, Any]] = loop.create_future()
        self.futures[correlation_id] = future

        message = aio_pika.Message(
            body=json.dumps({"operation": operation, "payload": payload}, default=str).encode(),
            content_type="application/json",
            correlation_id=correlation_id,
            reply_to=self.callback_queue.name,
        )
        await self.channel.default_exchange.publish(message, routing_key="crud.rpc")
        try:
            return await asyncio.wait_for(future, timeout=timeout)
        except TimeoutError:
            self.futures.pop(correlation_id, None)
            return {
                "ok": False,
                "operation": operation,
                "message": "RabbitMQ RPC consumer zamanında cevap vermedi.",
            }


rpc_client = RabbitRpcClient()
