from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings,SettingsConfigDict
from pydantic import SecretStr

class Settings(BaseSettings):
    mongodb_uri : str
    mongodb_database : str
    jwt_secret: SecretStr | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

client = AsyncIOMotorClient(settings.mongodb_uri)

db = client[settings.mongodb_database]

users_collection = db["userprofiles"]
oauth_clients_collection = db["oauth_client"]
oauth_authorization_codes_collection=db["oauth_authorization_codes"]


async def create_oauth_indexes():

    await oauth_clients_collection.create_index(
        "client_id",
        unique=True,
    )

    await oauth_authorization_codes_collection.create_index(
        "code_hash",
        unique=True,
    )

    await oauth_authorization_codes_collection.create_index(
        "expires_at",
        expireAfterSeconds=0,
    )
