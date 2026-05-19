import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db import DatabaseConnection, get_connection
from app.services.audit import write_audit_log
from app.services.rabbitmq import rpc_client


router = APIRouter(prefix="/screens", tags=["screens"])


class PermissionUpdate(BaseModel):
    group_id: int
    screen_id: int
    can_create: bool = False
    can_read: bool = False
    can_update: bool = False
    can_delete: bool = False
    can_upload: bool = False
    allowed_extensions: list[str] = Field(default_factory=lambda: ["txt", "png", "jpg", "jpeg", "pdf", "doc", "docx", "xls", "xlsx"])
    value: dict[str, Any] = Field(default_factory=dict)


@router.get("")
async def list_screens(connection: DatabaseConnection = Depends(get_connection)) -> list[dict[str, Any]]:
    rows = await connection.fetch(
        "SELECT id, code, title, route, value FROM app_screens ORDER BY id"
    )
    return [dict(row) for row in rows]


@router.get("/permissions")
async def list_permissions(connection: DatabaseConnection = Depends(get_connection)) -> list[dict[str, Any]]:
    rows = await connection.fetch(
        """
        SELECT
            p.id,
            g.code AS group_code,
            g.name AS group_name,
            s.code AS screen_code,
            s.title AS screen_title,
            s.route,
            p.can_create,
            p.can_read,
            p.can_update,
            p.can_delete,
            p.can_upload,
            p.allowed_extensions,
            p.value
        FROM group_screen_permissions p
        JOIN app_groups g ON g.id = p.group_id
        JOIN app_screens s ON s.id = p.screen_id
        ORDER BY g.id, s.id
        """
    )
    return [dict(row) for row in rows]


@router.put("/permissions")
async def upsert_permission(
    data: PermissionUpdate,
    connection: DatabaseConnection = Depends(get_connection),
) -> dict[str, Any]:
    await connection.execute(
        """
        INSERT INTO group_screen_permissions (
            group_id, screen_id, can_create, can_read, can_update, can_delete,
            can_upload, allowed_extensions, value
        )
        VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            can_create = VALUES(can_create),
            can_read = VALUES(can_read),
            can_update = VALUES(can_update),
            can_delete = VALUES(can_delete),
            can_upload = VALUES(can_upload),
            allowed_extensions = VALUES(allowed_extensions),
            value = VALUES(value),
            updated_at = CURRENT_TIMESTAMP
        """,
        data.group_id,
        data.screen_id,
        data.can_create,
        data.can_read,
        data.can_update,
        data.can_delete,
        data.can_upload,
        json.dumps(data.allowed_extensions),
        json.dumps(data.value),
    )
    row = await connection.fetchrow(
        """
        SELECT *
        FROM group_screen_permissions
        WHERE group_id = %s AND screen_id = %s
        """,
        data.group_id,
        data.screen_id,
    )
    if row is None:
        raise HTTPException(status_code=400, detail="Yetki kaydedilemedi")

    payload = dict(row)
    await write_audit_log(connection, "permission.updated", "Yetki güncellendi", value=payload)
    rpc_result = await rpc_client.call("permission.updated", payload)
    return {"permission": payload, "rpc": rpc_result}
