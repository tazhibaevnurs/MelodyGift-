"""
MelodyGift KG - Telegram Mini App Backend
AI-powered personalized music gift generator for Kyrgyz market
"""

import asyncio
import time
import uuid
import random
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List

# Загружаем .env из backend/ при старте (для SUNO_API_KEY и др.)
_env_file = Path(__file__).resolve().parent / ".env"
if _env_file.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(_env_file)
    except ImportError:
        pass
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from enum import Enum
import json

# ==================== MODELS ====================

class MusicGenre(str, Enum):
    POP = "pop"
    ROCK = "rock"
    ROMANTIC = "romantic"
    KYRGYZ_FOLK = "kyrgyz_folk"
    JAZZ = "jazz"
    HIP_HOP = "hip_hop"
    BALLAD = "ballad"

class Occasion(str, Enum):
    BIRTHDAY = "birthday"
    WEDDING = "wedding"
    NEW_HOME = "new_home"
    GRATITUDE = "gratitude"
    APOLOGY = "apology"
    LOVE_CONFESSION = "love_confession"
    JUST_BECAUSE = "just_because"
    PROFESSIONAL = "professional"

class Language(str, Enum):
    RUSSIAN = "ru"
    KYRGYZ = "kg"
    ENGLISH = "en"

class UserLanguage(str, Enum):
    RU = "ru"
    KG = "kg"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class RecipientCreate(BaseModel):
    name: str
    gender: Gender
    age: Optional[int] = None
    relation: str = "friend"

class SongCreate(BaseModel):
    recipient_id: str
    occasion: Occasion
    genre: MusicGenre
    language: Language
    custom_message: str = ""
    style_notes: str = ""


class SongGenerateRequest(BaseModel):
    """Custom Mode: lyrics (UTF-8), style/tags, title. Опционально: маппер по стилю + пол вокала + кто/кому."""
    user_id: str = Field(..., description="User ID for credit check")
    title: str = Field(..., min_length=1, max_length=100)
    lyrics: str = Field(..., description="Song lyrics (prompt), UTF-8; CAPITALS = stress", max_length=5000)
    tags: str = Field(..., description="Style: e.g. Весёлый, Лиричный, Романтичный", max_length=1000)
    language: str = Field(default="ru", description="ru or kg")
    instrumental: bool = False
    # Маппер: для [Spoken Word] и стиля по ТЗ
    sender_name: Optional[str] = Field(None, description="Имя отправителя (кто дарит)")
    recipient_name: Optional[str] = Field(None, description="Имя получателя (кому)")
    sender_gender: Optional[str] = Field(None, description="male | female — кто дарит")
    voice_gender: Optional[str] = Field(None, description="male | female — пол вокала")
    relationship: Optional[str] = Field(None, description="male_to_female | female_to_male")

    @field_validator("user_id", mode="before")
    @classmethod
    def user_id_str(cls, v):
        if v is None:
            return v
        return str(v)


class DemoPrepareRequest(BaseModel):
    """Build demo lyrics: О тебе (sender), О получателе (recipient), sender gender."""
    sender_name: str = Field(..., min_length=1, description="Имя отправителя (О тебе)")
    recipient_name: str = Field(..., min_length=1, description="Имя получателя (О получателе)")
    sender_gender: str = Field(..., description="male | female — выбор сценария Мужчина/Женщина")

class UserCreate(BaseModel):
    tg_id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    language: UserLanguage = UserLanguage.RU

class TransactionCreate(BaseModel):
    user_id: str
    amount: float
    payment_method: str
    credits: int


class PurchaseRequest(BaseModel):
    """Body for POST /api/purchase/{song_id} (full version 1000 som)."""
    user_id: str = Field(..., description="Buyer user ID")

# ==================== DATABASE (In-Memory for MVP) ====================

# Demo + Upsell: cost per generation (som), full version price (som), free demo credits for new users
DEMO_GENERATION_COST_SOM = 9
FULL_VERSION_PRICE_SOM = 1000
FREE_DEMO_CREDITS_NEW_USER = 2


