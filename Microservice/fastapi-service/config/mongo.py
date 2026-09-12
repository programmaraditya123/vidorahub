from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    mongodb_uri : str
    mongodb_database : str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

client = AsyncIOMotorClient(settings.mongodb_uri)

db = client[settings.mongodb_database]

videos_collection = db["videos"]
users_collection = db["userprofiles"]