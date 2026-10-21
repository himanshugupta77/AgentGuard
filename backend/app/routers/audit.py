import io
import csv
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import ToolEvent
from app.audit.ledger import audit_ledger
from app.schemas.stats import AuditVerifyResponse

router = APIRouter(prefix="/audit", tags=["Audit Verification & Export"])

@router.get("/verify", response_model=AuditVerifyResponse)
def verify_audit_chain(db: Session = Depends(get_db)):
    events = db.query(ToolEvent).order_by(ToolEvent.block_height.asc()).all()
    is_valid, tampered_blocks, genesis_hash, head_hash = audit_ledger.verify_chain(events)

    return AuditVerifyResponse(
        valid=is_valid,
        total_blocks=len(events),
        genesis_hash=genesis_hash,
        head_hash=head_hash,
        tampered_blocks=tampered_blocks,
        verified_at=datetime.now(timezone.utc)
    )

@router.get("/export")
def export_audit_log(
    format: str = Query("json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db)
):
    events = db.query(ToolEvent).order_by(ToolEvent.block_height.asc()).all()

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["block_height", "timestamp", "agent_id", "tool", "action", "target", "risk_score", "decision", "hash", "prev_hash"])
        for e in events:
            writer.writerow([
                e.block_height,
                e.timestamp.isoformat() if e.timestamp else "",
                e.agent_id,
                e.tool,
                e.action,
                e.target,
                e.risk_score,
                e.decision,
                e.hash,
                e.prev_hash
            ])
        csv_data = output.getvalue()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=agentguard_audit_log.csv"}
        )
    else:
        records = []
        for e in events:
            records.append({
                "block_height": e.block_height,
                "timestamp": e.timestamp.isoformat() if e.timestamp else "",
                "agent_id": e.agent_id,
                "tool": e.tool,
                "action": e.action,
                "target": e.target,
                "risk_score": e.risk_score,
                "decision": e.decision,
                "explanation": e.explanation,
                "execution_status": e.execution_status,
                "hash": e.hash,
                "prev_hash": e.prev_hash
            })
        json_data = json.dumps(records, indent=2)
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=agentguard_audit_log.json"}
        )
