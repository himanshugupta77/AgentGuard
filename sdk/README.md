# AgentGuard Python SDK (`agentguard-sdk`)

Runtime security client for autonomous AI agents. Intercepts high-impact tool requests (filesystem, terminal, network) and routes them through the AgentGuard security gateway.

## Installation

```bash
pip install -e sdk/
```

## Quickstart

```python
from agentguard import AgentGuardClient, GuardBlockedException

client = AgentGuardClient(base_url="http://localhost:8000")
client.register_agent("AutoDev-v3", framework="LangChain")
client.create_task("Clean workspace temporary files")

try:
    # Safe operation -> ALLOW
    client.safe_write("docs/summary.md", content="# Build Complete")
    
    # Destructive operation -> Hard BLOCK
    client.safe_shell("rm -rf ./src/")
except GuardBlockedException as e:
    print(f"⛔ Intercepted by AgentGuard: {e.explanation}")
```
