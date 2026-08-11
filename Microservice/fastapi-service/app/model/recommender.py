import math
import os
import re
import time
from collections import Counter
from dataclasses import dataclass
from typing import Any, Literal

from bson import ObjectId
from pymongo.errors import PyMongoError
from pymongo import MongoClient
from pymongo.collection import Collection

from app import config  # noqa: F401

ContentType = Literal["video", "vibe"]
ContentFilter = Literal["all", "video", "vibe"]


@dataclass(frozen=True)
class RecommendationItem:
    id: str
    title: str
    description: str
    tags: list[str]
    aitags: list[str]
    content_type: str
    video_serial_number: int | None
    thumbnail_url: str | None
    video_url: str | None
    score: float


class RecommendationService:
    def __init__(self) -> None:
        mongo_uri = os.getenv("MONGODB_KEY") or os.getenv("MONGO_URI")
        if not mongo_uri:
            raise RuntimeError("Set MONGODB_KEY or MONGO_URI before using recommendations.")

        try:
            self._client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        except PyMongoError as exc:
            raise RuntimeError("Unable to initialize MongoDB client.") from exc
        self._db_name = os.getenv("MONGO_DB_NAME", "test")
        self._collection_name = os.getenv("VIDEOS_COLLECTION", "videos")
        self._cache_ttl_seconds = int(os.getenv("RECOMMENDER_CACHE_TTL_SECONDS", "300"))
        self._cached_at = 0.0
        self._videos: list[dict[str, Any]] = []
        self._idf: dict[str, float] = {}
        self._vectors: list[dict[str, float]] = []

    @property
    def _videos_collection(self) -> Collection:
        return self._client[self._db_name][self._collection_name]

    def recommend(
        self,
        user_tags: list[str],
        watched_video_ids: list[str],
        content_type: ContentFilter,
        limit: int,
    ) -> list[RecommendationItem]:
        self._refresh_index_if_needed()

        watched_ids = set(_clean_ids(watched_video_ids))
        profile_terms = self._build_user_profile_terms(user_tags, watched_ids)
        if not profile_terms:
            return self._latest_unwatched(watched_ids, content_type, limit)

        if not self._idf or not self._vectors:
            return []

        user_vector = _tfidf_vector(profile_terms, self._idf)

        ranked: list[tuple[float, dict[str, Any]]] = []
        for index, video in enumerate(self._videos):
            video_id = str(video["_id"])
            if video_id in watched_ids:
                continue
            if content_type != "all" and video.get("contentType") != content_type:
                continue
            ranked.append((_cosine_score(user_vector, self._vectors[index]), video))

        ranked.sort(key=lambda entry: (_score_bucket(entry[0]), _created_sort_key(entry[1])), reverse=True)
        return [_to_recommendation_item(video, score) for score, video in ranked[:limit]]

    def _refresh_index_if_needed(self) -> None:
        now = time.time()
        if self._videos and now - self._cached_at < self._cache_ttl_seconds:
            return

        try:
            videos = list(
                self._videos_collection.find(
                    {
                        "isDeleted": {"$ne": True},
                        "visibility": "public",
                        "contentType": {"$in": ["video", "vibe"]},
                    },
                    {
                        "_id": 1,
                        "title": 1,
                        "description": 1,
                        "tags": 1,
                        "aitags": 1,
                        "aiTags": 1,
                        "contentType": 1,
                        "videoSerialNumber": 1,
                        "thumbnailUrl": 1,
                        "videoUrl": 1,
                        "createdAt": 1,
                    },
                )
            )
        except PyMongoError as exc:
            raise RuntimeError("Unable to load videos from MongoDB.") from exc

        for video in videos:
            video["modelTerms"] = _model_terms(video)

        self._videos = videos
        self._cached_at = now
        if not videos:
            self._idf = {}
            self._vectors = []
            return

        self._idf = _build_idf([video["modelTerms"] for video in videos])
        self._vectors = [_tfidf_vector(video["modelTerms"], self._idf) for video in videos]

    def _build_user_profile_terms(self, user_tags: list[str], watched_ids: set[str]) -> list[str]:
        terms = _clean_tags(user_tags)
        watched_videos = [video for video in self._videos if str(video["_id"]) in watched_ids]

        for video in watched_videos:
            terms.extend(_clean_tags(video.get("tags")))
            terms.extend(_clean_tags(video.get("aitags") or video.get("aiTags")))
            terms.extend(_text_tokens(video.get("title")))

        return terms

    def _latest_unwatched(
        self,
        watched_ids: set[str],
        content_type: ContentFilter,
        limit: int,
    ) -> list[RecommendationItem]:
        candidates = [
            video
            for video in self._videos
            if str(video["_id"]) not in watched_ids
            and (content_type == "all" or video.get("contentType") == content_type)
        ]
        candidates.sort(key=_created_sort_key, reverse=True)
        return [_to_recommendation_item(video, 0.0) for video in candidates[:limit]]