class Database:
    def __init__(self):
        self.users = {}
        self.recipients = {}
        self.songs = {}
        self.transactions = {}
        self.credits = {}
        self.free_demo_credits = {}  # user_id -> int
        self.revenue_som = 0.0  # total revenue from full-version purchases
        self.generation_count = 0  # total generations (for admin cost calc)
        # Initialize with demo data
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data for testing"""
        # Demo user
        self.users["demo_user"] = {
            "id": "demo_user",
            "tg_id": 123456789,
            "first_name": "Demo",
            "last_name": "User",
            "username": "demouser",
            "language": "ru",
            "is_premium": False,
            "role": "user",
            "balance_som": 0.0,
            "created_at": datetime.now().isoformat(),
        }
        self.credits["demo_user"] = 3
        self.free_demo_credits["demo_user"] = FREE_DEMO_CREDITS_NEW_USER
        
        # Demo recipient
        self.recipients["demo_recipient_1"] = {
            "id": "demo_recipient_1",
            "user_id": "demo_user",
            "name": "Айжан",
            "gender": "female",
            "age": 25,
            "relation": "подруга",
            "created_at": datetime.now().isoformat()
        }
    
    def create_user(self, user_data: UserCreate) -> dict:
        user_id = str(user_data.tg_id)
        if user_id in self.users:
            return self.users[user_id]
        self.users[user_id] = {
            "id": user_id,
            "tg_id": user_data.tg_id,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "username": user_data.username,
            "language": user_data.language.value if hasattr(user_data.language, 'value') else user_data.language,
            "is_premium": False,
            "role": "user",
            "balance_som": 0.0,
            "created_at": datetime.now().isoformat(),
        }
        self.credits[user_id] = 3
        self.free_demo_credits[user_id] = FREE_DEMO_CREDITS_NEW_USER
        return self.users[user_id]
    
    def get_user(self, user_id: str) -> Optional[dict]:
        return self.users.get(user_id)
    
    def get_user_by_tg_id(self, tg_id: int) -> Optional[dict]:
        for user in self.users.values():
            if user.get("tg_id") == tg_id:
                return user
        return None
    
    def get_user_credits(self, user_id: str) -> int:
        return self.credits.get(user_id, 0)

    def get_user_free_demo_credits(self, user_id: str) -> int:
        return self.free_demo_credits.get(user_id, 0)

    def deduct_free_demo_credit(self, user_id: str) -> bool:
        n = self.free_demo_credits.get(user_id, 0)
        if n <= 0:
            return False
        self.free_demo_credits[user_id] = n - 1
        return True

    def deduct_credit(self, user_id: str) -> bool:
        if self.credits.get(user_id, 0) > 0:
            self.credits[user_id] -= 1
            return True
        return False
    
    def add_credits(self, user_id: str, amount: int):
        self.credits[user_id] = self.credits.get(user_id, 0) + amount
    
    def create_recipient(self, user_id: str, recipient_data: RecipientCreate) -> dict:
        recipient_id = str(uuid.uuid4())
        self.recipients[recipient_id] = {
            "id": recipient_id,
            "user_id": user_id,
            "name": recipient_data.name,
            "gender": recipient_data.gender.value if hasattr(recipient_data.gender, 'value') else recipient_data.gender,
            "age": recipient_data.age,
            "relation": recipient_data.relation,
            "created_at": datetime.now().isoformat()
        }
        return self.recipients[recipient_id]
    
    def get_recipients(self, user_id: str) -> List[dict]:
        return [r for r in self.recipients.values() if r["user_id"] == user_id]
    
    def create_song(self, user_id: str, song_data: SongCreate) -> dict:
        song_id = str(uuid.uuid4())
        self.songs[song_id] = {
            "id": song_id,
            "user_id": user_id,
            "recipient_id": song_data.recipient_id,
            "occasion": song_data.occasion.value if hasattr(song_data.occasion, 'value') else song_data.occasion,
            "genre": song_data.genre.value if hasattr(song_data.genre, 'value') else song_data.genre,
            "language": song_data.language.value if hasattr(song_data.language, 'value') else song_data.language,
            "custom_message": song_data.custom_message,
            "style_notes": song_data.style_notes,
            "status": "pending",
            "audio_url": None,
            "created_at": datetime.now().isoformat()
        }
        return self.songs[song_id]

    def create_song_custom(
        self,
        user_id: str,
        title: str,
        lyrics: str,
        tags: str,
        suno_task_id: str,
        instrumental: bool = False,
    ) -> dict:
        """Create song record for Suno Custom Mode generation."""
        song_id = str(uuid.uuid4())
        self.songs[song_id] = {
            "id": song_id,
            "user_id": user_id,
            "recipient_id": "",
            "occasion": "just_because",
            "genre": "pop",
            "language": "ru",
            "custom_message": lyrics,
            "style_notes": tags,
            "title": title,
            "status": "processing",
            "audio_url": None,
            "suno_task_id": suno_task_id,
            "instrumental": instrumental,
            "is_paid": False,
            "used_free_demo": False,
            "created_at": datetime.now().isoformat(),
        }
        self.generation_count += 1
        return self.songs[song_id]

    def set_song_used_free_demo(self, song_id: str, value: bool) -> None:
        if song_id in self.songs:
            self.songs[song_id]["used_free_demo"] = value
    
    def update_song_status(self, song_id: str, status: str, audio_url: str = None):
        if song_id in self.songs:
            self.songs[song_id]["status"] = status
            if audio_url:
                self.songs[song_id]["audio_url"] = audio_url
                self.songs[song_id]["completed_at"] = datetime.now().isoformat()

    def update_song_suno_task_id(self, song_id: str, suno_task_id: str) -> None:
        """Set suno_task_id on song after async start (used when Suno called in background)."""
        if song_id in self.songs:
            self.songs[song_id]["suno_task_id"] = suno_task_id

    def sync_song_from_suno_job(self, song_id: str, job: dict) -> None:
        """Update in-memory song from Redis Suno job (status, audio_url)."""
        if song_id not in self.songs:
            return
        status = job.get("status")
        if status == "completed":
            self.songs[song_id]["status"] = "completed"
            url = job.get("audio_url")
            if url:
                self.songs[song_id]["audio_url"] = url
                self.songs[song_id]["completed_at"] = datetime.now().isoformat()
        elif status == "failed":
            self.songs[song_id]["status"] = "failed"
    
    def get_song(self, song_id: str) -> Optional[dict]:
        return self.songs.get(song_id)
    
    def get_user_songs(self, user_id: str) -> List[dict]:
        return [s for s in self.songs.values() if s["user_id"] == user_id]
    
    def create_transaction(self, user_id: str, transaction_data: TransactionCreate) -> dict:
        transaction_id = str(uuid.uuid4())
        self.transactions[transaction_id] = {
            "id": transaction_id,
            "user_id": user_id,
            "amount": transaction_data.amount,
            "payment_method": transaction_data.payment_method,
            "credits": transaction_data.credits,
            "status": "completed",
            "created_at": datetime.now().isoformat()
        }
        # Add credits to user
        self.add_credits(user_id, transaction_data.credits)
        return self.transactions[transaction_id]
    
    def get_transactions(self, user_id: str) -> List[dict]:
        return [t for t in self.transactions.values() if t["user_id"] == user_id]

    def set_song_paid(self, song_id: str) -> bool:
        if song_id not in self.songs:
            return False
        self.songs[song_id]["is_paid"] = True
        self.revenue_som += FULL_VERSION_PRICE_SOM
        return True

    def get_admin_stats(self) -> dict:
        total_revenue = self.revenue_som
        total_cost = self.generation_count * DEMO_GENERATION_COST_SOM
        net_profit = total_revenue - total_cost
        paid_songs = len([s for s in self.songs.values() if s.get("is_paid")])
        completed = len([s for s in self.songs.values() if s.get("status") == "completed"])
        conversion = (paid_songs / completed * 100) if completed else 0.0
        return {
            "revenue_som": total_revenue,
            "generation_count": self.generation_count,
            "cost_som": total_cost,
            "net_profit_som": net_profit,
            "paid_songs_count": paid_songs,
            "completed_songs_count": completed,
            "conversion_percent": round(conversion, 1),
        }

    def get_all_songs_for_admin(self) -> List[dict]:
        return list(self.songs.values())

# Initialize database
db = Database()

# ==================== MUSIC GENERATION ENGINE ====================

class MusicGenerator:
    """Mock music generator for demo purposes"""
    
    # Sample audio URLs for demo (public domain music samples)
    SAMPLE_AUDIOS = {
        MusicGenre.POP: [
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
        ],
        MusicGenre.ROCK: [
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"
        ],
        MusicGenre.ROMANTIC: [
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
        ],
        MusicGenre.KYRGYZ_FOLK: [
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
        ],
        MusicGenre.JAZZ: [
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
        ],
        MusicGenre.HIP_HOP: [
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3"
        ],
        MusicGenre.BALLAD: [
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3"
        ]
    }
    
    @staticmethod
    async def generate_song(song_id: str, genre: str, language: str, custom_message: str):
        """Simulate AI music generation process. On error sets song status to 'failed'."""
        try:
            # Simulate processing time (real AI takes 30-60 seconds)
            await asyncio.sleep(random.uniform(2, 5))
            genre_val = (genre or "").strip() or "pop"
            genre_enum = MusicGenre(genre_val) if genre_val in [g.value for g in MusicGenre] else MusicGenre.POP
            audio_url = random.choice(MusicGenerator.SAMPLE_AUDIOS.get(genre_enum, MusicGenerator.SAMPLE_AUDIOS[MusicGenre.POP]))
            db.update_song_status(song_id, "completed", audio_url)
            return {"song_id": song_id, "audio_url": audio_url}
        except Exception as e:
            db.update_song_status(song_id, "failed", None)
            raise


async def _run_mock_generation(song_id: str, genre: str, language: str, custom_message: str):
    """Wrapper so background task always marks song failed on exception."""
    try:
        await music_generator.generate_song(song_id, genre, language, custom_message or "")
    except Exception:
        db.update_song_status(song_id, "failed", None)

music_generator = MusicGenerator()

# ==================== APP SETUP ====================

app = FastAPI(
    title="MelodyGift KG API",
    description="Telegram Mini App for AI-powered personalized music gifts",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Примеры по стилям: статика (cheerful.mp3, lyrical.mp3, romantic.mp3)
_static_examples_dir = Path(__file__).resolve().parent / "static" / "style_examples"
if _static_examples_dir.exists():
    app.mount("/api/style-examples", StaticFiles(directory=str(_static_examples_dir)), name="style_examples")

# ==================== API ENDPOINTS ====================

@app.get("/")
async def root():
    return {
        "name": "MelodyGift KG API",
        "version": "1.0.0",
        "status": "running",
        "description": "AI-powered personalized music gifts for Kyrgyzstan"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/songs/suno-status")
async def suno_status():
    """Проверка готовности Suno API: почему может быть 503 на POST /api/songs/generate."""
    out = {"suno_ready": False, "reason": None, "hint": None}
    try:
        from config import SUNO_API_KEY
        if not (SUNO_API_KEY and SUNO_API_KEY.strip()):
            out["reason"] = "SUNO_API_KEY is not set"
            out["hint"] = "Create backend/.env with: SUNO_API_KEY=your_key (get key at sunoapi.org)"
            return out
        from services.suno_client import generate_custom
        out["suno_ready"] = True
        out["reason"] = "OK"
        return out
    except ImportError as e:
        out["reason"] = f"Missing dependency: {e}"
        out["hint"] = "Run: pip install requests redis celery"
        return out

# User endpoints
@app.post("/api/users")
async def create_user(user_data: UserCreate):
    """Create or get existing user by Telegram ID. Returns user with credits, free_demo_credits, balance_som."""
    user = db.create_user(user_data)
    out = dict(user)
    out["credits"] = db.get_user_credits(user["id"])
    out["free_demo_credits"] = db.get_user_free_demo_credits(user["id"])
    out.setdefault("balance_som", 0.0)
    out.setdefault("role", "user")
    return out

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Get user profile (includes credits, free_demo_credits, balance_som)."""
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    out = dict(user)
    out["credits"] = db.get_user_credits(user_id)
    out["free_demo_credits"] = db.get_user_free_demo_credits(user_id)
    out.setdefault("balance_som", 0.0)
    out.setdefault("role", "user")
    return out

