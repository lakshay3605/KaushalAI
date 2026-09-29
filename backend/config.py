import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Database configuration (SQLite for local zero-config, swappable to PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/sahakar_setu.db")

# Security & JWT
SECRET_KEY = os.getenv("SECRET_KEY", "sahakar-setu-sih-26087-super-secret-jwt-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for hackathon convenience

# Ed25519 Keys directory
KEYS_DIR = BASE_DIR / "keys"
KEYS_DIR.mkdir(exist_ok=True)
PRIVATE_KEY_PATH = KEYS_DIR / "ed25519_private.pem"
PUBLIC_KEY_PATH = KEYS_DIR / "ed25519_public.pem"

# Server configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
BASE_URL = os.getenv("BASE_URL", f"http://localhost:{API_PORT}")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
