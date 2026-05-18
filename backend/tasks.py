"""
Celery app and tasks for Suno generation polling. Run from backend/: celery -A tasks worker -l info
"""
import os
import time
from celery import Celery
from config import (
    CELERY_BROKER_URL,
    CELERY_RESULT_BACKEND,
    SUNO_POLL_INTERVAL_SEC,
    SUNO_POLL_MAX_WAIT_SEC,
)

app = Celery(
    "melodygift",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


def poll_suno_until_done(song_id: str) -> dict:
    """
    Poll Suno API until task completes or timeout. Update Redis job store.
    On failure, call internal refund endpoint. Can be run from Celery or in-process.
    """
    from suno_job_store import get_job, set_job_completed, set_job_failed
    from services.suno_client import get_record_info, SunoAPIError

    job = get_job(song_id)
    if not job:
        return {"ok": False, "error": "job_not_found"}
    user_id = job.get("user_id")
    suno_task_id = job.get("suno_task_id")
    if not suno_task_id:
        return {"ok": False, "error": "no_suno_task_id"}

    deadline = time.monotonic() + SUNO_POLL_MAX_WAIT_SEC
    last_status = None

    while time.monotonic() < deadline:
        try:
            data = get_record_info(suno_task_id)
        except SunoAPIError as e:
            set_job_failed(song_id, str(e))
            _refund_user(user_id, song_id)
            return {"ok": False, "error": str(e)}
        except Exception as e:
            set_job_failed(song_id, str(e))
            _refund_user(user_id, song_id)
            return {"ok": False, "error": str(e)}

        status = (data.get("status") or "").upper()
        last_status = status

        if status == "SUCCESS":
            response = data.get("response") or {}
            suno_data = response.get("sunoData") or response.get("data") or []
            audio_url = None
            if suno_data:
                first = suno_data[0] if isinstance(suno_data, list) else suno_data
                audio_url = first.get("audioUrl") or first.get("audio_url")
            if audio_url:
                set_job_completed(song_id, audio_url)
                return {"ok": True, "status": "completed", "audio_url": audio_url}
            set_job_failed(song_id, "No audio URL in response")
            _refund_user(user_id, song_id)
            return {"ok": False, "error": "no_audio_url"}

        if status in ("CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR", "FAILED"):
            err = data.get("errorMessage") or data.get("error_message") or status
            set_job_failed(song_id, err)
            _refund_user(user_id, song_id)
            return {"ok": False, "error": err}

        time.sleep(SUNO_POLL_INTERVAL_SEC)

    set_job_failed(song_id, "Timeout waiting for Suno")
    _refund_user(user_id, song_id)
    return {"ok": False, "error": "timeout", "last_status": last_status}


@app.task(bind=True, max_retries=0)
def poll_suno_task(self, song_id: str) -> dict:
    """Celery task: poll Suno API until done. Uses poll_suno_until_done()."""
    return poll_suno_until_done(song_id)


def _refund_user(user_id: str, song_id: str) -> None:
    """Call internal API to refund one credit on failure."""
    import requests
    base = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
    secret = os.getenv("INTERNAL_SECRET", "")
    try:
        requests.post(
            f"{base}/internal/refund",
            json={"user_id": user_id, "song_id": song_id},
            headers={"X-Internal-Secret": secret},
            timeout=5,
        )
    except Exception:
        pass
