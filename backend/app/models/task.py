import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    stated_intent = Column(String, nullable=False)
    workspace_root = Column(String, nullable=False, default="/workspace")
    status = Column(String, default="running")  # running, completed, aborted
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="tasks")
    events = relationship("ToolEvent", back_populates="task")
