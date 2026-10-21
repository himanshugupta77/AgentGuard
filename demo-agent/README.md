# AgentGuard Demo Agent

Scripted autonomous AI agent for demonstrating AgentGuard runtime security enforcement at Hack-A-Throne 2026.

## Running Scenarios

```bash
# Run Canonical Pitch Deck Flow (rm -rf ./src/ -> BLOCK)
python demo-agent/agent.py --scenario 3

# Run Scenario 1 (Safe File Edit -> ALLOW)
python demo-agent/agent.py --scenario 1

# Run Scenario 2 (Bulk Rename -> ASK / 2FA)
python demo-agent/agent.py --scenario 2

# Run continuous event generator for live dashboard streaming
python demo-agent/agent.py --continuous
```
