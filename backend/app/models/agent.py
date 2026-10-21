import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    framework = Column(String, default="Custom")  # LangChain, AutoGen, CrewAI, Custom
    api_key = Column(String, unique=True, index=True, nullable=False, default=lambda: f"ag_live_{uuid.uuid4().hex[:16]}")
    status = Column(String, default="active")  # active, paused, revoked
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    tasks = relationship("Task", back_populates="agent", cascade="all, delete-orphan")
    events = relationship("ToolEvent", back_populates="agent")
