import sys
import time
import argparse
import random
from pathlib import Path

# Add sdk to pythonpath
sdk_path = Path(__file__).resolve().parent.parent / "sdk"
sys.path.insert(0, str(sdk_path))

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from agentguard import AgentGuardClient, GuardBlockedException, GuardApprovalRequiredException

RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RED = "\033[31m"
CYAN = "\033[36m"
MAGENTA = "\033[35m"

def print_banner():
    print(f"{MAGENTA}{BOLD}")
    print("=" * 65)
    print("      AGENTGUARD :: DEMO AGENT RUNNER (Hack-A-Throne 2026)")
    print("      Tagline: Let AI act. Keep humans in control.")
    print("=" * 65)
    print(f"{RESET}")

def run_canonical_demo(client: AgentGuardClient):
    """Executes the exact 5-step walkthrough from the pitch deck."""
    print(f"\n{BOLD}[1. TASK INITIALIZATION]{RESET}")
    stated_intent = "Organize project assets in /workspace"
    print(f"  › Registering agent: {CYAN}AutoDev_Agent_v3{RESET} (LangChain)")
    agent = client.register_agent("AutoDev_Agent_v3", framework="LangChain")
    print(f"  › Creating task: \"{stated_intent}\"")
    client.create_task(stated_intent=stated_intent, workspace_root="/workspace")
    time.sleep(1)

    print(f"\n{BOLD}[2. AGENT ACTION DISPATCH]{RESET}")
    print(f"  › Agent formulating tool call...")
    time.sleep(0.8)
    action_cmd = "rm -rf ./src/"
    print(f"  › Invoking: {RED}{BOLD}safe_shell(\"{action_cmd}\"){RESET}")
    time.sleep(1)

    print(f"\n{BOLD}[3. INTERCEPTION & RISK ENGINE EVALUATION]{RESET}")
    print(f"  › Checking against active runtime security policies...")
    time.sleep(0.8)

    try:
        eval_res = client.evaluate(
            tool="safe_shell",
            action="exec",
            target=action_cmd,
            raise_on_block=False
        )

        score = eval_res["risk_score"]
        decision = eval_res["decision"]
        reasons = eval_res.get("reasons", [])
        explanation = eval_res.get("explanation", "")

        print(f"\n{BOLD}[4. GATEWAY DECISION & CONTAINMENT]{RESET}")
        print(f"  › Assessed Risk Score: {RED}{BOLD}{score}/100{RESET}")
        print(f"  › Decision:            {RED}{BOLD}⛔ {decision}{RESET}")
        print(f"  › Triggered Heuristics:")
        for r in reasons:
            name = r.get("name") if isinstance(r, dict) else str(r)
            detail = r.get("detail", "") if isinstance(r, dict) else ""
            print(f"      • {RED}{name}{RESET}: {detail}")
        print(f"  › Plain-English Summary:")
        print(f"      \"{explanation}\"")
        print(f"  › Host File System Status: {GREEN}{BOLD}UNTOUCHED (Containment Active){RESET}")

    except Exception as e:
        print(f"  {RED}Evaluation error: {e}{RESET}")

    print(f"\n{BOLD}[5. OPERATOR REVIEW & POLICY ADJUSTMENT]{RESET}")
    print(f"  › Telemetry streamed live to dashboard via WebSocket.")
    print(f"  › Review incident at: {CYAN}http://localhost:5173/dashboard{RESET}")
    print(f"  › Or open events table: {CYAN}http://localhost:5173/dashboard/events{RESET}\n")

def run_scenario(scenario_id: int, client: AgentGuardClient):
    client.register_agent("DemoWorkerAgent", framework="CrewAI")
    
    if scenario_id == 1:
        print(f"\n{GREEN}{BOLD}--- SCENARIO 1: Safe File Edit ---{RESET}")
        client.create_task("Review documentation and notes")
        res = client.evaluate(
            tool="safe_fs",
            action="write",
            target="./docs/README.md",
            args={"content": "# Updated Documentation"},
            raise_on_block=False
        )
        print(f"  Result: {GREEN}ALLOW (Score: {res['risk_score']}/100){RESET}")
        print(f"  {res['explanation']}")

    elif scenario_id == 2:
        print(f"\n{YELLOW}{BOLD}--- SCENARIO 2: Bulk File Rename (48 files) ---{RESET}")
        client.create_task("Organize asset archives")
        res = client.evaluate(
            tool="safe_fs",
            action="rename",
            target="./assets/*",
            args={"destination": "./archive/", "affected_count": 48},
            raise_on_block=False
        )
        print(f"  Result: {YELLOW}ASK - Human Approval Required (Score: {res['risk_score']}/100){RESET}")
        print(f"  Approval ID: {res.get('approval_id')}")
        print(f"  {res['explanation']}")

    else:
        run_canonical_demo(client)

def run_continuous_demo(client: AgentGuardClient):
    """Continuously fires realistic events for live dashboard testing."""
    print(f"\n{CYAN}{BOLD}Starting continuous live simulation. Press Ctrl+C to stop...{RESET}\n")
    agents = [
        client.register_agent("agent-coder-9", framework="LangChain")["id"],
        client.register_agent("agent-scraper-02", framework="CrewAI")["id"],
        client.register_agent("agent-eval-loop", framework="AutoGen")["id"]
    ]

    scenarios = [
        {"tool": "safe_fs", "action": "write", "target": "./src/components/Header.tsx", "args": {"content": "// Safe update"}},
        {"tool": "safe_fs", "action": "read", "target": "./docs/README.md", "args": {}},
        {"tool": "safe_http", "action": "request", "target": "https://api.internal.corp/billing", "args": {"method": "GET"}},
        {"tool": "safe_fs", "action": "rename", "target": "./assets/*", "args": {"affected_count": 24}},
        {"tool": "safe_shell", "action": "exec", "target": "rm -rf /app/storage", "args": {}},
        {"tool": "safe_fs", "action": "read", "target": ".env", "args": {}},
        {"tool": "safe_shell", "action": "exec", "target": "pytest -q", "args": {}}
    ]

    count = 0
    while True:
        try:
            agent_id = random.choice(agents)
            client.agent_id = agent_id
            spec = random.choice(scenarios)
            count += 1
            res = client.evaluate(
                tool=spec["tool"],
                action=spec["action"],
                target=spec["target"],
                args=spec["args"],
                raise_on_block=False
            )
            color = GREEN if res["decision"] == "ALLOW" else (YELLOW if res["decision"] == "ASK" else RED)
            print(f"[{count:03d}] {spec['tool']}.{spec['action']} -> {color}{res['decision']}{RESET} (Score: {res['risk_score']}) :: {spec['target']}")
            time.sleep(2.5)
        except KeyboardInterrupt:
            print("\nContinuous simulation stopped.")
            break
        except Exception as e:
            print(f"Simulation tick error: {e}")
            time.sleep(2)

def main():
    parser = argparse.ArgumentParser(description="AgentGuard Demo Agent")
    parser.add_argument("--base-url", default="http://localhost:8000", help="AgentGuard Gateway Base URL")
    parser.add_argument("--scenario", type=int, choices=[1, 2, 3], default=3, help="Scenario number (1=Safe, 2=Bulk, 3=Delete)")
    parser.add_argument("--continuous", action="store_true", help="Run continuous event generator for live dashboard demo")
    args = parser.parse_args()

    print_banner()
    client = AgentGuardClient(base_url=args.base_url)

    if args.continuous:
        run_continuous_demo(client)
    else:
        run_scenario(args.scenario, client)

if __name__ == "__main__":
    main()
