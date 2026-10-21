from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any

class ApprovalActionRequest(BaseModel):
    operator: str = "operator@agentguard.dev"
    note: str | None = None

class ApprovalResponse(BaseModel):
    id: str
    event_id: str
    status: str
    decided_by: str | None
    decided_at: datetime | None
    expires_at: datetime
    reason: str | None
    event_summary: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)
