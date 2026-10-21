import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class ToolEvent(Base):
    __tablename__ = "tool_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False, index=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=True, index=True)
    
    # Tool call details
    tool = Column(String, nullable=False)      # safe_fs, safe_shell, safe_http
    action = Column(String, nullable=False)    # read, write, rename, delete, exec, request
    target = Column(String, nullable=False)    # file path, command string, URL
    args = Column(JSON, default=dict)          # parsed arguments dict
    
    # Risk evaluation
    risk_score = Column(Integer, nullable=False)  # 0 to 100
    decision = Column(String, nullable=False, index=True)    # ALLOW, ASK, BLOCK
    reasons = Column(JSON, default=list)          # list of triggered heuristic IDs
    explanation = Column(Text, nullable=False)    # Plain-English explanation
    evidence = Column(JSON, default=dict)         # Detailed evidence payload
    
    # Cryptographic hash chain (SHA-256)
    hash = Column(String, nullable=False, index=True)
    prev_hash = Column(String, nullable=False)
    block_height = Column(Integer, nullable=False, index=True)
    
    # Execution status
    execution_status = Column(String, default="pending")  # executed, rejected, pending_approval, denied
    execution_output = Column(Text, nullable=True)
    
    # Relationships
    agent = relationship("Agent", back_populates="events")
    task = relationship("Task", back_populates="events")
    approval = relationship("Approval", back_populates="event", uselist=False, cascade="all, delete-orphan")
