import hashlib
import json
from datetime import datetime
from typing import Any

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class AuditLedger:
    """Cryptographic append-only hash chain for verifiable event auditability."""

    @staticmethod
    def canonical_json(data: dict[str, Any]) -> str:
        """Serializes data deterministically for cryptographic hashing."""
        def default_serializer(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            return str(obj)

        return json.dumps(data, sort_keys=True, separators=(',', ':'), default=default_serializer)

    @classmethod
    def compute_event_hash(
        cls,
        prev_hash: str,
        block_height: int,
        agent_id: str,
        tool: str,
        action: str,
        target: str,
        risk_score: int,
        decision: str,
        timestamp: datetime
    ) -> str:
        """Computes SHA-256 hash chaining the previous block hash with canonical event state."""
        if isinstance(timestamp, datetime):
            from datetime import timezone
            if timestamp.tzinfo is None:
                ts_val = timestamp.replace(tzinfo=timezone.utc)
            else:
                ts_val = timestamp.astimezone(timezone.utc)
            ts_str = ts_val.isoformat()
        else:
            ts_str = str(timestamp)

        payload = {
            "block_height": block_height,
            "prev_hash": prev_hash,
            "agent_id": agent_id,
            "tool": tool,
            "action": action,
            "target": target,
            "risk_score": risk_score,
            "decision": decision,
            "timestamp": ts_str
        }
        canonical_str = cls.canonical_json(payload)
        hasher = hashlib.sha256()
        hasher.update(canonical_str.encode('utf-8'))
        return hasher.hexdigest()

    @classmethod
    def verify_chain(cls, events: list[Any]) -> tuple[bool, list[int], str | None, str | None]:
        """
        Verifies the integrity of the audit hash chain from genesis to head.
        Returns: (is_valid, list_of_tampered_block_heights, genesis_hash, head_hash)
        """
        if not events:
            return True, [], None, None

        # Sort strictly by block height ascending
        sorted_events = sorted(events, key=lambda e: e.block_height)
        tampered_blocks: list[int] = []
        expected_prev_hash = GENESIS_HASH

        for idx, event in enumerate(sorted_events):
            # Check link to previous block
            if event.prev_hash != expected_prev_hash:
                tampered_blocks.append(event.block_height)

            # Recompute expected hash for this block
            expected_hash = cls.compute_event_hash(
                prev_hash=event.prev_hash,
                block_height=event.block_height,
                agent_id=event.agent_id,
                tool=event.tool,
                action=event.action,
                target=event.target,
                risk_score=event.risk_score,
                decision=event.decision,
                timestamp=event.timestamp
            )

            if event.hash != expected_hash:
                if event.block_height not in tampered_blocks:
                    tampered_blocks.append(event.block_height)

            expected_prev_hash = event.hash

        genesis_hash = sorted_events[0].hash if sorted_events else None
        head_hash = sorted_events[-1].hash if sorted_events else None
        is_valid = len(tampered_blocks) == 0

        return is_valid, tampered_blocks, genesis_hash, head_hash

audit_ledger = AuditLedger()
