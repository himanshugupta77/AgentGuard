from datetime import datetime
from pydantic import BaseModel

class DecisionMix(BaseModel):
    allow_pct: float
    ask_pct: float
    block_pct: float
    allow_count: int
    ask_count: int
    block_count: int

class RiskTimePoint(BaseModel):
    time: str
    score: int
    decision: str
    target: str

class StatsSummaryResponse(BaseModel):
    total_inspected: int
    human_interventions: int
    hard_blocks: int
    avg_overhead_ms: float
    active_agents: int
    decision_mix: DecisionMix
    risk_over_time: list[RiskTimePoint]

class AuditVerifyResponse(BaseModel):
    valid: bool
    total_blocks: int
    genesis_hash: str | None
    head_hash: str | None
    tampered_blocks: list[int]
    verified_at: datetime
