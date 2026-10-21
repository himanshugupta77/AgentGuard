from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AgentCreate(BaseModel):
    name: str
    framework: str = "Custom"  # LangChain, AutoGen, CrewAI, Custom

class AgentResponse(BaseModel):
    id: str
    name: str
    framework: str
    api_key: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
