"""
Suno API client (sunoapi.org). All text is sent as UTF-8 for Kyrgyz/Russian support.
"""
from __future__ import annotations

import requests
from typing import Any, Optional

from config import SUNO_API_KEY, SUNO_API_BASE_URL, SUNO_DEFAULT_MODEL, BACKEND_URL


class SunoAPIError(Exception):
    def __init__(self, message: str, code: Optional[int] = None, raw: Optional[dict] = None):
        self.code = code
        self.raw = raw
        super().__init__(message)


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {SUNO_API_KEY}",
        "Content-Type": "application/json; charset=utf-8",
    }


def generate_custom(
    *,
    title: str,
    prompt: str,
    style: str,
    instrumental: bool = False,
    model: Optional[str] = None,
    call_back_url: Optional[str] = None,
) -> str:
    """
    Generate music in Custom Mode. Returns Suno task_id.
    - prompt: lyrics (UTF-8, e.g. Kyrgyz/Russian)
    - style: tags (genre/style)
    - title: song title
    """
    if not SUNO_API_KEY:
        raise SunoAPIError("SUNO_API_KEY is not configured")

    url = f"{SUNO_API_BASE_URL}/generate"
    chosen_model = model or SUNO_DEFAULT_MODEL
    # V4 и V4_5ALL: title max 80; V4_5, V4_5PLUS, V5: max 100 (docs.sunoapi.org)
    title_max = 80 if chosen_model in ("V4", "V4_5ALL") else 100
    payload: dict[str, Any] = {
        "customMode": True,
        "instrumental": instrumental,
        "model": chosen_model,
        "title": title[:title_max].strip(),
        "style": style[:1000].strip(),
        "prompt": (prompt[:5000].strip() if prompt else ""),
    }
    if not instrumental and not payload["prompt"]:
        payload["prompt"] = "[Verse] MelodyGift\n[Chorus] 🎵"
    # Suno требует callBackUrl; по умолчанию — наш callback
    payload["callBackUrl"] = (call_back_url or "").strip() or f"{BACKEND_URL.rstrip('/')}/api/suno/callback"

    resp = requests.post(url, json=payload, headers=_headers(), timeout=30)
    resp.encoding = "utf-8"
    data = resp.json()

    if resp.status_code != 200:
        raise SunoAPIError(
            data.get("msg", resp.text) or f"HTTP {resp.status_code}",
            code=data.get("code"),
            raw=data,
        )
    if data.get("code") != 200:
        raise SunoAPIError(
            data.get("msg", "Unknown error"),
            code=data.get("code"),
            raw=data,
        )
    task_id = (data.get("data") or {}).get("taskId")
    if not task_id:
        raise SunoAPIError("No taskId in response", raw=data)
    return str(task_id)


def get_record_info(task_id: str) -> dict:
    """
    Get generation status and result. Returns API data dict with status, response.sunoData, etc.
    """
    if not SUNO_API_KEY:
        raise SunoAPIError("SUNO_API_KEY is not configured")

    url = f"{SUNO_API_BASE_URL}/generate/record-info"
    resp = requests.get(url, params={"taskId": task_id}, headers=_headers(), timeout=15)
    resp.encoding = "utf-8"
    data = resp.json()

    if resp.status_code != 200:
        raise SunoAPIError(
            data.get("msg", resp.text) or f"HTTP {resp.status_code}",
            code=data.get("code"),
            raw=data,
        )
    if data.get("code") != 200:
        raise SunoAPIError(
            data.get("msg", "Unknown error"),
            code=data.get("code"),
            raw=data,
        )
    return data.get("data") or {}
