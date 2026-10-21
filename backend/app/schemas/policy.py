from pydantic import BaseModel, ConfigDict
from typing import Any

class PolicyCreate(BaseModel):
    id: str
    name: str
    type: str
    params: dict[str, Any] = {}
    enabled: bool = True
    weight: int = 20
    description: str | None = None

class PolicyUpdate(BaseModel):
    name: str | None = None
    enabled: bool | None = None
    weight: int | None = None
    params: dict[str, Any] | None = None
    description: str | None = None

class PolicyResponse(BaseModel):
    id: str
    name: str
    type: str
    params: dict[str, Any]
    enabled: bool
    weight: int
    description: str | None

    model_config = ConfigDict(from_attributes=True)

class ThresholdsUpdate(BaseModel):
    allow_max: int
    ask_max: int

class ThresholdsResponse(BaseModel):
    allow_max: int
    ask_max: int
    block_min: int
