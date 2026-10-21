from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any

class IncidentResponse(BaseModel):
    id: str
    title: str
    agent_id: str
    task_id: str | None
    severity: str
    status: str
    event_ids: list[str]
    summary: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IncidentReplayItem(BaseModel):
    step: int
    event_id: str
    timestamp: datetime
    tool: str
    action: str
    target: str
    risk_score: int
    decision: str
    explanation: str

class IncidentReplayResponse(BaseModel):
    incident: IncidentResponse
    timeline: list[IncidentReplayItem]
