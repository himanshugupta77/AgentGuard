from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.policy import Policy
from app.schemas.policy import PolicyResponse, PolicyUpdate, ThresholdsUpdate, ThresholdsResponse

router = APIRouter(prefix="/policies", tags=["Policies"])

DEFAULT_POLICIES = [
    {
        "id": "POL-SHELL-RECURSIVE-DELETE",
        "name": "Prohibit Recursive Deletion (rm -rf)",
        "type": "shell",
        "weight": 85,
        "enabled": True,
        "description": "Hard blocks commands containing recursive deletion flags targeting directories.",
        "params": {"flags": ["-r", "-R", "--recursive"]}
    },
    {
        "id": "POL-PATH-SYSTEM-ROOT",
        "name": "Host Operating System Root Protection",
        "type": "path",
        "weight": 85,
        "enabled": True,
        "description": "Intercepts operations attempting to read or mutate system root paths (/etc, /bin, C:\\Windows).",
        "params": {"system_paths": ["/etc", "/bin", "/usr", "C:\\Windows"]}
    },
    {
        "id": "POL-SECRET-ENV-SCAN",
        "name": "Environment Secret File Guard (.env / Keys)",
        "type": "sensitivity",
        "weight": 85,
        "enabled": True,
        "description": "Blocks tool calls targeting credential files, .env files, and SSH private keys.",
        "params": {"extensions": [".env", "id_rsa", ".pem", ".key"]}
    },
    {
        "id": "POL-PATH-USER-CREDENTIALS",
        "name": "User Credential Store Guard (~/.ssh, ~/.aws)",
        "type": "path",
        "weight": 85,
        "enabled": True,
        "description": "Blocks access to privileged credentials directories such as ~/.ssh, ~/.aws, or ~/.kube.",
        "params": {"dirs": [".ssh", ".aws", ".kube"]}
    },
    {
        "id": "POL-SEMANTIC-DESTRUCTION",
        "name": "Semantic Destructive Action Detection",
        "type": "intent",
        "weight": 85,
        "enabled": True,
        "description": "Recognizes semantic destructive intent (deletion, wiping, purging) regardless of conversational wrappers.",
        "params": {}
    },
    {
        "id": "POL-SEMANTIC-CREDENTIAL-ACCESS",
        "name": "Semantic Credential Exfiltration Detection",
        "type": "sensitivity",
        "weight": 85,
        "enabled": True,
        "description": "Blocks semantic requests attempting to extract passwords, API keys, or cloud credentials.",
        "params": {}
    },
    {
        "id": "POL-PATH-WORKSPACE-ROOT-DELETE",
        "name": "Workspace Root / Whole Project Deletion Guard",
        "type": "path",
        "weight": 85,
        "enabled": True,
        "description": "Hard blocks any action attempting to delete the root workspace directory or whole project.",
        "params": {}
    },
    {
        "id": "POL-INTENT-ACTION-MISMATCH",
        "name": "Intent vs Action Dissonance Guard",
        "type": "intent",
        "weight": 50,
        "enabled": True,
        "description": "Detects semantic mismatch between stated user task intent and destructive actions.",
        "params": {}
    },
    {
        "id": "POL-BURST-BULK-AFFECTED-COUNT",
        "name": "Bulk Mutation Throttle (>10 Files)",
        "type": "burst",
        "weight": 50,
        "enabled": True,
        "description": "Requires human 2FA approval whenever a tool action impacts more than 10 filesystem paths.",
        "params": {"threshold": 10}
    },
    {
        "id": "POL-SQL-SCHEMA-DROP",
        "name": "Destructive SQL Table / Schema Protection",
        "type": "shell",
        "weight": 85,
        "enabled": True,
        "description": "Hard blocks raw DROP TABLE, TRUNCATE, or unbounded DELETE statements.",
        "params": {"forbidden_keywords": ["DROP TABLE", "DROP DATABASE", "TRUNCATE"]}
    },
    {
        "id": "POL-PATH-OUT-OF-WORKSPACE",
        "name": "Workspace Boundary Containment",
        "type": "path",
        "weight": 75,
        "enabled": True,
        "description": "Enforces that all tool paths resolve strictly inside the assigned workspace sandbox.",
        "params": {}
    },
    {
        "id": "POL-PATH-CODEBASE-CORE",
        "name": "Core Application Source Modification",
        "type": "path",
        "weight": 50,
        "enabled": True,
        "description": "Alerts on modifications targeting core source code or configuration files.",
        "params": {}
    },
    {
        "id": "POL-NETWORK-SECRET-EXFIL",
        "name": "Network Egress Data Exfiltration Filter",
        "type": "network",
        "weight": 75,
        "enabled": True,
        "description": "Blocks outbound network payloads containing high-entropy credentials or environment secrets.",
        "params": {}
    },
    {
        "id": "POL-FORMAT-BULK-SCOPE",
        "name": "Bulk Configuration Formatting Scope",
        "type": "burst",
        "weight": 12,
        "enabled": True,
        "description": "Permits safe formatting of configuration files across workspace (low risk, routine formatting).",
        "params": {}
    },
    {
        "id": "POL-SECURITY-CONFIG-MUTATION",
        "name": "Security-Critical Configuration Modification",
        "type": "sensitivity",
        "weight": 85,
        "enabled": True,
        "description": "Hard blocks attempts to disable authentication, weaken permissions, or expose secrets in configuration.",
        "params": {}
    }
]

def ensure_default_policies(db: Session):
    for item in DEFAULT_POLICIES:
        existing = db.query(Policy).filter(Policy.id == item["id"]).first()
        if not existing:
            pol = Policy(
                id=item["id"],
                name=item["name"],
                type=item["type"],
                weight=item["weight"],
                enabled=item["enabled"],
                description=item["description"],
                params=item["params"]
            )
            db.add(pol)
        else:
            # Upgrade stale policy weights to ensure safety standards
            if existing.weight < item["weight"]:
                existing.weight = item["weight"]
    db.commit()

@router.get("", response_model=dict)
def list_policies(db: Session = Depends(get_db)):
    ensure_default_policies(db)
    policies = db.query(Policy).all()
    return {
        "policies": [PolicyResponse.model_validate(p) for p in policies],
        "thresholds": {
            "allow_max": settings.ALLOW_MAX_SCORE,
            "ask_max": settings.ASK_MAX_SCORE,
            "block_min": settings.ASK_MAX_SCORE + 1
        }
    }

@router.put("/thresholds", response_model=ThresholdsResponse)
def update_thresholds(payload: ThresholdsUpdate):
    if payload.allow_max >= payload.ask_max:
        raise HTTPException(status_code=400, detail="allow_max must be less than ask_max")
    settings.ALLOW_MAX_SCORE = payload.allow_max
    settings.ASK_MAX_SCORE = payload.ask_max
    return ThresholdsResponse(
        allow_max=settings.ALLOW_MAX_SCORE,
        ask_max=settings.ASK_MAX_SCORE,
        block_min=settings.ASK_MAX_SCORE + 1
    )

@router.put("/{policy_id}", response_model=PolicyResponse)
def update_policy(policy_id: str, payload: PolicyUpdate, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if payload.name is not None:
        policy.name = payload.name
    if payload.enabled is not None:
        policy.enabled = payload.enabled
    if payload.weight is not None:
        policy.weight = payload.weight
    if payload.params is not None:
        policy.params = payload.params
    if payload.description is not None:
        policy.description = payload.description

    db.commit()
    db.refresh(policy)
    return policy
