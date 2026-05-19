import json
import logging
from pathlib import Path
from typing import Any

from app.db import DatabaseConnection


LOG_DIR = Path("/app/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    filename=LOG_DIR / "backend.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)


async def write_audit_log(
    connection: DatabaseConnection,
    event_type: str,
    message: str,
    *,
    actor_user_id: int | None = None,
    group_id: int | None = None,
    success: bool = True,
    value: dict[str, Any] | None = None,
) -> None:
    payload = value or {}
    logging.info("%s %s %s", event_type, success, json.dumps(payload, ensure_ascii=True, default=str))
    await connection.execute(
        """
        INSERT INTO app_logs(event_type, actor_user_id, group_id, success, message, value)
        VALUES(%s, %s, %s, %s, %s, %s)
        """,
        event_type,
        actor_user_id,
        group_id,
        success,
        message,
        json.dumps(payload, default=str),
    )
