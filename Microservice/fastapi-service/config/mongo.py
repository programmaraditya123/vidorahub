from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings,SettingsConfigDict
from pydantic import SecretStr
from pathlib import Path

class Settings(BaseSettings):
    mongodb_uri : str
    mongodb_database : str
    jwt_secret: SecretStr | None = None
    oauth_issuer: str = "https://vidorahub-e5925e63.fastapicloud.dev"
    mcp_resource: str = "https://vidorahub-fastapi2-189065286116.asia-south1.run.app/mcp"
    oauth_scopes: str = "mcp:access"
    introspection_secret: SecretStr | None = None

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8", extra="ignore",
    )

settings = Settings()

client = AsyncIOMotorClient(settings.mongodb_uri)

db = client[settings.mongodb_database]

videos_collection = db["videos"]
users_collection = db["userprofiles"]
products_collections = db["products"]
stores_collections = db["stores"]
