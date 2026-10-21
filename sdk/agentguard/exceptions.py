class AgentGuardException(Exception):
    """Base exception for AgentGuard runtime gateway."""
    pass

class GuardBlockedException(AgentGuardException):
    """Raised when an operation is blocked by AgentGuard due to high risk."""
    def __init__(self, risk_score: int, explanation: str, reasons: list[str] | None = None):
        super().__init__(f"Operation blocked (Score: {risk_score}/100): {explanation}")
        self.risk_score = risk_score
        self.explanation = explanation
        self.reasons = reasons or []

class GuardApprovalRequiredException(AgentGuardException):
    """Raised when an operation is paused awaiting human approval."""
    def __init__(self, approval_id: str, explanation: str):
        super().__init__(f"Operation requires human approval (Approval ID: {approval_id}): {explanation}")
        self.approval_id = approval_id
        self.explanation = explanation

class GuardDeniedException(AgentGuardException):
    """Raised when an operation is denied by a human operator."""
    pass
