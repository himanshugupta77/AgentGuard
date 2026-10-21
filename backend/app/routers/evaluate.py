import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import Agent
from app.models.task import Task
from app.models.event import ToolEvent
from app.models.policy import Policy
from app.models.approval import Approval
from app.models.incident import Incident
from app.schemas.evaluate import EvaluationRequest, EvaluationResponse, TriggeredHeuristic
from app.engine.evaluator import risk_engine
from app.audit.ledger import audit_ledger, GENESIS_HASH
from app.gateway.safe_fs import safe_fs
from app.gateway.safe_shell import safe_shell
from app.gateway.safe_http import safe_http
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/evaluate", tags=["Evaluation Gateway"])

@router.post("", response_model=EvaluationResponse)
async def evaluate_tool_call(
    payload: EvaluationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 1. Resolve Agent (auto-create demo agent if not found)
    agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
    if not agent:
        agent = Agent(id=payload.agent_id, name=f"Agent-{payload.agent_id[:8]}", framework="Custom")
        db.add(agent)
        db.commit()
        db.refresh(agent)

    # 2. Resolve Task and Stated Intent
    task = None
    stated_intent = payload.stated_intent
    workspace_root = "/workspace"
    if payload.task_id:
        task = db.query(Task).filter(Task.id == payload.task_id).first()
        if task:
            if not stated_intent:
                stated_intent = task.stated_intent
            workspace_root = task.workspace_root
    else:
        # Check if agent has an active task
        task = db.query(Task).filter(Task.agent_id == agent.id).order_by(Task.created_at.desc()).first()
        if task:
            if not stated_intent:
                stated_intent = task.stated_intent
            workspace_root = task.workspace_root

    # 3. Fetch active policies from DB (and ensure defaults exist)
    from app.routers.policies import ensure_default_policies
    ensure_default_policies(db)
    db_policies = db.query(Policy).all()

    # 4. Evaluate risk with RiskEngine
    eval_result = risk_engine.evaluate(
        agent_id=payload.agent_id,
        stated_intent=stated_intent,
        workspace_root=workspace_root,
        tool=payload.tool,
        action=payload.action,
        target=payload.target,
        args=payload.args,
        db_policies=db_policies
    )

    risk_score: int = eval_result["risk_score"]
    decision: str = eval_result["decision"]
    reasons: list[TriggeredHeuristic] = eval_result["reasons"]
    explanation: str = eval_result["explanation"]
    evidence: dict = eval_result["evidence"]
    is_simulation: bool = eval_result.get("is_simulation", False) or bool(payload.args.get("dry_run")) or bool(payload.args.get("simulate"))

    # 5. Determine hash-chain link
    last_event = db.query(ToolEvent).order_by(ToolEvent.block_height.desc()).first()
    if last_event:
        prev_hash = last_event.hash
        block_height = last_event.block_height + 1
    else:
        prev_hash = GENESIS_HASH
        block_height = 1

    event_timestamp = datetime.now(timezone.utc)
    event_hash = audit_ledger.compute_event_hash(
        prev_hash=prev_hash,
        block_height=block_height,
        agent_id=payload.agent_id,
        tool=payload.tool,
        action=payload.action,
        target=payload.target,
        risk_score=risk_score,
        decision=decision,
        timestamp=event_timestamp
    )

    # 6. Gateway Execution Handling
    execution_status = "pending"
    execution_output = None
    approval_id = None

    if decision == "ALLOW":
        # Verification requirement: Simulation mode never performs the simulated operation
        if is_simulation:
            execution_status = "simulated_safe"
            execution_output = "[Simulation Mode] Operation permitted under security policy; physical execution withheld to preserve sandbox state."
        else:
            # Execute for real inside sandbox
            execution_status = "executed"
            if payload.tool == "safe_fs":
                if payload.action == "read":
                    res = safe_fs.read(payload.target)
                elif payload.action == "write":
                    content = str(payload.args.get("content", ""))
                    res = safe_fs.write(payload.target, content)
                elif payload.action == "rename":
                    dest = str(payload.args.get("destination", payload.args.get("dest", "")))
                    res = safe_fs.rename(payload.target, dest)
                elif payload.action == "delete":
                    res = safe_fs.delete(payload.target)
                else:
                    res = {"success": True, "message": "FS action permitted"}
                execution_output = json.dumps(res)
            elif payload.tool == "safe_shell":
                res = safe_shell.exec(payload.target)
                execution_output = res.get("stdout") or res.get("stderr") or "Exit code: 0"
            elif payload.tool == "safe_http":
                method = str(payload.args.get("method", "GET"))
                res = safe_http.request(method, payload.target, body=payload.args.get("body"))
                execution_output = json.dumps(res)
            else:
                execution_output = "Operation executed successfully in sandbox."

    elif decision == "ASK":
        execution_status = "pending_approval"
        execution_output = "Operation paused. Awaiting human operator approval."
    else:  # BLOCK
        execution_status = "rejected"
        execution_output = "Hard trap triggered: command terminated at gateway. Host untouched."

    # 7. Create ToolEvent DB Record
    reasons_json = [r.model_dump() for r in reasons]
    event = ToolEvent(
        timestamp=event_timestamp,
        agent_id=payload.agent_id,
        task_id=task.id if task else None,
        tool=payload.tool,
        action=payload.action,
        target=payload.target,
        args=payload.args,
        risk_score=risk_score,
        decision=decision,
        reasons=reasons_json,
        explanation=explanation,
        evidence=evidence,
        hash=event_hash,
        prev_hash=prev_hash,
        block_height=block_height,
        execution_status=execution_status,
        execution_output=execution_output
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # 8. If ASK, create Approval record
    if decision == "ASK":
        approval = Approval(
            event_id=event.id,
            status="pending",
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=60)
        )
        db.add(approval)
        db.commit()
        db.refresh(approval)
        approval_id = approval.id

    # 9. If BLOCK with high severity (>=85), create an Incident record for replay
    if decision == "BLOCK" and risk_score >= 85:
        incident = Incident(
            title=f"Critical Threat: {payload.tool}.{payload.action} on {payload.target}",
            agent_id=payload.agent_id,
            task_id=task.id if task else None,
            severity="critical" if risk_score >= 90 else "high",
            status="quarantined",
            event_ids=[event.id],
            summary=explanation
        )
        db.add(incident)
        db.commit()

    # 10. Broadcast via WebSocket to connected UI clients
    broadcast_data = {
        "event_id": event.id,
        "timestamp": event.timestamp.isoformat(),
        "agent_id": event.agent_id,
        "tool": event.tool,
        "action": event.action,
        "target": event.target,
        "risk_score": event.risk_score,
        "decision": event.decision,
        "execution_status": event.execution_status,
        "explanation": event.explanation,
        "hash": event.hash,
        "block_height": event.block_height,
        "approval_id": approval_id
    }
    background_tasks.add_task(ws_manager.broadcast, "TOOL_EVALUATED", broadcast_data)

    return EvaluationResponse(
        event_id=event.id,
        risk_score=event.risk_score,
        decision=event.decision,
        reasons=reasons,
        explanation=event.explanation,
        evidence=event.evidence,
        execution_status=event.execution_status,
        execution_output=event.execution_output,
        approval_id=approval_id,
        hash=event.hash,
        block_height=event.block_height
    )
