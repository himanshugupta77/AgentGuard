from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import Agent
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("", response_model=TaskResponse)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{payload.agent_id}' not found")

    task = Task(
        agent_id=payload.agent_id,
        stated_intent=payload.stated_intent,
        workspace_root=payload.workspace_root
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("", response_model=list[TaskResponse])
def list_tasks(agent_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Task)
    if agent_id:
        query = query.filter(Task.agent_id == agent_id)
    return query.order_by(Task.created_at.desc()).all()
