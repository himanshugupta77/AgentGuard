from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.event import ToolEvent
from app.schemas.event import ToolEventResponse, ToolEventDetailResponse, EventListResponse

router = APIRouter(prefix="/events", tags=["Audited Events"])

@router.get("", response_model=EventListResponse)
def list_events(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    decision: str | None = None,
    agent_id: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(ToolEvent)
    
    if decision:
        query = query.filter(ToolEvent.decision == decision.upper())
    if agent_id:
        query = query.filter(ToolEvent.agent_id == agent_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                ToolEvent.target.ilike(search_filter),
                ToolEvent.explanation.ilike(search_filter),
                ToolEvent.tool.ilike(search_filter)
            )
        )

    total = query.count()
    items = query.order_by(ToolEvent.block_height.desc()).offset(offset).limit(limit).all()

    return EventListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset
    )

@router.get("/{event_id}", response_model=ToolEventDetailResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(ToolEvent).filter(ToolEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
