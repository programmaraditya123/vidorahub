from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_database: str
    mongodb_users_database: str | None = None
    jwt_secret: SecretStr | None = None
    oauth_issuer: str = "https://vidorahub-e5925e63.fastapicloud.dev"
    mcp_resource: str = "https://vidorahub-fastapi2-189065286116.asia-south1.run.app/mcp"
    oauth_scopes: str = "mcp:access"
    oauth_cookie_secure: bool = True
    introspection_secret: SecretStr | None = None
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8", extra="ignore")

settings = Settings()
client = AsyncIOMotorClient(settings.mongodb_uri, tz_aware=True, serverSelectionTimeoutMS=5000)
db = client[settings.mongodb_database]
users_db = client[settings.mongodb_users_database or settings.mongodb_database]
users_collection = users_db["userprofiles"]
oauth_clients_collection = db["oauth_client"]
oauth_authorization_codes_collection = db["oauth_authorization_codes"]
oauth_sessions_collection = db["oauth_sessions"]
oauth_transactions_collection = db["oauth_transactions"]
oauth_tokens_collection = db["oauth_tokens"]
oauth_grants_collection = db["oauth_grants"]

async def create_oauth_indexes():
    for collection, key in ((oauth_clients_collection, "client_id"),
        (oauth_authorization_codes_collection, "code_hash"), (oauth_sessions_collection, "session_id"),
        (oauth_transactions_collection, "transaction_id"), (oauth_tokens_collection, "token_hash"),
        (oauth_grants_collection, "grant_id")):
        await collection.create_index(key, unique=True)
        if collection is not oauth_clients_collection:
            await collection.create_index("expires_at", expireAfterSeconds=0)
    await oauth_tokens_collection.create_index("grant_id")
