import json
import asyncio
from collections.abc import AsyncIterator
from typing import Any
from urllib.parse import urlparse

import aiomysql

from app.core.config import settings


JSON_FIELDS = {"value", "payload", "response", "allowed_extensions"}

pool: aiomysql.Pool | None = None


def _database_config() -> dict[str, Any]:
    parsed = urlparse(settings.database_url)
    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": parsed.username or "admin",
        "password": parsed.password or "admin123",
        "db": parsed.path.lstrip("/") or "admin_panel",
        "autocommit": False,
        "charset": "utf8mb4",
    }


def _decode_row(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None

    decoded = dict(row)
    for field in JSON_FIELDS:
        value = decoded.get(field)
        if isinstance(value, (bytes, bytearray)):
            value = value.decode("utf-8")
        if isinstance(value, str):
            try:
                decoded[field] = json.loads(value)
            except json.JSONDecodeError:
                decoded[field] = value
    return decoded


class DatabaseConnection:
    def __init__(self, connection: aiomysql.Connection) -> None:
        self.connection = connection

    async def fetch(self, query: str, *args: Any) -> list[dict[str, Any]]:
        async with self.connection.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, args)
            rows = await cursor.fetchall()
            return [_decode_row(row) for row in rows]

    async def fetchrow(self, query: str, *args: Any) -> dict[str, Any] | None:
        async with self.connection.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, args)
            row = await cursor.fetchone()
            return _decode_row(row)

    async def execute(self, query: str, *args: Any) -> int:
        async with self.connection.cursor() as cursor:
            try:
                await cursor.execute(query, args)
                await self.connection.commit()
                return cursor.rowcount
            except Exception:
                await self.connection.rollback()
                raise


async def connect_db() -> None:
    global pool
    last_error: Exception | None = None
    for attempt in range(30):
        try:
            pool = await aiomysql.create_pool(minsize=1, maxsize=5, **_database_config())
            return
        except Exception as exc:
            last_error = exc
            await asyncio.sleep(min(1 + attempt * 0.25, 5))

    raise RuntimeError("Veritabanı bağlantısı kurulamadı") from last_error


async def close_db() -> None:
    if pool:
        pool.close()
        await pool.wait_closed()


async def get_connection() -> AsyncIterator[DatabaseConnection]:
    if pool is None:
        raise RuntimeError("Database pool is not initialized")

    async with pool.acquire() as raw_connection:
        yield DatabaseConnection(raw_connection)
