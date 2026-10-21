import re
from urllib.parse import urlparse
from typing import Any
from app.schemas.evaluate import TriggeredHeuristic

class NetworkInspector:
    """Inspects outbound network destinations, domain allowlists, and exfiltration payloads."""

    DEFAULT_ALLOWED_DOMAINS = [
        "localhost",
        "127.0.0.1",
        "api.internal.corp",
        "github.com",
        "api.github.com",
        "raw.githubusercontent.com",
        "registry.npmjs.org",
        "pypi.org"
    ]

    EXFIL_PATTERNS = [
        r'AKIA[0-9A-Z]{16}',
        r'sk-[a-zA-Z0-9]{32,}',
        r'ghp_[a-zA-Z0-9]{36}',
        r'ey[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}',
        r'AWS_SECRET_ACCESS_KEY',
        r'PRIVATE KEY'
    ]

    def evaluate(
        self,
        url_or_target: str,
        args: dict[str, Any] | None = None,
        policy_weights: dict[str, int] | None = None
    ) -> list[TriggeredHeuristic]:
        heuristics: list[TriggeredHeuristic] = []
        weights = policy_weights or {}

        # Parse host/domain
        clean = url_or_target.strip()
        if not clean.startswith("http://") and not clean.startswith("https://"):
            clean = "http://" + clean

        parsed = urlparse(clean)
        host = (parsed.hostname or "").lower()

        # 1. Non-allowlisted domain check
        if host and host not in self.DEFAULT_ALLOWED_DOMAINS:
            # Check if domain looks like an external command-and-control or unapproved public server
            heuristics.append(TriggeredHeuristic(
                id="POL-NETWORK-UNAPPROVED-DOMAIN",
                name="Outbound Egress to Non-Allowlisted Host",
                category="network",
                weight=weights.get("POL-NETWORK-UNAPPROVED-DOMAIN", 35),
                detail=f"Outbound network request targeting unapproved host '{host}'.",
                color="text-[#FFBD6B]"
            ))

        # 2. Payload secret exfiltration check
        payload_str = ""
        if args:
            payload_str = str(args.get("body") or args.get("data") or args.get("headers") or "")

        for pattern in self.EXFIL_PATTERNS:
            if re.search(pattern, payload_str, re.IGNORECASE):
                heuristics.append(TriggeredHeuristic(
                    id="POL-NETWORK-SECRET-EXFIL",
                    name="Network Credential Exfiltration Attempt",
                    category="network",
                    weight=weights.get("POL-NETWORK-SECRET-EXFIL", 65),
                    detail="Outbound request payload contains high-entropy credentials or environment secrets.",
                    color="text-[#FF1F6B]"
                ))
                break

        return heuristics
