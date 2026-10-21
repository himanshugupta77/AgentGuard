import shutil
from pathlib import Path
from typing import Any
from app.gateway.sandbox import sandbox_manager

class SafeFS:
    """Restricted filesystem operations executing strictly within the sandbox."""

    @staticmethod
    def read(target: str) -> dict[str, Any]:
        path = sandbox_manager.resolve_path(target)
        if not path.exists():
            return {"success": False, "error": f"File not found: {target}"}
        if path.is_dir():
            files = [f.name for f in path.iterdir()]
            return {"success": True, "type": "directory", "files": files[:50]}
        
        content = path.read_text(encoding="utf-8", errors="replace")
        return {"success": True, "type": "file", "size": len(content), "content": content[:1000]}

    @staticmethod
    def write(target: str, content: str = "") -> dict[str, Any]:
        path = sandbox_manager.resolve_path(target)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return {"success": True, "action": "write", "path": str(path), "bytes_written": len(content)}

    @staticmethod
    def rename(src: str, dest: str) -> dict[str, Any]:
        src_path = sandbox_manager.resolve_path(src)
        dest_path = sandbox_manager.resolve_path(dest)
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        if not src_path.exists():
            return {"success": False, "error": f"Source not found: {src}"}

        shutil.move(str(src_path), str(dest_path))
        return {"success": True, "action": "rename", "from": str(src_path), "to": str(dest_path)}

    @staticmethod
    def delete(target: str) -> dict[str, Any]:
        path = sandbox_manager.resolve_path(target)
        if not path.exists():
            return {"success": False, "error": f"Target not found: {target}"}

        if path.is_file():
            path.unlink()
            return {"success": True, "action": "delete_file", "path": str(path)}
        elif path.is_dir():
            shutil.rmtree(str(path))
            return {"success": True, "action": "delete_directory", "path": str(path)}
        return {"success": False, "error": "Unknown path type"}

safe_fs = SafeFS()
