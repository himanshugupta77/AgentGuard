import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
import os
import shutil
import tempfile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.gateway.sandbox import sandbox_manager
from app.routers.policies import ensure_default_policies

# Temporary SQLite DB for tests
TEST_DB_FILE = "./test_agentguard.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    # Setup temporary sandbox directory
    temp_dir = tempfile.mkdtemp(prefix="agentguard_test_sandbox_")
    sandbox_manager.root = Path(temp_dir).resolve()
    sandbox_manager.initialize_sandbox()

    # Create tables
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    ensure_default_policies(db)
    db.close()

    yield

    # Teardown
    shutil.rmtree(temp_dir, ignore_errors=True)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
