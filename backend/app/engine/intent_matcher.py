import re
from typing import Any
from app.config import settings
from app.schemas.evaluate import TriggeredHeuristic

class IntentMatcher:
    """Detects intent-versus-action mismatches between stated user tasks and tool operations."""

    BENIGN_INTENT_PATTERNS = {
        "organize": r'\b(organize|sort|archive|clean\s+cache|clean\s+directory|clean\s+assets|manage\s+files)\b',
        "documentation": r'\b(format|report|docs|markdown|readme|lint|review|view|summarize|edit\s+docs)\b',
        "read_only": r'\b(read|analyze|inspect|audit|check|browse)\b',
        "coding": r'\b(style|css|html|frontend|landing|component|add\s+unit\s+test|test|unit\s+test)\b',
        "formatting": r'\b(format|formatting|indent|reformat|beautify|consistent\s+formatting|prettier|style)\b',
    }

    DESTRUCTIVE_ACTIONS = {
        "recursive_delete": r'\b(rm\s+-[a-zA-Z]*r|rmdir\s+/s|recursively\s+delete|del\s+/s|shutil\.rmtree)\b',
        "sql_destroy": r'\b(drop\s+table|drop\s+database|truncate|delete\s+from)\b',
        "core_wipe": r'(\./src/|/src/|src/\*|\.git/|\./workspace|/workspace)',
        "secret_read": r'(\.env|id_rsa|credentials|\.aws|\.ssh|shadow|passwd)',
    }

    def evaluate(
        self,
        stated_intent: str,
        tool: str,
        action: str,
        target: str,
        args: dict[str, Any] | None = None,
        policy_weights: dict[str, int] | None = None
    ) -> list[TriggeredHeuristic]:
        heuristics: list[TriggeredHeuristic] = []
        if not stated_intent or not stated_intent.strip():
            return heuristics

        weights = policy_weights or {}
        intent_lower = stated_intent.lower()
        target_lower = target.lower()

        # Deterministic semantic dissonance classification
        is_benign_intent = (
            re.search(self.BENIGN_INTENT_PATTERNS["organize"], intent_lower) or
            re.search(self.BENIGN_INTENT_PATTERNS["documentation"], intent_lower) or
            re.search(self.BENIGN_INTENT_PATTERNS["read_only"], intent_lower) or
            re.search(self.BENIGN_INTENT_PATTERNS["coding"], intent_lower) or
            re.search(self.BENIGN_INTENT_PATTERNS["formatting"], intent_lower)
        )

        is_destructive_action = (
            action in ["delete", "unlink", "truncate", "destroy", "wipe"] or
            bool(re.search(self.DESTRUCTIVE_ACTIONS["recursive_delete"], target_lower)) or
            bool(re.search(self.DESTRUCTIVE_ACTIONS["sql_destroy"], target_lower)) or
            "rm -rf" in target_lower or
            "drop table" in target_lower
        )

        is_core_wipe_action = (
            is_destructive_action or
            bool(re.search(r'\b(rm|del|erase|remove|unlink|wipe|destroy|purge|truncate)\b', target_lower))
        )
        is_core_wipe = is_core_wipe_action and bool(re.search(self.DESTRUCTIVE_ACTIONS["core_wipe"], target_lower))
        is_secret_access = bool(re.search(self.DESTRUCTIVE_ACTIONS["secret_read"], target_lower))

        if is_benign_intent and is_destructive_action:
            heuristics.append(TriggeredHeuristic(
                id="POL-INTENT-ACTION-MISMATCH",
                name="Task Intent vs Action Mismatch",
                category="intent",
                weight=weights.get("POL-INTENT-ACTION-MISMATCH", 50),
                detail=f"Task intent was '{stated_intent}', but agent requested destructive operation '{target}'.",
                color="text-[#FF1F6B]"
            ))
        elif is_benign_intent and (is_secret_access or is_core_wipe):
            heuristics.append(TriggeredHeuristic(
                id="POL-INTENT-ACTION-MISMATCH",
                name="Task Intent vs Action Mismatch",
                category="intent",
                weight=weights.get("POL-INTENT-ACTION-MISMATCH", 50),
                detail=f"Task intent '{stated_intent}' does not justify operating on sensitive resource '{target}'.",
                color="text-[#FF1F6B]"
            ))

        return heuristics
