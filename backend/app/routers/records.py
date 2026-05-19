import json
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.db import DatabaseConnection, get_connection
from app.services.audit import write_audit_log
from app.services.rabbitmq import rpc_client


router = APIRouter(prefix="/records", tags=["records"])


class RecordCreate(BaseModel):
    group_id: int
    screen_id: int
    title: str = Field(min_length=2, max_length=190)
    value: dict[str, Any] = Field(default_factory=dict)


class RecordUpdate(BaseModel):
    title: str = Field(min_length=2, max_length=190)
    value: dict[str, Any] = Field(default_factory=dict)


async def ensure_permission(
    connection: DatabaseConnection,
    group_id: int,
    screen_id: int,
    operation: str,
) -> None:
    row = await connection.fetchrow(
        "SELECT can_group_access_screen(%s, %s, %s) AS allowed",
        group_id,
        screen_id,
        operation,
    )
    if not row or not row["allowed"]:
        operations = {
            "create": "oluşturma",
            "read": "okuma",
            "update": "güncelleme",
            "delete": "silme",
            "upload": "dosya yükleme",
        }
        raise HTTPException(status_code=403, detail=f"Bu grubun bu ekranda {operations.get(operation, operation)} izni yok")


@router.get("")
async def list_records(
    group_id: int = Query(...),
    screen_id: int = Query(...),
    connection: DatabaseConnection = Depends(get_connection),
) -> list[dict[str, Any]]:
    await ensure_permission(connection, group_id, screen_id, "read")
    rows = await connection.fetch(
        """
        SELECT id, group_id, screen_id, title, value, created_at, updated_at
        FROM panel_records
        WHERE group_id = %s AND screen_id = %s
        ORDER BY created_at DESC
        LIMIT 100
        """,
        group_id,
        screen_id,
    )
    return [dict(row) for row in rows]


@router.post("")
async def create_record(
    data: RecordCreate,
    connection: DatabaseConnection = Depends(get_connection),
) -> dict[str, Any]:
    await ensure_permission(connection, data.group_id, data.screen_id, "create")
    record_id = str(uuid4())
    await connection.execute(
        """
        INSERT INTO panel_records(id, group_id, screen_id, title, value)
        VALUES(%s, %s, %s, %s, %s)
        """,
        record_id,
        data.group_id,
        data.screen_id,
        data.title,
        json.dumps(data.value),
    )
    row = await connection.fetchrow(
        """
        SELECT id, group_id, screen_id, title, value, created_at, updated_at
        FROM panel_records
        WHERE id = %s
        """,
        record_id,
    )
    payload = dict(row)
    await write_audit_log(connection, "record.created", "Kayıt oluşturuldu", group_id=data.group_id, value=payload)
    rpc_result = await rpc_client.call("record.created", payload)
    return {"record": payload, "rpc": rpc_result}


@router.put("/{record_id}")
async def update_record(
    record_id: str,
    data: RecordUpdate,
    connection: DatabaseConnection = Depends(get_connection),
) -> dict[str, Any]:
    existing = await connection.fetchrow(
        "SELECT id, group_id, screen_id FROM panel_records WHERE id = %s",
        record_id,
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")

    await ensure_permission(connection, existing["group_id"], existing["screen_id"], "update")
    await connection.execute(
        """
        UPDATE panel_records
        SET title = %s, value = %s
        WHERE id = %s
        """,
        data.title,
        json.dumps(data.value),
        record_id,
    )
    row = await connection.fetchrow(
        """
        SELECT id, group_id, screen_id, title, value, created_at, updated_at
        FROM panel_records
        WHERE id = %s
        """,
        record_id,
    )
    payload = dict(row)
    await write_audit_log(connection, "record.updated", "Kayıt güncellendi", group_id=existing["group_id"], value=payload)
    rpc_result = await rpc_client.call("record.updated", payload)
    return {"record": payload, "rpc": rpc_result}


@router.delete("/{record_id}")
async def delete_record(
    record_id: str,
    connection: DatabaseConnection = Depends(get_connection),
) -> dict[str, Any]:
    existing = await connection.fetchrow(
        "SELECT id, group_id, screen_id, title, value FROM panel_records WHERE id = %s",
        record_id,
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")

    await ensure_permission(connection, existing["group_id"], existing["screen_id"], "delete")
    await connection.execute("DELETE FROM panel_records WHERE id = %s", record_id)
    payload = dict(existing)
    await write_audit_log(connection, "record.deleted", "Kayıt silindi", group_id=existing["group_id"], value=payload)
    rpc_result = await rpc_client.call("record.deleted", payload)
    return {"ok": True, "rpc": rpc_result}
