import asyncio
import json
import logging
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import aio_pika
import aiomysql
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "mysql://admin:admin123@mysql:3306/admin_panel"
    rabbitmq_url: str = "amqp://guest:guest@rabbitmq:5672/"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
LOG_DIR = Path("/app/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    filename=LOG_DIR / "worker.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)


def database_config() -> dict[str, Any]:
    parsed = urlparse(settings.database_url)
    return {
        "host": parsed.hostname or "mysql",
        "port": parsed.port or 3306,
        "user": parsed.username or "admin",
        "password": parsed.password or "admin123",
        "db": parsed.path.lstrip("/") or "admin_panel",
        "charset": "utf8mb4",
        "autocommit": False,
    }


async def save_log(pool: aiomysql.Pool, operation: str, ok: bool, payload: dict[str, Any], message: str) -> None:
    async with pool.acquire() as connection:
        async with connection.cursor() as cursor:
            try:
                await cursor.execute(
                    """
                    INSERT INTO app_logs(event_type, success, message, value)
                    VALUES(%s, %s, %s, %s)
                    """,
                    (f"rpc.{operation}", ok, message, json.dumps(payload)),
                )
                await connection.commit()
            except Exception:
                await connection.rollback()
                raise


async def handle_message(
    message: aio_pika.IncomingMessage,
    pool: aiomysql.Pool,
    channel: aio_pika.RobustChannel,
) -> None:
    async with message.process():
        body = json.loads(message.body.decode())
        operation = body.get("operation", "unknown")
        payload = body.get("payload", {})
        logging.info("RPC operation=%s payload=%s", operation, json.dumps(payload, ensure_ascii=True))

        response = {
            "ok": True,
            "operation": operation,
            "message": "RabbitMQ consumer işlemi aldı ve logladı",
        }
        await save_log(pool, operation, True, payload, response["message"])

        if message.reply_to:
            reply = aio_pika.Message(
                body=json.dumps(response).encode(),
                content_type="application/json",
                correlation_id=message.correlation_id,
            )
            await channel.default_exchange.publish(reply, routing_key=message.reply_to)


async def main() -> None:
    pool = None
    last_error: Exception | None = None
    for attempt in range(30):
        try:
            pool = await aiomysql.create_pool(minsize=1, maxsize=3, **database_config())
            break
        except Exception as exc:
            last_error = exc
            await asyncio.sleep(min(1 + attempt * 0.25, 5))

    if pool is None:
        raise RuntimeError("Veritabanı bağlantısı kurulamadı") from last_error

    connection = None
    last_error = None
    for attempt in range(30):
        try:
            connection = await aio_pika.connect_robust(settings.rabbitmq_url)
            break
        except Exception as exc:
            last_error = exc
            await asyncio.sleep(min(1 + attempt * 0.25, 5))

    if connection is None:
        pool.close()
        await pool.wait_closed()
        raise RuntimeError("RabbitMQ bağlantısı kurulamadı") from last_error

    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)
    queue = await channel.declare_queue("crud.rpc", durable=True)

    await queue.consume(lambda message: handle_message(message, pool, channel))
    print("Worker crud.rpc kuyruğunu dinliyor")
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
