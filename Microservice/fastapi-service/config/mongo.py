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

videos_collection = db["videos"]
users_collection = db["userprofiles"]
products_collections = db["products"]
stores_collections = db["stores"]