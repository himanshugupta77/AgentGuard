import subprocess
from typing import Any
from app.gateway.sandbox import sandbox_manager

class SafeShell:
    """Restricted shell executor that runs subprocesses strictly inside the sandbox working directory."""

    @staticmethod
    def exec(command: str, timeout: int = 5) -> dict[str, Any]:
        sandbox_cwd = str(sandbox_manager.root)
        try:
            res = subprocess.run(
                command,
                shell=True,
                cwd=sandbox_cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return {
                "success": res.returncode == 0,
                "exit_code": res.returncode,
                "stdout": res.stdout[:2000],
                "stderr": res.stderr[:2000]
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "exit_code": -1, "error": f"Command timed out after {timeout} seconds"}
        except Exception as e:
            return {"success": False, "exit_code": -1, "error": str(e)}

safe_shell = SafeShell()
