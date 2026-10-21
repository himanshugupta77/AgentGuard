import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from app.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=lambda: f"INC-{uuid.uuid4().hex[:6].upper()}")
    title = Column(String, nullable=False)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    task_id = Column(String, nullable=True)
    severity = Column(String, default="high")  # critical, high, medium, low
    status = Column(String, default="quarantined")  # quarantined, reviewed, resolved
    event_ids = Column(JSON, default=list)  # list of associated tool_event ids
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
