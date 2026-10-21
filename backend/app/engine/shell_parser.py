import shlex
import re
from typing import Any
from app.schemas.evaluate import TriggeredHeuristic

class ShellParser:
    """Parses shell commands using AST/shlex, command chaining, and classifies dangerous operations."""

    def evaluate(self, command: str, policy_weights: dict[str, int] | None = None) -> list[TriggeredHeuristic]:
        heuristics: list[TriggeredHeuristic] = []
        if not command or not command.strip():
            return heuristics

        weights = policy_weights or {}
        raw = command.strip()

        # 1. Pipe to shell execution (e.g. curl ... | bash, wget ... | sh)
        if re.search(r'(curl|wget)\s+.*\|\s*(ba|z)?sh', raw, re.IGNORECASE) or re.search(r'\b(curl|wget)\b.*\|\s*(python|perl|ruby)\b', raw, re.IGNORECASE):
            heuristics.append(TriggeredHeuristic(
                id="POL-SHELL-PIPED-EXEC",
                name="Remote Payload Piped to Shell",
                category="shell",
                weight=weights.get("POL-SHELL-PIPED-EXEC", 85),
                detail="Detected curl/wget command piped directly into shell interpreter.",
                color="text-[#FF1F6B]"
            ))

        # 2. Destructive SQL commands
        sql_drop = re.search(r'\b(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE|TRUNCATE\s+DATABASE)\b', raw, re.IGNORECASE)
        if sql_drop:
            heuristics.append(TriggeredHeuristic(
                id="POL-SQL-SCHEMA-DROP",
                name="Destructive SQL Schema Mutation",
                category="shell",
                weight=weights.get("POL-SQL-SCHEMA-DROP", 85),
                detail=f"Detected raw SQL schema destruction: '{sql_drop.group(0)}'",
                color="text-[#FF1F6B]"
            ))
        elif re.search(r'\bDELETE\s+FROM\s+\w+(\s+WHERE\s+(1=1|true))?\s*;?$', raw, re.IGNORECASE):
            heuristics.append(TriggeredHeuristic(
                id="POL-SQL-MASS-DELETE",
                name="Unbounded SQL Table Deletion",
                category="shell",
                weight=weights.get("POL-SQL-MASS-DELETE", 75),
                detail="Detected unconditional SQL table deletion (missing WHERE or WHERE 1=1).",
                color="text-[#FF1F6B]"
            ))

        # 3. Disk formatting or raw device writes
        if re.search(r'\b(mkfs(\.\w+)?|dd\s+if=.*of=/dev/|fdisk|parted|format\s+[a-z]:)\b', raw, re.IGNORECASE):
            heuristics.append(TriggeredHeuristic(
                id="POL-SHELL-DISK-WIPE",
                name="Low-Level Disk Format/Write",
                category="shell",
                weight=weights.get("POL-SHELL-DISK-WIPE", 85),
                detail="Detected raw disk partition formatting or direct block device write.",
                color="text-[#FF1F6B]"
            ))

        # 4. Fork bomb or kernel/init kill
        if ":(){ :|:& };:" in raw or re.search(r'\bkill\s+-9\s+(-1|1)\b', raw):
            heuristics.append(TriggeredHeuristic(
                id="POL-SHELL-DENIAL-OF-SERVICE",
                name="Process Exhaustion Attack",
                category="shell",
                weight=weights.get("POL-SHELL-DENIAL-OF-SERVICE", 85),
                detail="Detected fork bomb or init process kill pattern.",
                color="text-[#FF1F6B]"
            ))

        # 5. Programmatic destructive scripts (Python, Node)
        if re.search(r'python.*(shutil\.rmtree|os\.remove|os\.unlink|subprocess\.run.*rm)', raw, re.IGNORECASE) or \
           re.search(r'node.*(fs\.rmSync|fs\.unlinkSync|child_process)', raw, re.IGNORECASE):
            heuristics.append(TriggeredHeuristic(
                id="POL-SHELL-RECURSIVE-DELETE",
                name="Programmatic Recursive File Deletion",
                category="shell",
                weight=weights.get("POL-SHELL-RECURSIVE-DELETE", 85),
                detail="Detected programmatic recursive deletion via script interpreter (shutil/fs.rmSync).",
                color="text-[#FF1F6B]"
            ))

        # 6. Split chained commands (&&, ;, ||, |) to inspect individual sub-commands
        sub_commands = re.split(r'&&|;|\|\||\|', raw)
        for sub_cmd in sub_commands:
            sub_raw = sub_cmd.strip()
            if not sub_raw:
                continue

            # Strip command wrappers (sudo, doas, eval, exec, nohup)
            unwrapped = re.sub(r'^(sudo|doas|eval|exec|nohup|env)\s+', '', sub_raw, flags=re.IGNORECASE).strip()

            # Handle bash -c '...' or sh -c '...'
            bash_c = re.search(r'^(ba|z)?sh\s+-c\s+["\'](.*)["\']$', unwrapped, re.IGNORECASE)
            if bash_c:
                unwrapped = bash_c.group(2).strip()

            try:
                tokens = shlex.split(unwrapped)
            except Exception:
                tokens = unwrapped.split()

            if not tokens:
                continue

            cmd = tokens[0].lower().rstrip(';,')
            args = tokens[1:]

            # rm / rmdir / del command inspection
            if cmd in ["rm", "del", "erase"] or cmd.endswith("/rm"):
                has_recursive = any(
                    arg in ["-r", "-R", "--recursive", "/s"] or
                    (arg.startswith("-") and "r" in arg) or
                    (arg.startswith("/") and "s" in arg.lower())
                    for arg in args
                )
                has_force = any(
                    arg in ["-f", "--force", "/f", "/q"] or
                    (arg.startswith("-") and "f" in arg) or
                    (arg.startswith("/") and any(f in arg.lower() for f in ["f", "q"]))
                    for arg in args
                )
                targets = [a.rstrip(';,') for a in args if not a.startswith("-") and not a.startswith("/")]

                if has_recursive or cmd == "rmdir":
                    detail_msg = "Recursive deletion flag detected (-r / --recursive)"
                    if has_force:
                        detail_msg = "Unconditional recursive force deletion detected (rm -rf)"

                    heuristics.append(TriggeredHeuristic(
                        id="POL-SHELL-RECURSIVE-DELETE",
                        name="Recursive File Deletion (rm -rf)",
                        category="shell",
                        weight=weights.get("POL-SHELL-RECURSIVE-DELETE", 85),
                        detail=f"{detail_msg} targeting: {', '.join(targets) if targets else 'unspecified target'}",
                        color="text-[#FF1F6B]"
                    ))

            # chmod -R 777 / wildcard permissions
            if cmd == "chmod" or cmd.endswith("/chmod"):
                if any("-R" in a or "-r" in a for a in args) and any("777" in a or "+rwx" in a for a in args):
                    heuristics.append(TriggeredHeuristic(
                        id="POL-SHELL-PERMISSIVE-CHMOD",
                        name="Recursive Insecure Permission Modification",
                        category="shell",
                        weight=weights.get("POL-SHELL-PERMISSIVE-CHMOD", 45),
                        detail="Detected chmod -R 777 granting world-writable permissions.",
                        color="text-[#FFBD6B]"
                    ))

            # Broad wildcards in deletion/move commands
            if cmd in ["rm", "mv", "rmdir", "cp"]:
                if any("*" in a or "?" in a for a in args):
                    heuristics.append(TriggeredHeuristic(
                        id="POL-SHELL-WILDCARD-MUTATION",
                        name="Broad Wildcard Mutation",
                        category="shell",
                        weight=weights.get("POL-SHELL-WILDCARD-MUTATION", 35),
                        detail=f"Detected wildcard expression ('*') in command '{cmd}'.",
                        color="text-[#FFBD6B]"
                    ))

        # Deduplicate heuristics
        unique: list[TriggeredHeuristic] = []
        seen = set()
        for h in heuristics:
            if h.id not in seen:
                seen.add(h.id)
                unique.append(h)

        return unique

shell_parser = ShellParser()
