from pathlib import Path

from dotenv import load_dotenv

SERVICE_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = SERVICE_ROOT / ".env"

load_dotenv(dotenv_path=ENV_PATH)

