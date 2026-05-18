"""
Redis store for Suno generation jobs. Used by API and Celery worker to share state.
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional

try:
    import redis
    _redis: Optional[redis.Redis] = None
    _redis_exceptions = (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError)

    def get_redis() -> Optional[redis.Redis]:
        global _redis
        if _redis is None:
            url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            try:
                _redis = redis.from_url(url, decode_responses=True)
                _redis.ping()
            except Exception:
                _redis = None
        return _redis

    def _clear_redis_on_error() -> None:
        global _redis
        _redis = None
except ImportError:
    redis = None  # type: ignore
    _redis_exceptions = (Exception,)  # unused when redis not installed
    _clear_redis_on_error = lambda: None

    def get_redis() -> None:
        return None


JOB_PREFIX = "suno:job:"
TASK_TO_SONG_PREFIX = "suno:task:"


def set_job(song_id: str, user_id: str, suno_task_id: str) -> None:
    r = get_redis()
    if not r:
        return
    try:
        key = JOB_PREFIX + song_id
        r.hset(key, mapping={
            "user_id": user_id,
            "suno_task_id": suno_task_id,
            "status": "pending",
            "audio_url": "",
            "error_message": "",
        })
        r.expire(key, 86400 * 7)  # 7 days
        r.set(TASK_TO_SONG_PREFIX + suno_task_id, song_id, ex=86400 * 7)
    except _redis_exceptions:
        _clear_redis_on_error()


def get_song_id_by_task(suno_task_id: str) -> Optional[str]:
    r = get_redis()
    if not r:
        return None
    try:
        return r.get(TASK_TO_SONG_PREFIX + suno_task_id)
    except _redis_exceptions:
        _clear_redis_on_error()
        return None


def get_job(song_id: str) -> Optional[dict]:
    r = get_redis()
    if not r:
        return None
    try:
        key = JOB_PREFIX + song_id
        raw = r.hgetall(key)
        if not raw:
            return None
        return raw
    except _redis_exceptions:
        _clear_redis_on_error()
        return None


def set_job_completed(song_id: str, audio_url: str) -> None:
    r = get_redis()
    if not r:
        return
    try:
        key = JOB_PREFIX + song_id
        r.hset(key, mapping={"status": "completed", "audio_url": audio_url})
    except _redis_exceptions:
        _clear_redis_on_error()


def set_job_failed(song_id: str, error_message: str = "") -> None:
    r = get_redis()
    if not r:
        return
    try:
        key = JOB_PREFIX + song_id
        r.hset(key, mapping={"status": "failed", "error_message": error_message or "Unknown error"})
    except _redis_exceptions:
        _clear_redis_on_error()
