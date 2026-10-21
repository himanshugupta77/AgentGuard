from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.gateway.sandbox import sandbox_manager
from app.routers.policies import ensure_default_policies
from app.routers import (
    agents_router,
    tasks_router,
    evaluate_router,
    events_router,
    approvals_router,
    policies_router,
    stats_router,
    incidents_router,
    audit_router
)
from app.websocket.manager import ws_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables, seed default policies, initialize physical sandbox
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_default_policies(db)
    finally:
        db.close()
    sandbox_manager.initialize_sandbox()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="AgentGuard API",
    description="Intelligent Runtime Security for Autonomous AI Agents — Hack-A-Throne 2026",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(agents_router, prefix=settings.API_PREFIX)
app.include_router(tasks_router, prefix=settings.API_PREFIX)
app.include_router(evaluate_router, prefix=settings.API_PREFIX)
app.include_router(events_router, prefix=settings.API_PREFIX)
app.include_router(approvals_router, prefix=settings.API_PREFIX)
app.include_router(policies_router, prefix=settings.API_PREFIX)
app.include_router(stats_router, prefix=settings.API_PREFIX)
app.include_router(incidents_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep socket open and receive heartbeat/messages from client
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.get("/health")
@app.get(f"{settings.API_PREFIX}/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "runtime_gateway"
    }

@app.get("/")
def root():
    return {
        "service": "AgentGuard Runtime Gateway",
        "tagline": "Let AI act. Keep humans in control.",
        "docs": "/docs",
        "health": "/health"
    }
