def test_agents_crud(client):
    create_res = client.post("/api/agents", json={
        "name": "AutoDev-Agent-v3",
        "framework": "LangChain"
    })
    assert create_res.status_code == 200
    agent = create_res.json()
    assert agent["name"] == "AutoDev-Agent-v3"
    assert agent["framework"] == "LangChain"
    assert agent["api_key"].startswith("ag_live_")

    list_res = client.get("/api/agents")
    assert list_res.status_code == 200
    agents = list_res.json()
    assert any(a["id"] == agent["id"] for a in agents)

def test_tasks_crud(client):
    # First create agent
    agent = client.post("/api/agents", json={"name": "TaskAgent"}).json()
    task_res = client.post("/api/tasks", json={
        "agent_id": agent["id"],
        "stated_intent": "Organize project assets in /workspace",
        "workspace_root": "/workspace"
    })
    assert task_res.status_code == 200
    task = task_res.json()
    assert task["stated_intent"] == "Organize project assets in /workspace"

def test_evaluate_and_events_flow(client):
    eval_res = client.post("/api/evaluate", json={
        "agent_id": "test-eval-agent",
        "tool": "safe_shell",
        "action": "exec",
        "target": "rm -rf ./src/"
    })
    assert eval_res.status_code == 200
    data = eval_res.json()
    assert data["decision"] == "BLOCK"
    assert data["risk_score"] >= 70

    events_res = client.get("/api/events?limit=10")
    assert events_res.status_code == 200
    events = events_res.json()
    assert events["total"] >= 1
    assert any(e["id"] == data["event_id"] for e in events["items"])

    detail_res = client.get(f"/api/events/{data['event_id']}")
    assert detail_res.status_code == 200
    assert detail_res.json()["decision"] == "BLOCK"

def test_policies_and_thresholds(client):
    policies_res = client.get("/api/policies")
    assert policies_res.status_code == 200
    data = policies_res.json()
    assert len(data["policies"]) >= 5
    assert "thresholds" in data

    # Update thresholds
    thresh_res = client.put("/api/policies/thresholds", json={
        "allow_max": 25,
        "ask_max": 65
    })
    assert thresh_res.status_code == 200
    assert thresh_res.json()["allow_max"] == 25
    assert thresh_res.json()["ask_max"] == 65

    # Restore defaults
    from app.config import settings
    settings.ALLOW_MAX_SCORE = 29
    settings.ASK_MAX_SCORE = 69

def test_stats_endpoint(client):
    stats_res = client.get("/api/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_inspected" in stats
    assert "decision_mix" in stats
    assert "risk_over_time" in stats

def test_audit_verify_endpoint(client):
    verify_res = client.get("/api/audit/verify")
    assert verify_res.status_code == 200
    audit = verify_res.json()
    assert "valid" in audit
    assert audit["valid"] is True
    assert "total_blocks" in audit

def test_audit_export_csv_and_json(client):
    json_res = client.get("/api/audit/export?format=json")
    assert json_res.status_code == 200
    assert json_res.headers["content-type"] == "application/json"

    csv_res = client.get("/api/audit/export?format=csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
