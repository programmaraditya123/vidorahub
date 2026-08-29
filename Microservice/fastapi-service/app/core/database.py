from functools import lru_cache
import logging

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache
def get_client() -> MongoClient:
    settings = get_settings()
    if not settings.mongodb_uri:
        raise RuntimeError("MONGODB_URI is required for persistence")
    return MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=3000)


def get_database():
    return get_client()[get_settings().mongodb_database]


def get_collection(name: str) -> Collection:
    return get_database()[name]


def ensure_indexes() -> None:
    if not get_settings().mongodb_uri:
        return
    try:
        jobs = get_collection("vibe_jobs")
        vibes = get_collection("vibes")
        jobs.create_index([("user_id", ASCENDING), ("status", ASCENDING), ("created_at", ASCENDING)])
        jobs.create_index([("account_id", ASCENDING), ("created_at", ASCENDING)])
        jobs.create_index([("profile_id", ASCENDING), ("created_at", ASCENDING)])
        jobs.create_index([("source_identifier", ASCENDING)])
        jobs.create_index([("owner_fingerprint", ASCENDING), ("source_fingerprint", ASCENDING), ("status", ASCENDING)])
        vibes.create_index([("job_id", ASCENDING)])
        vibes.create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])
    except PyMongoError as exc:
        logger.warning("mongo_index_initialization_failed error=%s", exc)


def close_mongo() -> None:
    if get_client.cache_info().currsize:
        get_client().close()