def _clean_ids(values: list[str]) -> list[str]:
    ids: list[str] = []
    for value in values:
        for candidate in str(value).split(","):
            candidate = candidate.strip()
            if ObjectId.is_valid(candidate):
                ids.append(candidate)
    return ids


def _clean_tags(value: Any) -> list[str]:
    if not isinstance(value, list):
        value = str(value or "").split(",")

    return [str(tag).strip().lower() for tag in value if str(tag).strip()]


def _text_tokens(value: Any) -> list[str]:
    return re.findall(r"[a-z0-9]+", str(value or "").lower())


def _model_terms(video: dict[str, Any]) -> list[str]:
    tags = _clean_tags(video.get("tags"))
    aitags = _clean_tags(video.get("aitags") or video.get("aiTags"))
    title_terms = _text_tokens(video.get("title"))
    description_terms = _text_tokens(video.get("description"))
    unigrams = tags + tags + aitags + title_terms + description_terms
    return unigrams + _bigrams(unigrams)


def _bigrams(values: list[str]) -> list[str]:
    return [f"{left} {right}" for left, right in zip(values, values[1:])]


def _build_idf(documents: list[list[str]]) -> dict[str, float]:
    doc_count = len(documents)
    document_frequency: Counter[str] = Counter()
    for terms in documents:
        document_frequency.update(set(terms))

    return {
        term: math.log((1 + doc_count) / (1 + frequency)) + 1
        for term, frequency in document_frequency.items()
    }


def _tfidf_vector(terms: list[str], idf: dict[str, float]) -> dict[str, float]:
    counts = Counter(terms)
    if not counts:
        return {}

    max_count = max(counts.values())
    vector = {
        term: (count / max_count) * idf[term]
        for term, count in counts.items()
        if term in idf
    }
    norm = math.sqrt(sum(value * value for value in vector.values()))
    if not norm:
        return {}
    return {term: value / norm for term, value in vector.items()}


def _cosine_score(left: dict[str, float], right: dict[str, float]) -> float:
    if not left or not right:
        return 0.0

    if len(left) > len(right):
        left, right = right, left
    return sum(value * right.get(term, 0.0) for term, value in left.items())


def _score_bucket(score: float) -> float:
    return score if score > 0 else -1


def _created_sort_key(video: dict[str, Any]) -> float:
    created_at = video.get("createdAt")
    if hasattr(created_at, "timestamp"):
        return float(created_at.timestamp())
    return 0.0


def _to_recommendation_item(video: dict[str, Any], score: float) -> RecommendationItem:
    return RecommendationItem(
        id=str(video["_id"]),
        title=str(video.get("title") or ""),
        description=str(video.get("description") or ""),
        tags=_clean_tags(video.get("tags")),
        aitags=_clean_tags(video.get("aitags") or video.get("aiTags")),
        content_type=str(video.get("contentType") or ""),
        video_serial_number=video.get("videoSerialNumber"),
        thumbnail_url=video.get("thumbnailUrl"),
        video_url=video.get("videoUrl"),
        score=round(score, 6),
    )
