from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentGuard"
    VERSION: str = "2.4.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./agentguard.db"
    
    # Sandbox Root for real tool execution
    SANDBOX_ROOT: str = str(Path(__file__).resolve().parent.parent.parent / "demo-agent" / "workspace")
    
    # Thresholds (Configurable via Policy Settings API)
    ALLOW_MAX_SCORE: int = 29
    ASK_MAX_SCORE: int = 69
    
    # Approvals
    APPROVAL_TIMEOUT_SECONDS: int = 60
    
    # Optional LLM Assist (Off by default for reliable deterministic offline operation)
    AGENTGUARD_USE_LLM: bool = False
    OPENAI_API_KEY: str | None = None
    
    # Secret Key & Security
    SECRET_KEY: str = "agentguard_hackathrone_secret_2026"
    
    # Behavior Burst Tracking
    BURST_WINDOW_SECONDS: int = 10
    BURST_COUNT_THRESHOLD: int = 10
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
