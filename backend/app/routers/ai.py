from typing import Any

import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import settings


router = APIRouter(prefix="/ai", tags=["ai"])


class PromptRequest(BaseModel):
    prompt: str = Field(min_length=1)
    context: dict[str, Any] = Field(default_factory=dict)


@router.get("/capabilities")
async def capabilities() -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"{settings.ai_service_url}/capabilities")
        response.raise_for_status()
        return response.json()


@router.post("/prompt")
async def prompt(data: PromptRequest) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{settings.ai_service_url}/prompt",
            json={"prompt": data.prompt, "context": data.context},
        )
        response.raise_for_status()
        return response.json()
