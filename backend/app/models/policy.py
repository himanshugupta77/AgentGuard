from sqlalchemy import Column, String, Integer, Boolean, Text, JSON
from app.database import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String, primary_key=True)  # e.g. POL-SHELL-RECURSIVE, POL-PATH-TRAVERSAL
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # shell, path, sensitivity, intent, burst, network
    params = Column(JSON, default=dict)    # configurable targets, patterns, limits
    enabled = Column(Boolean, default=True)
    weight = Column(Integer, default=20)   # added to risk score when triggered
    description = Column(Text, nullable=True)
