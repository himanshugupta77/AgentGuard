import re
from typing import Any
from app.schemas.evaluate import TriggeredHeuristic

class SensitivityScanner:
    """Detects secrets, credentials, environment keys, and sensitive tokens."""

    SECRET_FILE_PATTERNS = [
        r'\.env(\..+)?$',
        r'id_(?:rsa|dsa|ecdsa|ed25519)(\.pub)?$',
        r'.*credentials.*$',
        r'.*service[_-]?account.*\.json$',
        r'.*\.pem$',
        r'.*\.key$',
        r'.*\.pfx$',
        r'.*\.p12$',
        r'.*secret.*\.ya?ml$',
        r'\.netrc$',
        r'\.npmrc$',
        r'\.pypirc$',
        r'.*shadow$',
        r'.*passwd$',
    ]

    CONTENT_PATTERNS = {
        "AWS Access Key": r'AKIA[0-9A-Z]{16}',
        "AWS Secret Key": r'(?:aws_secret_access_key|aws_access_key_id|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*["\']?[a-zA-Z0-9/+=]{16,}["\']?',
        "Private Key Block": r'-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----',
        "JWT Token": r'eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}',
        "GitHub Token": r'gh[pousr]_[A-Za-z0-9_]{36,}',
        "Generic Secret Assignment": r'(api_key|apikey|secret_key|private_key|auth_token|access_token|password|passwd|token)\s*[:=]\s*["\'][a-zA-Z0-9_\-\.]{8,}["\']',
        "Bearer Auth Token": r'Bearer\s+[a-zA-Z0-9_\-\.]{20,}',
    }

    def evaluate(
        self,
        target: str,
        args: dict[str, Any] | None = None,
        policy_weights: dict[str, int] | None = None
    ) -> list[TriggeredHeuristic]:
        heuristics: list[TriggeredHeuristic] = []
        weights = policy_weights or {}

        # 1. Target path check for sensitive files (.env, private keys)
        target_clean = target.strip().replace("\\", "/").strip("\"'`;, ")
        filename = target_clean.split("/")[-1].lower()

        for pattern in self.SECRET_FILE_PATTERNS:
            if re.search(pattern, filename, re.IGNORECASE) or re.search(pattern, target_clean, re.IGNORECASE):
                heuristics.append(TriggeredHeuristic(
                    id="POL-SECRET-ENV-SCAN",
                    name="Environment Secret File Access (.env / Keys)",
                    category="sensitivity",
                    weight=weights.get("POL-SECRET-ENV-SCAN", 85),
                    detail=f"Target file matches protected secrets signature: '{filename or target_clean}'",
                    color="text-[#FF1F6B]"
                ))
                break

        # 2. Check arguments, command flags, or content payload for secrets
        combined_text = target
        if args:
            for k, v in args.items():
                if isinstance(v, str):
                    combined_text += f" {k}={v}"

        for name, pattern in self.CONTENT_PATTERNS.items():
            match = re.search(pattern, combined_text)
            if match:
                matched_val = match.group(0)
                # Obfuscate matched secret in logs
                masked = matched_val[:4] + "..." + matched_val[-4:] if len(matched_val) > 8 else "***"
                heuristics.append(TriggeredHeuristic(
                    id="POL-SECRET-CONTENT-LEAK",
                    name=f"Sensitive Token Found ({name})",
                    category="sensitivity",
                    weight=weights.get("POL-SECRET-CONTENT-LEAK", 75),
                    detail=f"Detected high-entropy credential ({name}: {masked}) in tool parameters.",
                    color="text-[#FF1F6B]"
                ))

        return heuristics
