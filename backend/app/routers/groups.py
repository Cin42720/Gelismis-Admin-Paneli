import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db import DatabaseConnection, get_connection
from app.services.audit import write_audit_log
from app.services.rabbitmq import rpc_client


router = APIRouter(prefix="/groups", tags=["groups"])


class GroupCreate(BaseModel):
    code: str = Field(min_length=2)
    name: str
    value: dict[str, Any] = Field(default_factory=dict)


@router.get("")
async def list_groups(connection: DatabaseConnection = Depends(get_connection)) -> list[dict[str, Any]]:
    rows = await connection.fetch(
        "SELECT id, code, name, value, created_at FROM app_groups ORDER BY id"
    )
    return [dict(row) for row in rows]


@router.post("")
async def create_group(
    data: GroupCreate,
    connection: DatabaseConnection = Depends(get_connection),
) -> dict[str, Any]:
    await connection.execute(
        """
        INSERT INTO app_groups(code, name, value)
        VALUES(%s, %s, %s)
        """,
        data.code,
        data.name,
        json.dumps(data.value),
    )
    row = await connection.fetchrow(
        "SELECT id, code, name, value FROM app_groups WHERE code = %s",
        data.code,
    )
    if row is None:
        raise HTTPException(status_code=400, detail="Grup oluşturulamadı")
    await write_audit_log(connection, "group.created", "Grup oluşturuldu", value=dict(row))
    rpc_result = await rpc_client.call("group.created", dict(row))
    return {"group": dict(row), "rpc": rpc_result}


@router.delete("/{group_id}")
async def delete_group(
    group_id: int,
    connection: DatabaseConnection = Depends(get_connection),
) -> dict[str, Any]:
    result = await connection.execute("DELETE FROM app_groups WHERE id = %s", group_id)
    if result == 0:
        raise HTTPException(status_code=404, detail="Grup bulunamadı")
    await write_audit_log(connection, "group.deleted", "Grup silindi", value={"group_id": group_id})
    rpc_result = await rpc_client.call("group.deleted", {"group_id": group_id})
    return {"ok": True, "rpc": rpc_result}
