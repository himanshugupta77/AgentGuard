from typing import Callable, Any
from agentguard.client import AgentGuardClient

class GuardedTool:
    """Decorator/wrapper to protect any standard tool function with AgentGuard."""

    def __init__(
        self,
        client: AgentGuardClient,
        tool_name: str,
        action: str = "exec",
        target_extractor: Callable[[Any], str] | None = None
    ):
        self.client = client
        self.tool_name = tool_name
        self.action = action
        self.target_extractor = target_extractor or (lambda *args, **kwargs: str(args[0]) if args else str(kwargs))

    def __call__(self, fn: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            target = self.target_extractor(*args, **kwargs)
            # Route through gateway
            self.client.evaluate(
                tool=self.tool_name,
                action=self.action,
                target=target,
                args=kwargs
            )
            # If allowed, execute underlying tool
            return fn(*args, **kwargs)
        return wrapper
