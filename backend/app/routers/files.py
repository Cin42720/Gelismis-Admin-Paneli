import json
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.db import DatabaseConnection, get_connection
from app.services.audit import write_audit_log
from app.services.rabbitmq import rpc_client


router = APIRouter(prefix="/files", tags=["files"])
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("")
async def list_files(connection: DatabaseConnection = Depends(get_connection)) -> list[dict[str, Any]]:
    rows = await connection.fetch(
        """
        SELECT id, original_name, extension, mime_type, analysis_status, value, created_at
        FROM uploaded_files
        ORDER BY created_at DESC
        LIMIT 50
        """
    )
    return [dict(row) for row in rows]


@router.post("")
async def upload_file(
    group_id: int = Form(...),
    screen_id: int = Form(...),
    actor_user_id: int | None = Form(default=None),
    file: UploadFile = File(...),
    connection: DatabaseConnection = Depends(get_connection),
) -> dict[str, Any]:
    extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    permission = await connection.fetchrow(
        """
        SELECT can_upload, allowed_extensions
        FROM group_screen_permissions
        WHERE group_id = %s AND screen_id = %s
        """,
        group_id,
        screen_id,
    )
    if not permission or not permission["can_upload"]:
        raise HTTPException(status_code=403, detail="Bu grup bu ekranda dosya yükleyemez")
    if extension not in permission["allowed_extensions"]:
        raise HTTPException(status_code=400, detail=f"Bu dosya uzantısına izin verilmiyor: {extension}")

    stored_name = f"{uuid4()}.{extension}"
    storage_path = UPLOAD_DIR / stored_name
    storage_path.write_bytes(await file.read())

    file_id = str(uuid4())
    await connection.execute(
        """
        INSERT INTO uploaded_files(id, user_id, group_id, original_name, mime_type, extension, storage_path, value)
        VALUES(%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        file_id,
        actor_user_id,
        group_id,
        file.filename,
        file.content_type,
        extension,
        str(storage_path),
        json.dumps({"screen_id": screen_id}),
    )
    row = await connection.fetchrow(
        """
        SELECT id, original_name, extension, storage_path, analysis_status, value
        FROM uploaded_files
        WHERE id = %s
        """,
        file_id,
    )
    payload = dict(row)
    await write_audit_log(connection, "file.uploaded", "Dosya yüklendi", actor_user_id=actor_user_id, group_id=group_id, value=payload)
    rpc_result = await rpc_client.call("file.uploaded", payload)
    return {"file": payload, "rpc": rpc_result}


@router.post("/{file_id}/analyze")
async def analyze_file(
    file_id: str,
    connection: DatabaseConnection = Depends(get_connection),
) -> dict[str, Any]:
    file_row = await connection.fetchrow("SELECT * FROM uploaded_files WHERE id = %s", file_id)
    if not file_row:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{settings.ai_service_url}/analyze",
            json={
                "file_id": str(file_row["id"]),
                "path": file_row["storage_path"],
                "extension": file_row["extension"],
                "original_name": file_row["original_name"],
            },
        )
        response.raise_for_status()
        analysis = response.json()

    await connection.execute(
        """
        UPDATE uploaded_files
        SET analysis_status = %s,
            value = JSON_MERGE_PATCH(COALESCE(value, JSON_OBJECT()), %s)
        WHERE id = %s
        """,
        "completed",
        json.dumps({"analysis": analysis}),
        file_id,
    )
    await write_audit_log(connection, "file.analyzed", "Dosya analiz edildi", value={"file_id": file_id, "analysis": analysis})
    return analysis
