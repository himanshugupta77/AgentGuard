import urllib.request
import urllib.error
import json
from typing import Any
from agentguard.exceptions import (
    GuardBlockedException,
    GuardApprovalRequiredException,
    AgentGuardException
)

class AgentGuardClient:
    """Client for routing AI agent tool invocations through the AgentGuard runtime security gateway."""

    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        api_key: str | None = None,
        agent_id: str | None = None
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.agent_id = agent_id
        self.task_id: str | None = None

    def _request(self, endpoint: str, method: str = "GET", payload: dict | None = None) -> dict:
        url = f"{self.base_url}/api{endpoint}"
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        data_bytes = json.dumps(payload).encode("utf-8") if payload else None
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_text = resp.read().decode("utf-8")
                return json.loads(resp_text) if resp_text else {}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise AgentGuardException(f"HTTP {e.code}: {err_body}")
        except Exception as e:
            raise AgentGuardException(f"Connection error to AgentGuard gateway: {e}")

    def register_agent(self, name: str, framework: str = "Custom") -> dict:
        data = self._request("/agents", method="POST", payload={"name": name, "framework": framework})
        self.agent_id = data["id"]
        self.api_key = data.get("api_key")
        return data

    def create_task(self, stated_intent: str, workspace_root: str = "/workspace") -> dict:
        if not self.agent_id:
            self.register_agent("AutoRegisteredAgent")

        data = self._request("/tasks", method="POST", payload={
            "agent_id": self.agent_id,
            "stated_intent": stated_intent,
            "workspace_root": workspace_root
        })
        self.task_id = data["id"]
        return data

    def evaluate(
        self,
        tool: str,
        action: str,
        target: str,
        args: dict[str, Any] | None = None,
        raise_on_block: bool = True
    ) -> dict[str, Any]:
        """Routes a tool call through the gateway, evaluates risk, and enforces decision."""
        if not self.agent_id:
            self.register_agent("AutoRegisteredAgent")

        payload = {
            "agent_id": self.agent_id,
            "task_id": self.task_id,
            "tool": tool,
            "action": action,
            "target": target,
            "args": args or {}
        }

        res = self._request("/evaluate", method="POST", payload=payload)
        decision = res.get("decision")

        if decision == "BLOCK" and raise_on_block:
            reasons = [r.get("name") if isinstance(r, dict) else str(r) for r in res.get("reasons", [])]
            raise GuardBlockedException(
                risk_score=res.get("risk_score", 100),
                explanation=res.get("explanation", "Blocked by security policy"),
                reasons=reasons
            )

        if decision == "ASK" and raise_on_block:
            raise GuardApprovalRequiredException(
                approval_id=res.get("approval_id", ""),
                explanation=res.get("explanation", "Human approval required")
            )

        return res

    # Convenience Tool Wrappers
    def safe_read(self, path: str) -> dict:
        return self.evaluate("safe_fs", "read", path)

    def safe_write(self, path: str, content: str = "") -> dict:
        return self.evaluate("safe_fs", "write", path, args={"content": content})

    def safe_rename(self, src: str, dest: str, affected_count: int = 1) -> dict:
        return self.evaluate("safe_fs", "rename", src, args={"destination": dest, "affected_count": affected_count})

    def safe_delete(self, path: str) -> dict:
        return self.evaluate("safe_fs", "delete", path)

    def safe_shell(self, command: str) -> dict:
        return self.evaluate("safe_shell", "exec", command)

    def safe_http(self, method: str, url: str, body: dict | str | None = None) -> dict:
        return self.evaluate("safe_http", "request", url, args={"method": method, "body": body})
