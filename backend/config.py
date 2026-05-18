"""
Application configuration. Load from environment (e.g. .env via python-dotenv).
"""
import os
from pathlib import Path

# Load .env if present
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(_env_path)

# Suno API (sunoapi.org)
SUNO_API_KEY: str = os.getenv("SUNO_API_KEY", "").strip()
SUNO_API_BASE_URL: str = os.getenv("SUNO_API_BASE_URL", "https://api.sunoapi.org/api/v1").rstrip("/")

# Celery / Redis
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

# Suno polling (чаще опрос = быстрее реакция при готовности)
SUNO_POLL_INTERVAL_SEC: int = int(os.getenv("SUNO_POLL_INTERVAL_SEC", "10"))
SUNO_POLL_MAX_WAIT_SEC: int = int(os.getenv("SUNO_POLL_MAX_WAIT_SEC", "300"))  # 5 min

# Default model for custom mode (V4_5ALL: good structure, 8 min)
SUNO_DEFAULT_MODEL: str = os.getenv("SUNO_DEFAULT_MODEL", "V4_5ALL")

# Internal refund (Celery worker → FastAPI)
BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
INTERNAL_SECRET: str = os.getenv("INTERNAL_SECRET", "").strip()
