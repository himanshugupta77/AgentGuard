from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentResponse

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.post("", response_model=AgentResponse)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)):
    agent = Agent(name=payload.name, framework=payload.framework)
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent

@router.get("", response_model=list[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    return db.query(Agent).order_by(Agent.created_at.desc()).all()

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
