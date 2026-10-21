import time
from collections import defaultdict
from threading import Lock
from typing import Any
from app.config import settings
from app.schemas.evaluate import TriggeredHeuristic

class BurstTracker:
    """Tracks frequency of agent mutations in a sliding time window and bulk parameter mutations."""

    def __init__(self, window_seconds: int = 10, count_threshold: int = 10):
        self.window_seconds = window_seconds
        self.count_threshold = count_threshold
        # agent_id -> list of timestamps
        self._history: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def record_and_evaluate(
        self,
        agent_id: str,
        action: str,
        args: dict[str, Any] | None = None,
        policy_weights: dict[str, int] | None = None
    ) -> list[TriggeredHeuristic]:
        heuristics: list[TriggeredHeuristic] = []
        weights = policy_weights or {}
        now = time.time()

        # 1. Check for bulk item count parameter (e.g. affected_count: 48)
        if args:
            item_count = args.get("affected_count") or args.get("file_count") or args.get("count")
            if isinstance(item_count, (int, float)) and item_count > 10:
                heuristics.append(TriggeredHeuristic(
                    id="POL-BURST-BULK-AFFECTED-COUNT",
                    name="Bulk Item Mutation Threshold Exceeded",
                    category="burst",
                    weight=weights.get("POL-BURST-BULK-AFFECTED-COUNT", 35),
                    detail=f"Single action impacts {int(item_count)} files (Safety threshold: 10).",
                    color="text-[#FFBD6B]"
                ))

        # 2. Sliding window check for rapid bursts
        if action in ["write", "rename", "delete", "unlink"]:
            with self._lock:
                timestamps = self._history[agent_id]
                # Filter out expired timestamps
                cutoff = now - self.window_seconds
                self._history[agent_id] = [t for t in timestamps if t > cutoff]
                # Record this event
                self._history[agent_id].append(now)
                current_count = len(self._history[agent_id])

            if current_count >= self.count_threshold:
                heuristics.append(TriggeredHeuristic(
                    id="POL-BURST-HIGH-FREQUENCY",
                    name="High Velocity Mutation Burst",
                    category="burst",
                    weight=weights.get("POL-BURST-HIGH-FREQUENCY", 35),
                    detail=f"Agent issued {current_count} mutations in {self.window_seconds}s (Threshold: {self.count_threshold}).",
                    color="text-[#FFBD6B]"
                ))

        return heuristics

    def reset(self):
        with self._lock:
            self._history.clear()
