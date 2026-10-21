import pytest
from datetime import datetime, timezone
from app.audit.ledger import audit_ledger, GENESIS_HASH

class MockEvent:
    def __init__(self, block_height, prev_hash, hash_val, agent_id, tool, action, target, risk_score, decision, timestamp):
        self.block_height = block_height
        self.prev_hash = prev_hash
        self.hash = hash_val
        self.agent_id = agent_id
        self.tool = tool
        self.action = action
        self.target = target
        self.risk_score = risk_score
        self.decision = decision
        self.timestamp = timestamp

def test_audit_ledger_valid_chain():
    now = datetime.now(timezone.utc)
    
    # Block 1
    h1 = audit_ledger.compute_event_hash(
        prev_hash=GENESIS_HASH,
        block_height=1,
        agent_id="agent-1",
        tool="safe_fs",
        action="read",
        target="docs/README.md",
        risk_score=10,
        decision="ALLOW",
        timestamp=now
    )
    b1 = MockEvent(1, GENESIS_HASH, h1, "agent-1", "safe_fs", "read", "docs/README.md", 10, "ALLOW", now)

    # Block 2
    h2 = audit_ledger.compute_event_hash(
        prev_hash=h1,
        block_height=2,
        agent_id="agent-1",
        tool="safe_fs",
        action="write",
        target="docs/output.txt",
        risk_score=14,
        decision="ALLOW",
        timestamp=now
    )
    b2 = MockEvent(2, h1, h2, "agent-1", "safe_fs", "write", "docs/output.txt", 14, "ALLOW", now)

    # Block 3
    h3 = audit_ledger.compute_event_hash(
        prev_hash=h2,
        block_height=3,
        agent_id="agent-2",
        tool="safe_shell",
        action="exec",
        target="rm -rf ./src/",
        risk_score=92,
        decision="BLOCK",
        timestamp=now
    )
    b3 = MockEvent(3, h2, h3, "agent-2", "safe_shell", "exec", "rm -rf ./src/", 92, "BLOCK", now)

    is_valid, tampered, genesis_h, head_h = audit_ledger.verify_chain([b1, b2, b3])
    assert is_valid is True
    assert len(tampered) == 0
    assert genesis_h == h1
    assert head_h == h3

def test_audit_ledger_detects_tampering():
    now = datetime.now(timezone.utc)
    h1 = audit_ledger.compute_event_hash(GENESIS_HASH, 1, "agent-1", "safe_fs", "read", "docs/README.md", 10, "ALLOW", now)
    b1 = MockEvent(1, GENESIS_HASH, h1, "agent-1", "safe_fs", "read", "docs/README.md", 10, "ALLOW", now)

    h2 = audit_ledger.compute_event_hash(h1, 2, "agent-1", "safe_fs", "write", "docs/output.txt", 14, "ALLOW", now)
    b2 = MockEvent(2, h1, h2, "agent-1", "safe_fs", "write", "docs/output.txt", 14, "ALLOW", now)

    # Tamper block 1 by modifying target without updating hash
    b1.target = "MODIFIED_TARGET_UNAUTHORIZED.txt"

    is_valid, tampered, _, _ = audit_ledger.verify_chain([b1, b2])
    assert is_valid is False
    assert 1 in tampered
