import re
from typing import Any, NamedTuple
from app.schemas.evaluate import TriggeredHeuristic

class SemanticAnalysisResult(NamedTuple):
    is_simulation: bool
    clean_command: str
    inferred_tool: str
    inferred_action: str
    inferred_target: str
    heuristics: list[TriggeredHeuristic]

class SemanticClassifier:
    """Intelligent semantic analyzer that recognizes actions by meaning and operation type,

    distinguishes requested actions from meta-instructions (e.g. simulate, do not execute),
    and prevents prompt-injection/wrapper evasions.
    """

    # Patterns indicating simulation, test-only, or execution-suppression meta-instructions
    SIMULATION_PATTERNS = [
        r'\b(simulate|simulation|simulated|simulating)\b',
        r'\b(dry[\s\-_]*run)\b',
        r'\b(do\s+not\s+execute|don\'?t\s+execute|do\s+not\s+run|don\'?t\s+run)\b',
        r'\b(test\s+mode|mock\s+request|hypothetical(ly)?|for\s+testing\s+purposes\s+only)\b',
        r'\b(without\s+executing|without\s+running|no[\s\-_]*op)\b',
    ]

    # Conversational or polite wrapper phrases to peel off
    WRAPPER_PREFIXES = [
        r'^(please\s+)?(can\s+you\s+|could\s+you\s+|would\s+you\s+)?',
        r'^(i\s+want\s+to\s+|i\s+need\s+to\s+|i\s+would\s+like\s+to\s+)',
        r'^(request\s+to\s+|command\s+to\s+|attempt\s+to\s+|try\s+to\s+)',
        r'^(simulate\s+a\s+request\s+to\s+|simulate\s+request\s+to\s+|simulate\s+)',
        r'^(run\s+a\s+simulation\s+of\s+|run\s+simulation\s+of\s+)',
        r'^(dry[\s\-_]*run\s*:?\s*)',
    ]

    WRAPPER_SUFFIXES = [
        r'[;,.]?\s*(do\s+not\s+execute(\s+it)?|don\'?t\s+execute(\s+it)?|do\s+not\s+run(\s+it)?|don\'?t\s+run(\s+it)?)\s*$',
        r'[;,.]?\s*(for\s+testing\s+only|test\s+only|simulation\s+only)\s*$',
        r'[;,.]?\s*(without\s+executing(\s+it)?|without\s+running(\s+it)?)\s*$',
        r'[;,.]?\s*$',
    ]

    # Semantic destructive operation patterns
    RECURSIVE_DELETE_PATTERNS = [
        r'\b(rm|del|erase|remove|unlink)\b.*(-[a-zA-Z]*[rf][a-zA-Z]*|--recursive|/s)',
        r'\b(recursively\s+delete|delete\s+recursively|recursive\s+deletion)\b',
        r'\b(recursively\s+remove|remove\s+recursively|recursive\s+removal)\b',
        r'\b(wipe|erase|destroy|purge)\s+(out\s+)?(the\s+)?(entire\s+)?(workspace|project|directory|folder|files|codebase|root|disk|all)\b',
        r'\b(wipe|erase|destroy|purge)\s+.*(workspace|project|codebase)\b',
        r'\bdelete\s+(all\s+files|everything|the\s+entire\s+workspace|the\s+entire\s+project|the\s+project\s+folder|the\s+workspace)\b',
        r'\b(destructive(ly)?\s+overwrite|overwrite\s+and\s+delete|destructively\s+modify)\b',
        r'\bshutil\.rmtree\b',
        r'\bfs\.rmSync\b',
    ]

    # Sensitive data access semantic patterns
    SENSITIVE_ACCESS_PATTERNS = [
        r'\b(read|cat|type|view|dump|print|access|exfiltrate|steal|fetch)\b.*(\.env|credentials|id_rsa|id_ed25519|private_key|secret_key|api_key|token)',
        r'\b(show|dump|leak|export)\s+(the\s+)?(secrets?|credentials?|passwords?|tokens?|env(\s+vars)?|environment\s+variables?)\b',
        r'\bcat\s+~?/?(\.aws|\.ssh|\.kube|\.gnupg)/',
        r'\b(get|read|view)\s+(aws\s+credentials|ssh\s+keys?|service\s+account\s+keys?)\b',
    ]

    # Security-critical configuration tampering patterns
    SECURITY_TAMPERING_PATTERNS = [
        # Disabling authentication
        r'\b(disable|disabling|turn\s+off|bypass|bypassing|remove|deactivate)\s+(auth|authentication|mfa|2fa|login|authorization|security)\b',
        r'\b(auth|authentication)\s*[:=]\s*(false|none|disabled|off|0)\b',
        r'\b(no[-_\s]*auth|skip[-_\s]*auth|bypass[-_\s]*auth|without[-_\s]*auth)\b',
        r'\b(enable|enabling|set|turn\s+on)\s+.*(no[-_\s]*auth|anonymous_access)\b',
        # Weakening permissions
        r'\b(permit[-_\s]*all|allow[-_\s]*all|grant[-_\s]*all|insecure[-_\s]*skip[-_\s]*verify)\b',
        r'\b(allow_anonymous|anonymous_access)\s*[:=]?\s*(true|1|enabled|yes)?\b',
        r'\bchmod\s+(-[a-zA-Z]*R\s+)?(777|\+rwx)\b',
        r'\b(weaken|weakening|relax|open\s+up)\s+(permissions?|access|controls?|security|firewall)\b',
        r'\bworld[-_\s]*writable\b',
        # Exposing secrets
        r'\b(expose|exposing|leak|leaking|dump|dumping|print|printing|export|exporting|reveal)\s+.*(secrets?|credentials?|passwords?|tokens?|private_keys?|api_keys?)\b',
        r'\b(show_secrets|reveal_secrets|print_secrets|log_passwords)\b',
        # Disabling security controls
        r'\b(disable|disabling|turn\s+off|deactivate)\s+(csrf|ssl|tls|cors|firewall|rate[-_\s]*limit(ing)?|encryption)\b',
        r'\b(csrf|ssl|tls|encryption)_?(enabled)?\s*[:=]\s*(false|0|off|disabled)\b',
        r'\bverify_ssl\s*[:=]\s*false\b',
    ]

    # Formatting semantic patterns
    FORMATTING_PATTERNS = [
        r'\b(format|formatting|reformat|reformatting)\b',
        r'\b(lint|linting|prettier|beautify|indent|indentation)\b',
        r'\b(consistent\s+formatting|standardize\s+formatting|consistent\s+style)\b',
        r'\b(updating|update)\s+.*(formatting|consistent\s+formatting|consistent\s+style|indentation)\b',
    ]

    # Broad scope patterns for configuration changes
    BULK_SCOPE_PATTERNS = [
        r'\b(configuration\s+files|config\s+files|all\s+files|all\s+configs|all\s+configuration\s+files)\b',
        r'\b(across|throughout|entire|all|every)\s+(the\s+)?(workspace|project|repository|codebase)\b',
        r'\b(multiple\s+files|all\s+configurations)\b',
        r'\b(in|under)\s+(\./)?workspace\b.*(files|configs)',
        r'\bfiles\s+in\s+(\./)?workspace\b',
        r'\b(bulk|mass)\s+(format|formatting|update|updates|edit|edits)\b',
    ]

    # Destructive SQL semantic patterns
    SQL_DESTRUCTIVE_PATTERNS = [
        r'\b(drop\s+table|drop\s+database|truncate\s+table|truncate\s+database)\b',
        r'\bdelete\s+from\s+\w+(\s+where\s+(1=1|true))?',
        r'\bwipe\s+(the\s+)?database\b',
    ]

    def analyze(
        self,
        target: str,
        action: str = "",
        tool: str = "",
        stated_intent: str | None = None,
        args: dict[str, Any] | None = None,
        policy_weights: dict[str, int] | None = None
    ) -> dict[str, Any]:
        weights = policy_weights or {}
        heuristics: list[TriggeredHeuristic] = []
        simulation_phrases: list[str] = []

        raw_input = target or ""
        if not raw_input or not raw_input.strip():
            return {
                "is_simulation": False,
                "is_formatting": False,
                "is_bulk_formatting": False,
                "is_security_mutation": False,
                "is_recursive_delete": False,
                "clean_command": "",
                "cleaned_command": "",
                "inferred_tool": tool or "safe_fs",
                "inferred_action": action or "read",
                "detected_action": action or "read",
                "inferred_target": "",
                "extracted_target": "",
                "heuristics": [],
                "simulation_phrases": []
            }

        text = raw_input.strip()

        # 1. Detect if this is a simulation / dry-run meta-instruction
        for pat in self.SIMULATION_PATTERNS:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                simulation_phrases.append(m.group(0))
        is_simulation = len(simulation_phrases) > 0
        sim_flag_msg = " [Simulation flag detected; payload evaluated for real risk]" if is_simulation else ""

        # 2. Extract clean underlying action/command by stripping wrappers
        clean = text
        for pat in self.WRAPPER_PREFIXES:
            clean = re.sub(pat, '', clean, flags=re.IGNORECASE).strip()
        for pat in self.WRAPPER_SUFFIXES:
            clean = re.sub(pat, '', clean, flags=re.IGNORECASE).strip()

        # Unwrap shell prefixes (e.g. sudo, eval, bash -c)
        clean = re.sub(r'^(sudo|doas|eval|exec)\s+', '', clean, flags=re.IGNORECASE).strip()
        bash_c_match = re.search(r'^(ba|z)?sh\s+-c\s+["\'](.*)["\']$', clean, re.IGNORECASE)
        if bash_c_match:
            clean = bash_c_match.group(2).strip()

        # Determine inferred tool, action, and target
        inferred_tool = tool
        inferred_action = action
        inferred_target = clean

        # Extract path candidates from clean command
        tokens = clean.split()
        path_candidates = [t for t in tokens if ("/" in t or "\\" in t or "." in t) and not t.startswith("-")]
        if path_candidates:
            extracted_path = path_candidates[0].rstrip(';,.\'"`')
        else:
            extracted_path = clean

        # Build combined text for payload inspection
        combined_payload = f"{clean} {text}"
        if args:
            for k, v in args.items():
                if isinstance(v, str):
                    combined_payload += f" {k}={v}"

        # 3. Semantic Destructive Deletion Check
        # NEVER treat simulation as reason to reduce risk! Evaluate the underlying action!
        is_recursive_delete = any(bool(re.search(pat, clean, re.IGNORECASE)) or bool(re.search(pat, text, re.IGNORECASE)) for pat in self.RECURSIVE_DELETE_PATTERNS)
        if is_recursive_delete:
            inferred_tool = "safe_shell"
            inferred_action = "delete"
            
            # Check target scope (workspace, src, root, etc.)
            target_scope_msg = extracted_path if extracted_path else "specified target"
            heuristics.append(TriggeredHeuristic(
                id="POL-SHELL-RECURSIVE-DELETE",
                name="Recursive File Deletion / Wiping",
                category="shell",
                weight=weights.get("POL-SHELL-RECURSIVE-DELETE", 85),
                detail=f"Semantic recursive deletion requested targeting '{target_scope_msg}'.{sim_flag_msg}",
                color="text-[#FF1F6B]"
            ))

            # If targeting core codebase, project folder, or entire workspace, add core protection heuristic
            low_clean = clean.lower()
            if any(k in low_clean for k in ["workspace", "./workspace", "src", "./src", "project", "folder", "all", "/", "/*"]):
                heuristics.append(TriggeredHeuristic(
                    id="POL-PATH-CODEBASE-CORE",
                    name="Core Workspace / Project Deletion Target",
                    category="path",
                    weight=weights.get("POL-PATH-CODEBASE-CORE", 50),
                    detail=f"Destructive deletion targets core project/workspace scope: '{target_scope_msg}'",
                    color="text-[#FF1F6B]"
                ))

        # 4. Semantic Sensitive Access Check
        is_sensitive_access = any(bool(re.search(pat, clean, re.IGNORECASE)) or bool(re.search(pat, text, re.IGNORECASE)) for pat in self.SENSITIVE_ACCESS_PATTERNS)
        if is_sensitive_access:
            heuristics.append(TriggeredHeuristic(
                id="POL-PATH-USER-CREDENTIALS",
                name="Privileged Credentials / Secret Access",
                category="path",
                weight=weights.get("POL-PATH-USER-CREDENTIALS", 85),
                detail=f"Attempted access or exfiltration of sensitive credentials/keys.{sim_flag_msg}",
                color="text-[#FF1F6B]"
            ))

        # 5. Security-Critical Configuration Tampering Check
        # Must detect disabling authentication, weakening permissions, or exposing secrets
        is_security_mutation = any(bool(re.search(pat, combined_payload, re.IGNORECASE)) for pat in self.SECURITY_TAMPERING_PATTERNS)
        if is_security_mutation:
            heuristics.append(TriggeredHeuristic(
                id="POL-SECURITY-CONFIG-MUTATION",
                name="Security-Critical Configuration Modification",
                category="sensitivity",
                weight=weights.get("POL-SECURITY-CONFIG-MUTATION", 85),
                detail=f"Detected security-critical modification (weakening permissions, disabling authentication, or exposing secrets).{sim_flag_msg}",
                color="text-[#FF1F6B]"
            ))

        # 6. Formatting & Scope Classification (if not destructive and not security tampering)
        is_formatting = False
        is_bulk_formatting = False
        if not is_recursive_delete:
            has_format_keyword = any(bool(re.search(pat, clean, re.IGNORECASE)) or bool(re.search(pat, text, re.IGNORECASE)) for pat in self.FORMATTING_PATTERNS)
            if has_format_keyword:
                is_formatting = True
                inferred_action = "format"
                
                # Determine if bulk / broad scope
                has_bulk_pattern = any(bool(re.search(pat, clean, re.IGNORECASE)) or bool(re.search(pat, text, re.IGNORECASE)) for pat in self.BULK_SCOPE_PATTERNS)
                affected_count = args.get("affected_count") if args else None
                has_bulk_count = isinstance(affected_count, (int, float)) and affected_count > 1
                has_wildcard = "*" in clean or (extracted_path and "*" in extracted_path)

                if has_bulk_pattern or has_bulk_count or has_wildcard:
                    is_bulk_formatting = True
                    # Bulk formatting across workspace configuration files increases risk appropriately
                    heuristics.append(TriggeredHeuristic(
                        id="POL-FORMAT-BULK-SCOPE",
                        name="Bulk Configuration Formatting Scope",
                        category="burst",
                        weight=weights.get("POL-FORMAT-BULK-SCOPE", 12),
                        detail=f"Consistent formatting operation targeting configuration files in '{extracted_path or './workspace'}'.{sim_flag_msg}",
                        color="text-[#FFBD6B]"
                    ))

        # 7. Semantic Destructive SQL Check
        is_destructive_sql = any(bool(re.search(pat, clean, re.IGNORECASE)) or bool(re.search(pat, text, re.IGNORECASE)) for pat in self.SQL_DESTRUCTIVE_PATTERNS)
        if is_destructive_sql:
            heuristics.append(TriggeredHeuristic(
                id="POL-SQL-SCHEMA-DROP",
                name="Destructive Database Schema Mutation",
                category="shell",
                weight=weights.get("POL-SQL-SCHEMA-DROP", 85),
                detail="Detected raw database schema drop, table wipe, or unconditional truncate operation.",
                color="text-[#FF1F6B]"
            ))

        # 8. Bulk rename/move semantic check
        if re.search(r'\b(bulk\s+rename|mass\s+(rename|move|update)|rename\s+all)\b', clean, re.IGNORECASE) or (action == "rename" and "*" in clean):
            heuristics.append(TriggeredHeuristic(
                id="POL-BURST-BULK-AFFECTED-COUNT",
                name="Bulk File Mutation Pattern",
                category="burst",
                weight=weights.get("POL-BURST-BULK-AFFECTED-COUNT", 45),
                detail="Bulk file renaming or mass move operation detected.",
                color="text-[#FFBD6B]"
            ))

        return {
            "is_simulation": is_simulation,
            "is_formatting": is_formatting,
            "is_bulk_formatting": is_bulk_formatting,
            "is_security_mutation": is_security_mutation,
            "is_recursive_delete": is_recursive_delete,
            "clean_command": clean,
            "cleaned_command": clean,
            "inferred_tool": inferred_tool,
            "inferred_action": inferred_action,
            "detected_action": inferred_action,
            "inferred_target": extracted_path if extracted_path else clean,
            "extracted_target": extracted_path if extracted_path else clean,
            "heuristics": heuristics,
            "simulation_phrases": simulation_phrases
        }

semantic_classifier = SemanticClassifier()

