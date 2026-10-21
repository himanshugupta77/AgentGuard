import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.approval import Approval
from app.models.event import ToolEvent
from app.schemas.approval import ApprovalActionRequest, ApprovalResponse
from app.gateway.safe_fs import safe_fs
from app.gateway.safe_shell import safe_shell
from app.gateway.safe_http import safe_http
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/approvals", tags=["Human Approvals"])

@router.get("", response_model=list[ApprovalResponse])
def list_approvals(status: str | None = None, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    # Check for expired pending approvals
    pending = db.query(Approval).filter(Approval.status == "pending").all()
    for apprv in pending:
        # If expires_at has passed, mark expired
        exp = apprv.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if now > exp:
            apprv.status = "expired"
            if apprv.event:
                apprv.event.execution_status = "expired"
                apprv.event.execution_output = "Approval timed out after 60s without operator response."
    db.commit()

    query = db.query(Approval)
    if status and status != "all":
        query = query.filter(Approval.status == status)

    approvals = query.order_by(Approval.expires_at.desc()).all()
    res = []
    for a in approvals:
        ev_summary = None
        if a.event:
            ev_summary = {
                "tool": a.event.tool,
                "action": a.event.action,
                "target": a.event.target,
                "risk_score": a.event.risk_score,
                "explanation": a.event.explanation,
                "agent_id": a.event.agent_id,
                "timestamp": a.event.timestamp.isoformat()
            }
        item = ApprovalResponse(
            id=a.id,
            event_id=a.event_id,
            status=a.status,
            decided_by=a.decided_by,
            decided_at=a.decided_at,
            expires_at=a.expires_at,
            reason=a.reason,
            event_summary=ev_summary
        )
        res.append(item)
    return res

@router.post("/{approval_id}/approve", response_model=ApprovalResponse)
async def approve_action(
    approval_id: str,
    payload: ApprovalActionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.status != "pending":
        raise HTTPException(status_code=400, detail=f"Approval is already in state '{approval.status}'")

    approval.status = "approved"
    approval.decided_by = payload.operator
    approval.decided_at = datetime.now(timezone.utc)
    approval.reason = payload.note or "Operator approved via dashboard"

    # Execute held action in sandbox
    event = approval.event
    exec_output = "Action executed after operator authorization."
    if event:
        event.execution_status = "executed"
        if event.tool == "safe_fs":
            if event.action == "read":
                res = safe_fs.read(event.target)
            elif event.action == "write":
                res = safe_fs.write(event.target, event.args.get("content", ""))
            elif event.action == "rename":
                dest = event.args.get("destination", event.args.get("dest", ""))
                res = safe_fs.rename(event.target, dest)
            elif event.action == "delete":
                res = safe_fs.delete(event.target)
            else:
                res = {"success": True}
            exec_output = json.dumps(res)
        elif event.tool == "safe_shell":
            res = safe_shell.exec(event.target)
            exec_output = res.get("stdout") or res.get("stderr") or "Exit code: 0"
        elif event.tool == "safe_http":
            res = safe_http.request(event.args.get("method", "GET"), event.target, body=event.args.get("body"))
            exec_output = json.dumps(res)

        event.execution_output = exec_output

    db.commit()
    db.refresh(approval)

    background_tasks.add_task(
        ws_manager.broadcast,
        "APPROVAL_RESOLVED",
        {"approval_id": approval.id, "status": "approved", "operator": payload.operator}
    )

    return approval

@router.post("/{approval_id}/deny", response_model=ApprovalResponse)
async def deny_action(
    approval_id: str,
    payload: ApprovalActionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.status != "pending":
        raise HTTPException(status_code=400, detail=f"Approval is already in state '{approval.status}'")

    approval.status = "denied"
    approval.decided_by = payload.operator
    approval.decided_at = datetime.now(timezone.utc)
    approval.reason = payload.note or "Operator denied action via dashboard"

    if approval.event:
        approval.event.execution_status = "denied"
        approval.event.execution_output = "Operation discarded safely: denied by operator."

    db.commit()
    db.refresh(approval)

    background_tasks.add_task(
        ws_manager.broadcast,
        "APPROVAL_RESOLVED",
        {"approval_id": approval.id, "status": "denied", "operator": payload.operator}
    )

    return approval

@router.post("/{approval_id}/resolve", response_model=ApprovalResponse)
async def resolve_action(
    approval_id: str,
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    action = payload.get("action", "approve")
    operator = payload.get("operator", "Operator-Admin")
    note = payload.get("note", f"Action {action}d via resolve endpoint")
    req = ApprovalActionRequest(operator=operator, note=note)
    if action == "deny":
        return await deny_action(approval_id, req, background_tasks, db)
    return await approve_action(approval_id, req, background_tasks, db)
