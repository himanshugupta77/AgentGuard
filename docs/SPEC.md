# AgentGuard Specification (Product Source of Truth)

> Extracted from `AgentGuard_Hack_A_Throne_Presentation.pptx` for Hack-A-Throne 2026.

---

## 1. Executive Summary

- **Product Name**: AgentGuard
- **Domain**: AI & Intelligent Systems / AI Security
- **Tagline**: *"Let AI act. Keep humans in control."*
- **Target Event**: Hack-A-Throne 2026 Concept & MVP Pitch
- **Design Principle**: *Silent when safe. Explainable when risky. Protective when critical.*
- **Core Axiom**: *"Permission to run ≠ permission to do anything."*

---

## 2. The Problem: The Security Gap in Autonomous AI Agents

AI agents can do more than users intended. A capable agent with file, terminal, and network access can accidentally cross critical operational and security boundaries:

1. **Accidental Damage**: Mass file edits, destructive shell commands (`rm -rf`), unintended deletions, or overwrites caused by hallucinated or unconstrained loops.
2. **Sensitive Access & Exfiltration**: Agents may open secrets, credentials, environment variables, or private folders beyond their assigned task scope (e.g., reading `.env`, `id_rsa`, AWS keys).
3. **Missing Supervision**: Traditional security tools (static IAM, passive endpoint logging) cannot understand dynamic agent intent or task context. Static permission models are either too restrictive to let agents work, or too permissive to keep the host safe.

---

## 3. The Solution: Intelligent Runtime Checkpoint

AgentGuard sits as an in-line security checkpoint between an AI agent and its system tools (Filesystem, Shell, Network). Every high-impact tool invocation is intercepted and evaluated before execution.

```
+---------------+           +--------------------+           +---------------+
|   AI Agent    |  ----->   |     AgentGuard     |  ----->   | System Tools  |
| (Task & Intent)|           | (Identity/Context) |           | (Files/Shell) |
+---------------+           +--------------------+           +---------------+
                                      |
                              Policy Decision:
                           ALLOW  /  ASK  /  BLOCK
                                      |
                              +---------------+
                              | Human Operator|
                              |  (If Risky)   |
                              +---------------+
```

---

## 4. Core Intelligence: Context-Aware Risk Scoring (0–100)

Instead of constant disruptive pop-ups, AgentGuard employs context-aware three-tier risk scoring:

| Risk Tier | Score Range | Action | Description | Latency Target |
|---|---|---|---|---|
| **LOW RISK** | **0 – 29** | **ALLOW** | Routine read/edit operations strictly within the approved workspace. Runs automatically without friction. | < 2ms |
| **MEDIUM RISK** | **30 – 69** | **ASK / WARN** | Bulk mutations, unusual file formats, outbound webhooks with novel payloads, scope drift. Pauses execution and asks human operator for 2FA approval. | Synchronous/Webhook |
| **HIGH RISK** | **70 – 100** | **BLOCK / PAUSE**| Destructive commands, credential exfiltration, attempts on protected or out-of-workspace paths. Hard trap, immediate refusal with plain-English explanation. | Instant containment |

### Evaluation Inputs
1. **User Instruction / Task Intent**: Stated goal and allowed workspace boundaries.
2. **Agent Identity**: Framework metadata, permissions, and historical trust profile.
3. **Tool Call & Parameters**: Target path, AST-parsed command, HTTP destination, payload structure.
4. **File Sensitivity**: Detection of secrets (`.env`, private keys, credential vaults, project source).
5. **Behavior History & Bursts**: Sliding-window tracking of mutation frequencies and cross-step drift.
6. **Active Policy Rules**: Configurable rule weights and threshold configurations.

---

## 5. Key Differentiators

1. **Intent vs. Action Mismatch**: Detects semantic dissonance (e.g., agent tasked with "format reports" attempts to delete the project folder).
2. **Behavior Bursts**: Detects rapid bursts of renames, writes, or deletions over short time windows.
3. **Sensitive Boundaries**: Strict enforcement on credential stores, personal folders, and out-of-workspace paths.
4. **Explainable Events**: Plain-English alerts detailing affected resources, concrete evidence, and recommended remediation.
5. **Reproducible & Auditable**: Cryptographically hash-chained audit ledger (SHA-256) ensuring tamper-evident history.

---

## 6. Technical Architecture (MVP Implementation)

```
[ AI Agent (LangChain / AutoGen / CrewAI / Custom) ]
                        │
                        ▼ (import agentguard)
[ AgentGuard Python SDK / Gateway Client ]
                        │
                        ▼ REST / WebSocket
[ AgentGuard FastAPI Core Server ]
   ├── Tool Gateway (/api/evaluate)
   │     ├── safe_fs (read, write, rename, unlink)
   │     ├── safe_shell (exec)
   │     └── safe_http (request)
   ├── Risk Evaluation Engine
   │     ├── Shell Parser (shlex + command classifier)
   │     ├── Path Analyzer (canonical resolve + traversal defense)
   │     ├── Sensitivity Scanner (regex secrets + credential patterns)
   │     ├── Intent-Action Matcher (semantic keyword/category + optional LLM)
   │     └── Burst/Drift Tracker (sliding window per-agent state)
   ├── Policy & Approval Manager
   │     ├── Dynamic Threshold & Weights API
   │     └── Synchronous / Async Human Approval Workflow (60s expiry)
   ├── Cryptographic Audit Ledger
   │     └── Append-only SHA-256 Hash Chain with /api/audit/verify
   └── Live Event Streamer
         └── WebSocket (/ws/events) broadcast to connected clients
                        │
                        ▼
[ React 19 + TypeScript + Vite Dashboard & Showcase UI ]
   ├── Interactive Live Sandbox (3 Real Scenarios: Safe Edit, Bulk Rename, Recursive Delete)
   ├── Realtime Observability & Telemetry Metrics
   ├── Live Event Stream & Detail Drawer
   ├── Human-in-the-Loop Approval Queue
   ├── Policy Rule & Threshold Editor
   ├── Incident Replay Timeline
   └── Cryptographic Chain Verifier & Audit Report Export (JSON/CSV)
```

---

## 7. Demo Walkthrough: 5-Step Controlled Decision Flow

The hackathon demo proves end-to-end enforcement through the canonical 5-step lifecycle:

1. **TASK**: User instructs: *"Organize project assets in /workspace"*.
2. **ACTION**: Agent formulates recursive deletion request (`bash_exec("rm -rf ./src/")`).
3. **DETECT**: AgentGuard triggers 3 heuristics:
   - Intent mismatch (organizing assets does not warrant source deletion).
   - Bulk destructive deletion (`rm -rf`).
   - Protected path access (`./src/`).
4. **RESPOND**: AgentGuard calculates Risk Score: 92/100 -> **BLOCK**.
   - Execution is hard-trapped at gateway; filesystem remains untouched.
   - Plain-English alert delivered to operator with evidence.
5. **REVIEW**: Event streams live to the dashboard; operator reviews the incident and adjusts safety policies.

---

## 8. MVP Roadmap

1. **Phase 1: Tool Gateway**: Local filesystem, shell, and HTTP wrappers with baseline sandbox enforcement.
2. **Phase 2: Risk Policies**: Granular heuristic weights, threshold tuning, and custom sensitivity lists.
3. **Phase 3: Live Alerts & 2FA**: Webhook and dashboard approval prompts with timeout fallback.
4. **Phase 4: Incident Replay**: Timeline replay of complex multi-step agent trajectories and blast radius visualization.
5. **Phase 5: Future Integrations**: eBPF kernel enclave enforcement for Linux containers and broader framework plugins.
