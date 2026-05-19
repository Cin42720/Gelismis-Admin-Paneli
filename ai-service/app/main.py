from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


app = FastAPI(title="Yapay Zeka Dosya Analiz Servisi", version="0.1.0")


class AnalyzeRequest(BaseModel):
    file_id: str
    path: str
    extension: str
    original_name: str


class PromptRequest(BaseModel):
    prompt: str
    context: dict[str, Any] = {}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/capabilities")
async def capabilities() -> dict[str, Any]:
    return {
        "rag": {
            "enabled": True,
            "status": "skeleton",
            "description": "Vektör veritabanı ve belge parçalama akışı buraya bağlanabilir.",
        },
        "mcp": {
            "enabled": True,
            "status": "skeleton",
            "description": "MCP araçları bu servis katmanından sunulabilir.",
        },
        "formats": ["txt", "png", "jpg", "jpeg", "pdf", "doc", "docx", "xls", "xlsx"],
    }


@app.post("/analyze")
async def analyze_file(data: AnalyzeRequest) -> dict[str, Any]:
    file_path = Path(data.path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dosya yapay zeka servisinin volume alanında bulunamadı")

    extension = data.extension.lower()
    if extension == "txt":
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        prompts = [line.strip() for line in text.splitlines() if line.strip()]
        return {
            "file_id": data.file_id,
            "type": "komut-listesi",
            "prompt_count": len(prompts),
            "prompts": prompts[:10],
            "next_step": "Bu komutlar seçilen yapay zeka sağlayıcısına gönderilebilir.",
        }

    if extension in {"doc", "docx"}:
        return {
            "file_id": data.file_id,
            "type": "belge",
            "conversion": "html-hazır",
            "html_preview": f"<main><h1>{data.original_name}</h1><p>Word dosyasını HTML'e dönüştürme akışı için demo önizleme.</p></main>",
        }

    if extension in {"png", "jpg", "jpeg"}:
        return {
            "file_id": data.file_id,
            "type": "görsel",
            "summary": "Görsel analiz akışı için demo yanıtı.",
        }

    return {
        "file_id": data.file_id,
        "type": extension,
        "summary": "Dosya kabul edildi. Bu format için ayrıştırıcı/dönüştürücü akışı eklenebilir.",
    }


@app.post("/prompt")
async def run_prompt(data: PromptRequest) -> dict[str, Any]:
    return {
        "ok": True,
        "mode": "demo",
        "prompt": data.prompt,
        "result": "Panel akışı tamamlandıktan sonra gerçek LLM entegrasyonu eklenebilir.",
    }
