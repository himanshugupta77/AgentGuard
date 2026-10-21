from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.models.event import ToolEvent
from app.schemas.incident import IncidentResponse, IncidentReplayResponse, IncidentReplayItem

router = APIRouter(prefix="/incidents", tags=["Incidents & Replay"])

@router.get("", response_model=list[IncidentResponse])
def list_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).all()

@router.get("/{incident_id}/replay", response_model=IncidentReplayResponse)
def replay_incident(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    timeline: list[IncidentReplayItem] = []
    # If incident has specific event_ids, fetch those; otherwise fetch events by agent_id
    if incident.event_ids:
        events = db.query(ToolEvent).filter(ToolEvent.id.in_(incident.event_ids)).order_by(ToolEvent.block_height.asc()).all()
    else:
        events = db.query(ToolEvent).filter(ToolEvent.agent_id == incident.agent_id).order_by(ToolEvent.block_height.asc()).limit(10).all()

    for idx, ev in enumerate(events, 1):
        timeline.append(IncidentReplayItem(
            step=idx,
            event_id=ev.id,
            timestamp=ev.timestamp,
            tool=ev.tool,
            action=ev.action,
            target=ev.target,
            risk_score=ev.risk_score,
            decision=ev.decision,
            explanation=ev.explanation
        ))

    return IncidentReplayResponse(
        incident=IncidentResponse.model_validate(incident),
        timeline=timeline
    )
