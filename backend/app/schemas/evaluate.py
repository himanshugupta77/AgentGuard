from pydantic import BaseModel, ConfigDict
from typing import Any

class TriggeredHeuristic(BaseModel):
    id: str
    name: str
    category: str
    weight: int
    detail: str
    color: str = "text-[#FF1F6B]"

class EvaluationRequest(BaseModel):
    agent_id: str
    task_id: str | None = None
    tool: str     # safe_fs, safe_shell, safe_http
    action: str   # read, write, rename, delete, exec, request
    target: str   # file path, shell command, URL
    args: dict[str, Any] = {}
    stated_intent: str | None = None

    model_config = ConfigDict(extra="allow")

class EvaluationResponse(BaseModel):
    event_id: str
    risk_score: int
    decision: str  # ALLOW, ASK, BLOCK
    reasons: list[TriggeredHeuristic]
    explanation: str
    evidence: dict[str, Any]
    execution_status: str  # executed, rejected, pending_approval
    execution_output: str | None = None
    approval_id: str | None = None
    hash: str
    block_height: int

    model_config = ConfigDict(from_attributes=True)
