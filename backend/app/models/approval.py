import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String, ForeignKey("tool_events.id"), unique=True, nullable=False, index=True)
    status = Column(String, default="pending", index=True)  # pending, approved, denied, expired
    decided_by = Column(String, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc) + timedelta(seconds=60))
    reason = Column(Text, nullable=True)

    event = relationship("ToolEvent", back_populates="approval")
