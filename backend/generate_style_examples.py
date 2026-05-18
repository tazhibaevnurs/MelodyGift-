"""
Скрипт однократной генерации примеров по стилям для экрана «Выбери стиль песни».
Запуск из backend/: python generate_style_examples.py
Требует: SUNO_API_KEY в .env, Redis (для callback опционально), requests.

Для каждого стиля (Веселый, Лиричный, Романтичный) вызывает Suno, ждёт готовности,
скачивает MP3 и сохраняет в static/style_examples/{cheerful,lyrical,romantic}.mp3
"""
from __future__ import annotations

import os
import sys
import time
import requests
from pathlib import Path

# загрузка .env
_env = Path(__file__).resolve().parent / ".env"
if _env.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(_env)
    except ImportError:
        pass

STYLE_CONFIG = [
    ("cheerful", "Веселый", "[Verse] Солнце светит, радость в сердце\n[Chorus] Подари улыбку, веселись!"),
    ("lyrical", "Лиричный", "[Verse] Тихо звёзды над землёй\n[Chorus] Лиричная мелодия души."),
    ("romantic", "Романтичный", "[Verse] Ты и я под луной\n[Chorus] Романтика навсегда."),
]

OUTPUT_DIR = Path(__file__).resolve().parent / "static" / "style_examples"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main():
    try:
        from config import SUNO_API_KEY
        from services.suno_client import generate_custom, get_record_info, SunoAPIError
    except ImportError as e:
        print("Ошибка импорта:", e)
        print("Запускайте из папки backend: python generate_style_examples.py")
        sys.exit(1)
    if not (SUNO_API_KEY and SUNO_API_KEY.strip()):
        print("SUNO_API_KEY не задан в .env")
        sys.exit(1)

    for style_id, tag, lyrics in STYLE_CONFIG:
        out_path = OUTPUT_DIR / f"{style_id}.mp3"
        if out_path.exists():
            print(f"[{style_id}] Уже есть {out_path.name}, пропуск.")
            continue
        title = f"Пример: {tag}"
        print(f"[{style_id}] Генерация через Suno (стиль {tag})...")
        try:
            task_id = generate_custom(
                title=title,
                prompt=lyrics,
                style=tag,
                instrumental=False,
            )
        except SunoAPIError as e:
            print(f"[{style_id}] Suno ошибка: {e}")
            continue
        # Ожидание готовности (до 5 минут)
        deadline = time.monotonic() + 300
        audio_url = None
        while time.monotonic() < deadline:
            time.sleep(12)
            try:
                data = get_record_info(task_id)
            except Exception as e:
                print(f"[{style_id}] Ошибка опроса: {e}")
                continue
            status = (data.get("status") or "").upper()
            if status == "SUCCESS":
                resp = data.get("response") or {}
                suno_data = resp.get("sunoData") or resp.get("data") or []
                if suno_data:
                    first = suno_data[0] if isinstance(suno_data, list) else suno_data
                    audio_url = first.get("audioUrl") or first.get("audio_url")
                break
            if status in ("CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "FAILED", "SENSITIVE_WORD_ERROR"):
                print(f"[{style_id}] Suno статус: {status}")
                break
        if not audio_url:
            print(f"[{style_id}] Аудио не получено.")
            continue
        print(f"[{style_id}] Скачивание...")
        r = requests.get(audio_url, timeout=60)
        r.raise_for_status()
        out_path.write_bytes(r.content)
        print(f"[{style_id}] Сохранено: {out_path}")

    print("Готово. Файлы в static/style_examples/")


if __name__ == "__main__":
    main()
