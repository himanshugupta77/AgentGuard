def test_approval_flow_allow(client):
    # Safe file edit -> ALLOW
    res = client.post("/api/evaluate", json={
        "agent_id": "agent-test-approve",
        "tool": "safe_fs",
        "action": "write",
        "target": "docs/safe_run.txt",
        "args": {"content": "Verified safe"}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "ALLOW"
    assert data["approval_id"] is None
    assert data["execution_status"] == "executed"

def test_approval_flow_ask_and_approve(client):
    # Bulk mutation -> ASK
    res = client.post("/api/evaluate", json={
        "agent_id": "agent-test-approve",
        "tool": "safe_fs",
        "action": "rename",
        "target": "assets/*",
        "args": {"affected_count": 48}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "ASK"
    approval_id = data["approval_id"]
    assert approval_id is not None
    assert data["execution_status"] == "pending_approval"

    # Query approvals list
    list_res = client.get("/api/approvals?status=pending")
    assert list_res.status_code == 200
    pending_list = list_res.json()
    assert any(a["id"] == approval_id for a in pending_list)

    # Approve action
    apprv_res = client.post(f"/api/approvals/{approval_id}/approve", json={
        "operator": "admin@agentguard.dev",
        "note": "Operator verified bulk rename validity"
    })
    assert apprv_res.status_code == 200
    apprv_data = apprv_res.json()
    assert apprv_data["status"] == "approved"
    assert apprv_data["decided_by"] == "admin@agentguard.dev"

def test_approval_flow_ask_and_deny(client):
    # Another ASK scenario
    res = client.post("/api/evaluate", json={
        "agent_id": "agent-test-deny",
        "tool": "safe_http",
        "action": "request",
        "target": "https://unregistered-endpoint.org/sync"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "ASK"
    approval_id = data["approval_id"]
    assert approval_id is not None

    # Deny action
    deny_res = client.post(f"/api/approvals/{approval_id}/deny", json={
        "operator": "admin@agentguard.dev",
        "note": "Suspicious external destination"
    })
    assert deny_res.status_code == 200
    assert deny_res.json()["status"] == "denied"
