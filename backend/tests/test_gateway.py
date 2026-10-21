import pytest
from app.gateway.sandbox import sandbox_manager
from app.gateway.safe_fs import safe_fs
from app.gateway.safe_shell import safe_shell

def test_safe_fs_write_and_read():
    target = "docs/test_doc.txt"
    content = "Hello from AgentGuard unit test"
    
    write_res = safe_fs.write(target, content)
    assert write_res["success"] is True

    read_res = safe_fs.read(target)
    assert read_res["success"] is True
    assert read_res["content"] == content

def test_safe_fs_rename():
    safe_fs.write("docs/old_name.txt", "data")
    rename_res = safe_fs.rename("docs/old_name.txt", "docs/new_name.txt")
    assert rename_res["success"] is True

    read_new = safe_fs.read("docs/new_name.txt")
    assert read_new["success"] is True

def test_safe_fs_delete():
    safe_fs.write("docs/to_delete.txt", "temporary")
    del_res = safe_fs.delete("docs/to_delete.txt")
    assert del_res["success"] is True

    check_read = safe_fs.read("docs/to_delete.txt")
    assert check_read["success"] is False

def test_sandbox_path_escape_prevention():
    with pytest.raises(PermissionError):
        sandbox_manager.resolve_path("../../outside_file.txt")

def test_safe_shell_execution_inside_sandbox():
    res = safe_shell.exec("python -c \"print('Sandbox Shell OK')\"")
    assert res["success"] is True
    assert "Sandbox Shell OK" in res["stdout"]
