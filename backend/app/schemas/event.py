from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any

class ToolEventResponse(BaseModel):
    id: str
    timestamp: datetime
    agent_id: str
    task_id: str | None
    tool: str
    action: str
    target: str
    risk_score: int
    decision: str
    execution_status: str
    hash: str
    block_height: int

    model_config = ConfigDict(from_attributes=True)

class ToolEventDetailResponse(ToolEventResponse):
    args: dict[str, Any]
    reasons: list[Any]
    explanation: str
    evidence: dict[str, Any]
    prev_hash: str
    execution_output: str | None

class EventListResponse(BaseModel):
    items: list[ToolEventResponse]
    total: int
    limit: int
    offset: int
