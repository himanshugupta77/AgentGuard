from datetime import datetime
from pydantic import BaseModel, ConfigDict

class TaskCreate(BaseModel):
    agent_id: str
    stated_intent: str
    workspace_root: str = "/workspace"

class TaskResponse(BaseModel):
    id: str
    agent_id: str
    stated_intent: str
    workspace_root: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