@app.get("/api/users/{user_id}/credits")
async def get_user_credits(user_id: str):
    """Get user's credit balance"""
    return {
        "user_id": user_id,
        "credits": db.get_user_credits(user_id)
    }

# Recipient endpoints
@app.post("/api/users/{user_id}/recipients")
async def create_recipient(user_id: str, recipient_data: RecipientCreate):
    """Create a new recipient"""
    recipient = db.create_recipient(user_id, recipient_data)
    return recipient

@app.get("/api/users/{user_id}/recipients")
async def get_recipients(user_id: str):
    """Get all user's recipients"""
    return db.get_recipients(user_id)

# -------- Demo script: подстановка имён в сценарий --------
@app.post("/api/songs/prepare-demo")
async def prepare_demo(body: DemoPrepareRequest):
    """
    Build demo lyrics with {sender} and {recipient} replaced.
    Male sender → «Мужчина — Жене»; female → «Женщина — мужу».
    """
    from demo_script import build_demo_lyrics
    lyrics = build_demo_lyrics(
        sender_name=body.sender_name.strip(),
        recipient_name=body.recipient_name.strip(),
        is_male_sender=body.sender_gender.strip().lower() == "male",
    )
    recipient = body.recipient_name.strip()
    sender = body.sender_name.strip()
    title = f"Для {recipient} от {sender}"
    return {"lyrics": lyrics, "title": title}


