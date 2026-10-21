from app.routers.agents import router as agents_router
from app.routers.tasks import router as tasks_router
from app.routers.evaluate import router as evaluate_router
from app.routers.events import router as events_router
from app.routers.approvals import router as approvals_router
from app.routers.policies import router as policies_router
from app.routers.stats import router as stats_router
from app.routers.incidents import router as incidents_router
from app.routers.audit import router as audit_router

__all__ = [
    "agents_router",
    "tasks_router",
    "evaluate_router",
    "events_router",
    "approvals_router",
    "policies_router",
    "stats_router",
    "incidents_router",
    "audit_router",
]
