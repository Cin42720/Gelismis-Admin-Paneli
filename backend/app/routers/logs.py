from typing import Any

from fastapi import APIRouter, Depends, Query

from app.db import DatabaseConnection, get_connection


router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("")
async def list_logs(
    limit: int = Query(default=100, ge=1, le=300),
    connection: DatabaseConnection = Depends(get_connection),
) -> list[dict[str, Any]]:
    rows = await connection.fetch(
        """
        SELECT id, event_type, actor_user_id, group_id, success, message, value, created_at
        FROM app_logs
        ORDER BY created_at DESC, id DESC
        LIMIT %s
        """,
        limit,
    )
    return [dict(row) for row in rows]