# -------- Suno callback: Suno шлёт сюда результат генерации --------
@app.post("/api/suno/callback")
async def suno_callback(request: Request):
    """
    Webhook от Suno при завершении генерации. Тело: code, msg, data.task_id, data.data[].audio_url.
    Обновляем Redis (set_job_completed), чтобы GET /api/songs/{id} сразу видел готовую песню.
    """
    try:
        body = await request.json()
    except Exception:
        return {"status": "received"}
    code = body.get("code")
    data = body.get("data") or {}
    task_id = data.get("task_id") or data.get("taskId")
    if not task_id:
        return {"status": "received"}
    try:
        from suno_job_store import get_song_id_by_task, set_job_completed, set_job_failed
        song_id = get_song_id_by_task(str(task_id))
        if not song_id:
            return {"status": "received"}
        if code == 200:
            tracks = data.get("data") or []
            audio_url = None
            if tracks:
                first = tracks[0] if isinstance(tracks, list) else tracks
                audio_url = first.get("audio_url") or first.get("audioUrl")
            if audio_url:
                set_job_completed(song_id, audio_url)
        else:
            set_job_failed(song_id, body.get("msg", "Suno callback error"))
    except Exception:
        pass
    return {"status": "received"}


# -------- Suno Custom Mode: POST /api/songs/generate --------
@app.post("/api/songs/generate")
async def generate_song_suno(body: SongGenerateRequest, background_tasks: BackgroundTasks):
    """
    Создание песни через Suno API (Custom Mode). Эндпоинт используется экраном «Песня в самое сердце».
    Проверяет кредиты, списывает 1, вызывает sunoapi.org; статус опрашивается Celery или в процессе (1–2 мин).
    """
    user_id = body.user_id
    free_demo = db.get_user_free_demo_credits(user_id)
    if free_demo <= 0 and db.get_user_credits(user_id) <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits or free demo attempts")

    try:
        from services.suno_client import generate_custom, SunoAPIError
        from suno_job_store import set_job
        from tasks import poll_suno_task, poll_suno_until_done
        from prompt_builder import build_suno_prompt
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Suno integration not configured: {e}. Install: pip install requests redis celery. Then set SUNO_API_KEY in backend/.env",
        )

    # Проверяем ключ (config уже загружает .env при импорте suno_client)
    from config import SUNO_API_KEY as _suno_key
    if not (_suno_key and _suno_key.strip()):
        raise HTTPException(
            status_code=503,
            detail="SUNO_API_KEY is not set. Create backend/.env with SUNO_API_KEY=your_key (get key at sunoapi.org)",
        )

    # Маппер: стиль + пол вокала + кто/кому → [Spoken Word] + [SONG START] + lyrics (ударения не трогаем — CAPITALS = STRESS)
    if body.sender_name and body.recipient_name:
        try:
            from services.prompt_engine import build_final_prompt
            built = build_final_prompt(
                style=body.tags,
                voice_gender=body.voice_gender or body.sender_gender or "female",
                sender=body.sender_name,
                recipient=body.recipient_name,
                relationship=body.relationship or "",
                sender_gender=body.sender_gender or "female",
                user_lyrics=body.lyrics,
                is_demo=True,
                language=body.language,
            )
            full_prompt = built["prompt"]
            style_for_api = built["tags"]
        except Exception:
            from prompt_builder import build_suno_prompt
            full_prompt, style_for_api = build_suno_prompt(
                lyrics=body.lyrics,
                style_input=body.tags,
                language=body.language,
                is_demo=True,
            )
    else:
        from prompt_builder import build_suno_prompt
        full_prompt, style_for_api = build_suno_prompt(
            lyrics=body.lyrics,
            style_input=body.tags,
            language=body.language,
            is_demo=True,
        )

    used_free = free_demo > 0
    if used_free:
        db.deduct_free_demo_credit(user_id)
    else:
        db.deduct_credit(user_id)
    song = db.create_song_custom(
        user_id=user_id,
        title=body.title,
        lyrics=body.lyrics,
        tags=body.tags,
        suno_task_id="",  # заполнится в фоне после вызова Suno
        instrumental=body.instrumental,
    )
    db.set_song_used_free_demo(song["id"], used_free)

    # Опрос Suno без Redis (fallback, когда Redis недоступен): обновляет только in-memory db
    def _poll_suno_and_update_db(song_id: str, user_id: str, suno_task_id: str) -> None:
        from config import SUNO_POLL_INTERVAL_SEC, SUNO_POLL_MAX_WAIT_SEC
        from services.suno_client import get_record_info, SunoAPIError
        import requests
        deadline = time.monotonic() + SUNO_POLL_MAX_WAIT_SEC
        base = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
        secret = os.getenv("INTERNAL_SECRET", "")
        while time.monotonic() < deadline:
            try:
                data = get_record_info(suno_task_id)
            except SunoAPIError as e:
                db.update_song_status(song_id, "failed", None)
                try:
                    requests.post(f"{base}/internal/refund", json={"user_id": user_id, "song_id": song_id}, headers={"X-Internal-Secret": secret}, timeout=5)
                except Exception:
                    pass
                return
            except Exception:
                db.update_song_status(song_id, "failed", None)
                try:
                    requests.post(f"{base}/internal/refund", json={"user_id": user_id, "song_id": song_id}, headers={"X-Internal-Secret": secret}, timeout=5)
                except Exception:
                    pass
                return
            status = (data.get("status") or "").upper()
            if status == "SUCCESS":
                response = data.get("response") or {}
                suno_data = response.get("sunoData") or response.get("data") or []
                audio_url = None
                if suno_data:
                    first = suno_data[0] if isinstance(suno_data, list) else suno_data
                    audio_url = first.get("audioUrl") or first.get("audio_url")
                if audio_url:
                    db.update_song_status(song_id, "completed", audio_url)
                    return
                db.update_song_status(song_id, "failed", None)
                try:
                    requests.post(f"{base}/internal/refund", json={"user_id": user_id, "song_id": song_id}, headers={"X-Internal-Secret": secret}, timeout=5)
                except Exception:
                    pass
                return
            if status in ("CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR", "FAILED"):
                err = data.get("errorMessage") or data.get("error_message") or status
                db.update_song_status(song_id, "failed", None)
                try:
                    requests.post(f"{base}/internal/refund", json={"user_id": user_id, "song_id": song_id}, headers={"X-Internal-Secret": secret}, timeout=5)
                except Exception:
                    pass
                return
            time.sleep(SUNO_POLL_INTERVAL_SEC)
        db.update_song_status(song_id, "failed", None)
        try:
            requests.post(f"{base}/internal/refund", json={"user_id": user_id, "song_id": song_id}, headers={"X-Internal-Secret": secret}, timeout=5)
        except Exception:
            pass

    # Вызов Suno и опрос — в фоне, чтобы ответ клиенту пришёл сразу
    def _run_suno_then_poll(
        sid: str,
        uid: str,
        tit: str,
        prompt: str,
        style: str,
        inst: bool,
    ) -> None:
        from suno_job_store import set_job, set_job_failed
        try:
            suno_task_id = generate_custom(
                title=tit.strip(),
                prompt=prompt,
                style=style,
                instrumental=inst,
            )
            db.update_song_suno_task_id(sid, suno_task_id)
            set_job(sid, user_id=uid, suno_task_id=suno_task_id)
            celery_ok = False
            try:
                poll_suno_task.delay(sid)
                celery_ok = True
            except Exception:
                pass
            if not celery_ok:
                result = poll_suno_until_done(sid)
                if result.get("error") == "job_not_found":
                    _poll_suno_and_update_db(sid, uid, suno_task_id)
        except SunoAPIError as e:
            set_job_failed(sid, e.args[0] if e.args else "Suno API error")
            import requests
            base = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
            secret = os.getenv("INTERNAL_SECRET", "")
            try:
                requests.post(
                    f"{base}/internal/refund",
                    json={"user_id": uid, "song_id": sid},
                    headers={"X-Internal-Secret": secret},
                    timeout=5,
                )
            except Exception:
                pass

    background_tasks.add_task(
        _run_suno_then_poll,
        song["id"],
        user_id,
        body.title.strip(),
        full_prompt,
        style_for_api,
        body.instrumental,
    )

    return {
        "song": {
            "id": song["id"],
            "title": song["title"],
            "status": "processing",
            "suno_task_id": "",
            "is_paid": False,
        },
        "remaining_credits": db.get_user_credits(user_id),
        "free_demo_credits": db.get_user_free_demo_credits(user_id),
        "message": "Generation started; completion in 1–2 minutes. Poll GET /api/songs/{id} for status.",
    }


