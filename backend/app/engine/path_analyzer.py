import os
import re
from pathlib import Path
from app.schemas.evaluate import TriggeredHeuristic

class PathAnalyzer:
    """Analyzes filesystem paths, detecting traversal, workspace escapes, and protected scopes."""

    def evaluate(
        self,
        target_path: str,
        workspace_root: str,
        action: str = "read",
        policy_weights: dict[str, int] | None = None,
        is_destructive: bool = False
    ) -> list[TriggeredHeuristic]:
        heuristics: list[TriggeredHeuristic] = []
        if not target_path or not target_path.strip():
            return heuristics

        weights = policy_weights or {}
        raw = target_path.strip().replace("\\", "/")
        # Strip trailing punctuation, quotes, semicolons from command extraction
        clean_path = raw.strip("\"'`;, ")

        # If clean_path is a multi-word conversational sentence, do not treat the whole sentence as a path
        if len(clean_path.split()) > 3 and not ("/" in clean_path and "\\" not in clean_path and " " not in clean_path):
            return heuristics

        # 1. Path traversal escape detection via syntax (e.g. ../../)
        if "../" in clean_path or "/.." in clean_path or clean_path.startswith(".."):
            heuristics.append(TriggeredHeuristic(
                id="POL-PATH-TRAVERSAL",
                name="Path Traversal Attempt (../)",
                category="path",
                weight=weights.get("POL-PATH-TRAVERSAL", 70),
                detail=f"Detected relative directory traversal escape pattern in path: '{clean_path}'",
                color="text-[#FF1F6B]"
            ))

        # 2. Critical OS system paths
        system_roots = ["/etc", "/bin", "/sbin", "/usr", "/var/run", "/dev", "/root", "c:/windows", "c:/system32", "c:/program files"]
        norm_lower = clean_path.lower()
        if clean_path == "/" or any(norm_lower.startswith(sr) for sr in system_roots):
            heuristics.append(TriggeredHeuristic(
                id="POL-PATH-SYSTEM-ROOT",
                name="Protected OS System Directory Access",
                category="path",
                weight=weights.get("POL-PATH-SYSTEM-ROOT", 85),
                detail=f"Target points to host operating system root or system partition: '{clean_path}'",
                color="text-[#FF1F6B]"
            ))

        # 3. User credential directories (~/.ssh, ~/.aws, ~/.kube)
        user_credential_dirs = [".ssh", ".aws", ".kube", ".gnupg", ".docker", ".azure", ".config/gcloud"]
        if any(f"/{d}" in norm_lower or norm_lower.startswith(f"~/{d}") or norm_lower.startswith(d) for d in user_credential_dirs):
            heuristics.append(TriggeredHeuristic(
                id="POL-PATH-USER-CREDENTIALS",
                name="Host User Credential Store Access",
                category="path",
                weight=weights.get("POL-PATH-USER-CREDENTIALS", 85),
                detail=f"Target points to privileged user credentials store: '{clean_path}'",
                color="text-[#FF1F6B]"
            ))

        # 4. Version control internals (.git)
        if "/.git" in norm_lower or norm_lower.startswith(".git"):
            heuristics.append(TriggeredHeuristic(
                id="POL-PATH-GIT-INTERNALS",
                name="Git Metadata Repository Access",
                category="path",
                weight=weights.get("POL-PATH-GIT-INTERNALS", 45),
                detail=f"Target accesses version control internals (.git): '{clean_path}'",
                color="text-[#FFBD6B]"
            ))

        # 5. Core codebase directory access for destructive actions
        is_source = (
            clean_path.startswith("./src") or 
            clean_path.startswith("src/") or 
            clean_path == "src" or 
            "/src/" in clean_path or 
            clean_path.endswith("package.json") or 
            clean_path.endswith("pyproject.toml") or
            clean_path.endswith("vite.config.ts")
        )
        is_workspace_root = clean_path in [
            ".", "./", "*", "./*", "./workspace", "workspace", "/workspace",
            "./workspace/", "/workspace/", "workspace/"
        ]
        
        is_destructive_action = (
            action in ["delete", "unlink", "truncate", "destroy", "wipe"] or
            is_destructive is True
        )

        if is_workspace_root and is_destructive_action:
            heuristics.append(TriggeredHeuristic(
                id="POL-PATH-WORKSPACE-ROOT-DELETE",
                name="Workspace Root / Entire Project Deletion Target",
                category="path",
                weight=weights.get("POL-PATH-WORKSPACE-ROOT-DELETE", 85),
                detail=f"Destructive operation directly targets entire project root or workspace: '{clean_path}'",
                color="text-[#FF1F6B]"
            ))
        elif is_source and is_destructive_action:
            heuristics.append(TriggeredHeuristic(
                id="POL-PATH-CODEBASE-CORE",
                name="Core Project Source Modification",
                category="path",
                weight=weights.get("POL-PATH-CODEBASE-CORE", 50),
                detail=f"Destructive action targeting core application source files: '{clean_path}'",
                color="text-[#FF1F6B]"
            ))

        # 6. Physical workspace boundary validation
        if workspace_root:
            try:
                base_ws = Path(workspace_root).resolve()
                if os.path.isabs(clean_path):
                    target_p = Path(clean_path).resolve()
                else:
                    target_p = (base_ws / clean_path).resolve()

                # Check if target is inside base_ws
                try:
                    target_p.relative_to(base_ws)
                except ValueError:
                    # Target escaped workspace!
                    heuristics.append(TriggeredHeuristic(
                        id="POL-PATH-OUT-OF-WORKSPACE",
                        name="Out of Workspace Boundary Access",
                        category="path",
                        weight=weights.get("POL-PATH-OUT-OF-WORKSPACE", 75),
                        detail=f"Target path '{target_p}' is outside designated workspace root '{base_ws}'",
                        color="text-[#FF1F6B]"
                    ))
            except Exception:
                pass

        return heuristics
