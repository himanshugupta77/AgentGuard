import logging
from typing import Any
from app.config import settings
from app.schemas.evaluate import TriggeredHeuristic
from app.engine.semantic_parser import SemanticClassifier
from app.engine.shell_parser import ShellParser
from app.engine.path_analyzer import PathAnalyzer
from app.engine.sensitivity import SensitivityScanner
from app.engine.intent_matcher import IntentMatcher
from app.engine.burst_tracker import BurstTracker
from app.engine.network_inspector import NetworkInspector

logger = logging.getLogger("agentguard.risk_engine")

class RiskEngine:
    """Intelligent runtime risk evaluation engine for autonomous AI agent tool calls."""

    def __init__(self):
        self.semantic_classifier = SemanticClassifier()
        self.shell_parser = ShellParser()
        self.path_analyzer = PathAnalyzer()
        self.sensitivity_scanner = SensitivityScanner()
        self.intent_matcher = IntentMatcher()
        self.burst_tracker = BurstTracker(
            window_seconds=settings.BURST_WINDOW_SECONDS,
            count_threshold=settings.BURST_COUNT_THRESHOLD
        )
        self.network_inspector = NetworkInspector()

    def evaluate(
        self,
        agent_id: str | None,
        stated_intent: str | None,
        workspace_root: str | None,
        tool: str | None,
        action: str | None,
        target: str | None,
        args: dict[str, Any] | None = None,
        db_policies: list[Any] | None = None,
        allow_max: int | None = None,
        ask_max: int | None = None
    ) -> dict[str, Any]:
        """Evaluates tool invocation against all active signals and returns reproducible decision."""
        try:
            # 0. Sanitize and normalize inputs
            agent_id = str(agent_id or "default-agent")
            workspace_root = str(workspace_root or "/workspace")
            tool = str(tool or "safe_fs")
            action = str(action or "read")
            target = str(target or "")
            args = args if isinstance(args, dict) else {}
            allow_threshold = allow_max if allow_max is not None else settings.ALLOW_MAX_SCORE
            ask_threshold = ask_max if ask_max is not None else settings.ASK_MAX_SCORE

            # Build policy lookup for disabled rules and custom weights
            policy_weights: dict[str, int] = {}
            disabled_policies: set[str] = set()

            if db_policies:
                for p in db_policies:
                    if not p.enabled:
                        disabled_policies.add(p.id)
                    else:
                        policy_weights[p.id] = p.weight

            triggered: list[TriggeredHeuristic] = []

            # 1. Semantic Analysis: Peel simulation/dry-run wrappers and detect underlying semantic operation
            semantic_res = self.semantic_classifier.analyze(
                target=target,
                action=action,
                tool=tool,
                stated_intent=stated_intent,
                args=args,
                policy_weights=policy_weights
            )
            triggered.extend([h for h in semantic_res["heuristics"] if h.id not in disabled_policies])

            is_simulation = semantic_res["is_simulation"]
            cleaned_cmd = semantic_res.get("cleaned_command") or target
            extracted_target = semantic_res.get("extracted_target") or target
            detected_action = semantic_res.get("detected_action") or action

            # 2. Shell Analysis
            cmd_to_parse = ""
            if tool == "safe_shell" or action == "exec" or detected_action == "exec":
                cmd_to_parse = cleaned_cmd or target or str(args.get("command", ""))
            elif any(kw in target for kw in ["rm ", "bash", "mv ", "shutil", "fs.rm", "del ", "rmdir"]):
                cmd_to_parse = cleaned_cmd or target

            if cmd_to_parse:
                shell_heuristics = self.shell_parser.evaluate(cmd_to_parse, policy_weights)
                triggered.extend([h for h in shell_heuristics if h.id not in disabled_policies])

            # 3. Path Analysis
            # Determine path target to inspect
            path_targets_to_check = set()
            if extracted_target:
                if " " not in extracted_target.strip():
                    path_targets_to_check.add(extracted_target.strip())
                else:
                    for tok in extracted_target.split():
                        tok_clean = tok.strip("\"'`;, ")
                        if ("/" in tok_clean or "\\" in tok_clean or tok_clean in [".", "*", "workspace"]):
                            path_targets_to_check.add(tok_clean)

            if target and " " not in target.strip() and ("/" in target or "\\" in target or "." in target):
                path_targets_to_check.add(target.strip())

            if cleaned_cmd:
                for tok in cleaned_cmd.split():
                    tok_clean = tok.strip("\"'`;, ")
                    if ("/" in tok_clean or "\\" in tok_clean or tok_clean in [".", "*", "workspace"]):
                        path_targets_to_check.add(tok_clean)

            if not path_targets_to_check and target and " " not in target.strip():
                path_targets_to_check.add(target)

            is_formatting = semantic_res.get("is_formatting", False)
            is_recursive_delete = semantic_res.get("is_recursive_delete", False)
            if is_formatting and not is_recursive_delete:
                effective_action = "format"
            else:
                effective_action = detected_action if detected_action != "read" else action

            for pt in path_targets_to_check:
                path_heuristics = self.path_analyzer.evaluate(
                    pt, workspace_root, effective_action, policy_weights, is_destructive=is_recursive_delete
                )
                triggered.extend([h for h in path_heuristics if h.id not in disabled_policies])

            # 4. Sensitivity & Secret Scanning
            sens_heuristics = self.sensitivity_scanner.evaluate(target, args, policy_weights)
            triggered.extend([h for h in sens_heuristics if h.id not in disabled_policies])
            if cleaned_cmd != target:
                sens_clean = self.sensitivity_scanner.evaluate(cleaned_cmd, args, policy_weights)
                triggered.extend([h for h in sens_clean if h.id not in disabled_policies])

            # 5. Intent vs Action Mismatch
            effective_intent = stated_intent or (args.get("intent") if isinstance(args, dict) else None)
            if effective_intent:
                intent_heuristics = self.intent_matcher.evaluate(
                    effective_intent, tool, detected_action, cleaned_cmd or target, args, policy_weights
                )
                triggered.extend([h for h in intent_heuristics if h.id not in disabled_policies])

            # 6. Behavior Bursts & Bulk Threshold
            burst_heuristics = self.burst_tracker.record_and_evaluate(agent_id, action, args, policy_weights)
            triggered.extend([h for h in burst_heuristics if h.id not in disabled_policies])

            # 7. Network Inspection
            if tool == "safe_http" or action == "request" or target.startswith("http://") or target.startswith("https://"):
                net_heuristics = self.network_inspector.evaluate(target, args, policy_weights)
                triggered.extend([h for h in net_heuristics if h.id not in disabled_policies])

            # Deduplicate heuristics by id
            unique_heuristics: list[TriggeredHeuristic] = []
            seen_ids = set()
            for h in triggered:
                if h.id not in seen_ids:
                    seen_ids.add(h.id)
                    unique_heuristics.append(h)

            # Baseline score calculation: MIN(100, SUM(weight))
            total_score = min(100, sum(h.weight for h in unique_heuristics))

            # Critical safety floor: If any high-severity policy triggered (e.g. recursive delete, root path, secret scan),
            # ensure total score cannot be lower than the maximum triggered heuristic weight
            if unique_heuristics:
                max_single_weight = max(h.weight for h in unique_heuristics)
                total_score = max(total_score, max_single_weight)

            # Decision threshold mapping
            if total_score <= allow_threshold:
                decision = "ALLOW"
            elif total_score <= ask_threshold:
                decision = "ASK"
            else:
                decision = "BLOCK"

            # Plain-English Explanation generation
            explanation, evidence = self._generate_explanation_and_evidence(
                decision, total_score, unique_heuristics, tool, action, target, stated_intent, args, is_simulation, semantic_res.get("simulation_phrases", []), is_formatting
            )

            return {
                "risk_score": total_score,
                "decision": decision,
                "reasons": unique_heuristics,
                "explanation": explanation,
                "evidence": evidence,
                "is_simulation": is_simulation
            }

        except Exception as exc:
            logger.error("RiskEngine evaluation failed: %s", exc, exc_info=True)
            # Fail closed: never return zero score or ALLOW on evaluation failure
            fail_closed_heuristic = TriggeredHeuristic(
                id="POL-SYS-EVAL-FAIL",
                name="Risk Engine Internal Failure (Fail Closed)",
                category="system",
                weight=95,
                detail=f"Evaluation anomaly ({type(exc).__name__}: {str(exc)}). Fail-closed zero-trust control enforced.",
                color="text-[#FF1F6B]"
            )
            return {
                "risk_score": 95,
                "decision": "BLOCK",
                "reasons": [fail_closed_heuristic],
                "explanation": (
                    "Critical evaluation error encountered. In accordance with zero-trust security controls, "
                    "the operation was blocked to prevent unvetted execution."
                ),
                "evidence": {
                    "error": str(exc),
                    "error_type": type(exc).__name__,
                    "tool": tool,
                    "action": action,
                    "target": target
                },
                "is_simulation": False
            }

    def _generate_explanation_and_evidence(
        self,
        decision: str,
        score: int,
        heuristics: list[TriggeredHeuristic],
        tool: str,
        action: str,
        target: str,
        stated_intent: str | None,
        args: dict[str, Any],
        is_simulation: bool = False,
        simulation_phrases: list[str] | None = None,
        is_formatting: bool = False
    ) -> tuple[str, dict[str, Any]]:
        heuristic_names = [h.name for h in heuristics]
        
        evidence: dict[str, Any] = {
            "tool": tool,
            "action": action,
            "target": target,
            "stated_intent": stated_intent,
            "matched_heuristics": [h.model_dump() for h in heuristics],
            "args": args,
            "is_simulation": is_simulation,
            "simulation_phrases": simulation_phrases or []
        }

        simulation_note = ""
        if is_simulation:
            simulation_note = " [SIMULATION DIRECTIVE DETECTED: Under Zero-Trust policy, simulation phrasing does not diminish assessed risk.]"

        if decision == "ALLOW":
            if is_formatting:
                explanation = (
                    f"Safe configuration formatting permitted (Risk Score: {score}/100). "
                    f"Action '{action}' on target '{target}' formats configuration files with zero semantic meaning change or critical threat signatures."
                    f"{simulation_note}"
                )
            else:
                explanation = (
                    f"Low impact operation permitted (Risk Score: {score}/100). "
                    f"Action '{action}' on target '{target}' conforms to standard workspace execution rules with zero critical threat signatures."
                    f"{simulation_note}"
                )
        elif decision == "ASK":
            reasons_str = "; ".join(h.detail for h in heuristics) if heuristics else "Elevated mutation impact."
            if any(h.id == "POL-FORMAT-BULK-SCOPE" for h in heuristics):
                explanation = (
                    f"Broad-scope formatting operation paused for human review (Risk Score: {score}/100). "
                    f"Target: '{target}'. Evidence: {reasons_str}. "
                    f"Proposed next step: Awaiting operator 2FA approval via dashboard queue."
                    f"{simulation_note}"
                )
            else:
                explanation = (
                    f"High-impact operation paused for human review (Risk Score: {score}/100). "
                    f"Target: '{target}'. Evidence: {reasons_str}. "
                    f"Proposed next step: Awaiting operator 2FA approval via dashboard queue."
                    f"{simulation_note}"
                )
        else:  # BLOCK
            reasons_str = "; ".join(h.detail for h in heuristics) if heuristics else "Destructive operation detected."
            explanation = (
                f"Critical security violation blocked at runtime gateway (Risk Score: {score}/100). "
                f"Threat vectors: {', '.join(heuristic_names)}. "
                f"Target: '{target}'. Evidence: {reasons_str}. "
                f"Proposed next step: Execution immediately hard-trapped; host file system untouched; incident recorded in audit ledger."
                f"{simulation_note}"
            )

        return explanation, evidence

# Singleton engine instance
risk_engine = RiskEngine()