@app.post("/internal/refund")
async def internal_refund(
    request: Request,
    x_internal_secret: Optional[str] = Header(None, alias="X-Internal-Secret"),
):
    """Refund one credit or one free-demo (when Suno generation fails)."""
    secret = os.getenv("INTERNAL_SECRET", "")
    if secret and x_internal_secret != secret:
        raise HTTPException(status_code=403, detail="Forbidden")
    data = await request.json()
    user_id = data.get("user_id")
    song_id = data.get("song_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    song = db.get_song(song_id) if song_id else None
    if song and song.get("used_free_demo"):
        db.free_demo_credits[user_id] = db.free_demo_credits.get(user_id, 0) + 1
        return {"ok": True, "refunded": "free_demo", "free_demo_credits": db.get_user_free_demo_credits(user_id)}
    db.add_credits(user_id, 1)
    return {"ok": True, "refunded": 1, "credits": db.get_user_credits(user_id)}


# Song generation endpoints
@app.post("/api/users/{user_id}/songs")
async def create_song(user_id: str, song_data: SongCreate, background_tasks: BackgroundTasks):
    """Create a new song generation request"""
    # Check credits
    if db.get_user_credits(user_id) <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    # Deduct credit
    db.deduct_credit(user_id)
    
    # Create song record
    song = db.create_song(user_id, song_data)
    
    # Start background generation (wrapper sets 'failed' on exception)
    background_tasks.add_task(
        _run_mock_generation,
        song["id"],
        song.get("genre", "pop"),
        song.get("language", "ru"),
        song.get("custom_message", ""),
    )
    
    return {
        "song": song,
        "remaining_credits": db.get_user_credits(user_id),
        "message": "Song generation started"
    }

def _merge_suno_job_into_song(song: dict) -> dict:
    """Load Suno job from Redis by song id, sync to db and return updated song (job keyed by song_id)."""
    try:
        from suno_job_store import get_job
        job = get_job(song["id"])
        if job:
            db.sync_song_from_suno_job(song["id"], job)
            status = job.get("status")
            if status == "completed":
                song = {**song, "status": "completed", "audio_url": job.get("audio_url") or song.get("audio_url")}
            elif status == "failed":
                song = {**song, "status": "failed"}
    except Exception:
        pass
    return song


@app.get("/api/songs/{song_id}")
async def get_song(song_id: str):
    """Get song details and status (merges Suno job state from Redis if applicable)."""
    song = db.get_song(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    song = _merge_suno_job_into_song(song)
    recipient = db.recipients.get(song.get("recipient_id") or "", {})
    return {
        "song": song,
        "recipient": recipient
    }

@app.get("/api/users/{user_id}/songs")
async def get_user_songs(user_id: str):
    """Get all user's songs (merge Suno job state from Redis for custom songs)."""
    songs = db.get_user_songs(user_id)
    for i, song in enumerate(songs):
        songs[i] = _merge_suno_job_into_song(song)
        rec = db.recipients.get(songs[i].get("recipient_id") or "", {})
        songs[i]["recipient_name"] = rec.get("name", "Unknown") or songs[i].get("title", "Custom")
    return songs


@app.post("/api/purchase/{song_id}")
async def purchase_full_version(song_id: str, body: PurchaseRequest):
    """
    Purchase full version of a demo song (stub: 1000 som).
    On success: is_paid=True, revenue += 1000.
    """
    song = db.get_song(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    if song.get("user_id") != body.user_id:
        raise HTTPException(status_code=403, detail="Not your song")
    if song.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Song not ready")
    if song.get("is_paid"):
        return {"ok": True, "song": song, "message": "Already purchased"}
    db.set_song_paid(song_id)
    song = db.get_song(song_id)
    return {
        "ok": True,
        "song": song,
        "message": "Full version purchased",
        "price_som": FULL_VERSION_PRICE_SOM,
    }


# Payment endpoints
@app.post("/api/users/{user_id}/transactions")
async def create_transaction(user_id: str, transaction_data: TransactionCreate):
    """Create a new transaction (top up credits)"""
    transaction = db.create_transaction(user_id, transaction_data)
    return {
        "transaction": transaction,
        "new_balance": db.get_user_credits(user_id)
    }

@app.get("/api/users/{user_id}/transactions")
async def get_transactions(user_id: str):
    """Get user's transaction history"""
    return db.get_transactions(user_id)

# Content endpoints
@app.get("/api/content/genres")
async def get_genres():
    """Get available music genres"""
    return [
        {"id": g.value, "name": g.value.replace("_", " ").title()} 
        for g in MusicGenre
    ]

@app.get("/api/content/occasions")
async def get_occasions():
    """Get available occasions"""
    return [
        {"id": o.value, "name": o.value.replace("_", " ").title()} 
        for o in Occasion
    ]

@app.get("/api/content/languages")
async def get_languages():
    """Get available languages"""
    return [
        {"id": l.value, "name": l.value.upper()} 
        for l in Language
    ]

# Statistics endpoint
@app.get("/api/stats")
async def get_stats():
    """Get platform statistics"""
    return {
        "total_users": len(db.users),
        "total_songs": len(db.songs),
        "completed_songs": len([s for s in db.songs.values() if s["status"] == "completed"]),
        "total_transactions": len(db.transactions)
    }


# -------- Admin (Demo + Upsell stats and management) --------
def _require_admin(x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret")):
    secret = os.getenv("ADMIN_SECRET", "")
    if secret and x_admin_secret != secret:
        raise HTTPException(status_code=403, detail="Admin access required")
    return True


@app.get("/api/admin/stats")
async def admin_stats(x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret")):
    """Admin: revenue, net profit, conversion %."""
    _require_admin(x_admin_secret)
    return db.get_admin_stats()


@app.get("/api/admin/songs")
async def admin_list_songs(x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret")):
    """Admin: list all songs (for manual review / confirm payment)."""
    _require_admin(x_admin_secret)
    songs = db.get_all_songs_for_admin()
    for i, song in enumerate(songs):
        songs[i] = _merge_suno_job_into_song(song)
    return {"songs": songs}


@app.post("/api/admin/songs/{song_id}/confirm-payment")
async def admin_confirm_payment(
    song_id: str,
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
):
    """Admin: manually set song as paid (revenue += 1000 som)."""
    _require_admin(x_admin_secret)
    if not db.set_song_paid(song_id):
        raise HTTPException(status_code=404, detail="Song not found")
    return {"ok": True, "song_id": song_id, "revenue_added_som": FULL_VERSION_PRICE_SOM}

# ==================== STARTUP ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
