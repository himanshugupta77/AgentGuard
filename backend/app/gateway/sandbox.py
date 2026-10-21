import os
import shutil
from pathlib import Path
from app.config import settings

class SandboxManager:
    """Manages physical sandbox directories for safe real tool execution."""

    def __init__(self, sandbox_root: str | None = None):
        self.root = Path(sandbox_root or settings.SANDBOX_ROOT).resolve()

    def initialize_sandbox(self):
        """Initializes sandbox workspace with dummy files and folders for realistic testing."""
        self.root.mkdir(parents=True, exist_ok=True)
        (self.root / "src").mkdir(exist_ok=True)
        (self.root / "docs").mkdir(exist_ok=True)
        (self.root / "assets").mkdir(exist_ok=True)
        (self.root / "archive").mkdir(exist_ok=True)

        # Create sample files if missing
        src_file = self.root / "src" / "index.ts"
        if not src_file.exists():
            src_file.write_text("// Core codebase index\nexport const VERSION = '2.4.0';\n", encoding="utf-8")

        readme = self.root / "docs" / "README.md"
        if not readme.exists():
            readme.write_text("# Project Documentation\nWelcome to AgentGuard workspace.\n", encoding="utf-8")

        env_file = self.root / ".env"
        if not env_file.exists():
            env_file.write_text("DATABASE_URL=sqlite:///./test.db\nSECRET_KEY=demo_sandbox_secret\n", encoding="utf-8")

        # Create 48 sample files in assets/ for testing Scenario 2 (Bulk Rename)
        for i in range(1, 49):
            asset = self.root / "assets" / f"report_{i:02d}.csv"
            if not asset.exists():
                asset.write_text(f"id,name,val\n{i},metric_{i},100\n", encoding="utf-8")

    def resolve_path(self, relative_path: str) -> Path:
        """Resolves path strictly within sandbox root; prevents escaping."""
        clean = relative_path.strip().lstrip("/\\")
        resolved = (self.root / clean).resolve()
        try:
            resolved.relative_to(self.root)
        except ValueError:
            raise PermissionError(f"Path '{relative_path}' resolves outside sandbox '{self.root}'")
        return resolved

sandbox_manager = SandboxManager()
