from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import close_db, connect_db
from app.routers import ai, auth, files, groups, logs, records, screens
from app.services.rabbitmq import rpc_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await rpc_client.connect()
    yield
    await rpc_client.close()
    await close_db()


app = FastAPI(title="Final Admin Panel API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(screens.router)
app.include_router(files.router)
app.include_router(ai.router)
app.include_router(records.router)
app.include_router(logs.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
