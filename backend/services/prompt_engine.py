"""
Маппер промптов для Suno API: стиль + пол вокала + кто/кому (relationship).
Собирает финальный промпт с [Spoken Word] для демо и [SONG PART] / [TECHNICAL] по ТЗ.
Ударения: CAPITALS = STRESS — текст не переводится в нижний регистр.
"""
from __future__ import annotations

from enum import Enum
from typing import Dict, Any


class StyleEnum(str, Enum):
    CHEERFUL = "cheerful"
    LYRICAL = "lyrical"
    ROMANTIC = "romantic"


class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"


# [TECHNICAL] по ТЗ: ударения и мелодия
TECHNICAL_STRESS = (
    "Capital Letters: CAPITALS = STRESS. Melody Rule: Melody must follow the stress patterns[cite: 27, 88]"
)

# База промптов: стиль × пол вокала → теги для Suno ([SONG PART] + [TECHNICAL] + Voice)
PROMPT_TEMPLATES: Dict[StyleEnum, Dict[GenderEnum, str]] = {
    StyleEnum.CHEERFUL: {
        GenderEnum.FEMALE: (
            "[SONG PART] Genre: Modern Upbeat Pop, Tempo: 120-128 BPM[cite: 14, 16]\n"
            f"[TECHNICAL] {TECHNICAL_STRESS}\n"
            "Voice: Russian Female"
        ),
        GenderEnum.MALE: (
            "[SONG PART] Genre: Modern Upbeat Pop, Tempo: 120-128 BPM[cite: 14, 16]\n"
            f"[TECHNICAL] {TECHNICAL_STRESS}\n"
            "Voice: Russian Male"
        ),
    },
    StyleEnum.LYRICAL: {
        GenderEnum.FEMALE: (
            "[SONG PART] Genre: Deep Lyrical Ballad, Tempo: 68-76 BPM[cite: 75, 76]\n"
            f"[TECHNICAL] {TECHNICAL_STRESS}\n"
            "Voice: Russian Female"
        ),
        GenderEnum.MALE: (
            "[SONG PART] Genre: Deep Lyrical Ballad, Tempo: 68-76 BPM[cite: 75, 76]\n"
            f"[TECHNICAL] {TECHNICAL_STRESS}\n"
            "Voice: Russian Male"
        ),
    },
    StyleEnum.ROMANTIC: {
        GenderEnum.FEMALE: (
            "[SONG PART] Genre: Soft Romantic Pop / Indie-Pop, Tempo: 75-80 BPM[cite: 140, 142]\n"
            f"[TECHNICAL] {TECHNICAL_STRESS}\n"
            "Voice: Russian Female"
        ),
        GenderEnum.MALE: (
            "[SONG PART] Genre: Soft Romantic Pop / Indie-Pop, Tempo: 75-80 BPM[cite: 140, 142]\n"
            f"[TECHNICAL] {TECHNICAL_STRESS}\n"
            "Voice: Russian Male"
        ),
    },
}

# Шаблоны дикторской начитки (Spoken Word) для демо — русский
SPOKEN_TEMPLATES_RU = {
    "male_to_female": (
        "[Spoken Word]\n[male Narrator]\n"
        "Это бесплатная демо-версия от компании «MelodyGift».\n"
        "{recipient}, эту песню для вас написал ваш любимый {sender}.\n"
        "Вы для него источник вдохновения и смысл жизни."
    ),
    "female_to_male": (
        "[Spoken Word]\n[female Narrator]\n"
        "Это бесплатная демо-версия от компании «MelodyGift»!\n"
        "{recipient}, эту песню для вас написала ваша любимая {sender}.\n"
        "Вы для неё герой и опора в жизни."
    ),
}

# Шаблоны дикторской начитки для демо — кыргызча
SPOKEN_TEMPLATES_KG = {
    "male_to_female": (
        "[Spoken Word]\n[male Narrator]\n"
        "Бул «MelodyGift» компаниясынан бекер демо-версиясы!\n"
        "{recipient}, сизге бул ырды сиздин сүйүктүү адамыныз {sender} жазды.\n"
        "Сиз анын суйгону жана жашоо маанисисиз."
    ),
    "female_to_male": (
        "[Spoken Word]\n[female Narrator]\n"
        "Бул «MelodyGift» компаниясынан бекер демо-версиясы!\n"
        "{recipient}, сизге бул ырды сиздин сүйүктүү адамыныз {sender} жазды.\n"
        "Сиз анын баатыры жана жашоодогу таянычысыз."
    ),
}


def _parse_style(style_input: str) -> StyleEnum:
    """Приводит значение стиля с фронта к StyleEnum."""
    if not style_input:
        return StyleEnum.CHEERFUL
    s = (style_input or "").strip().lower()
    if s in ("lyrical", "лиричный", "лиричная"):
        return StyleEnum.LYRICAL
    if s in ("romantic", "романтичный", "романтичная"):
        return StyleEnum.ROMANTIC
    return StyleEnum.CHEERFUL


def _parse_voice_gender(voice_gender: str) -> GenderEnum:
    """Приводит пол вокала к GenderEnum."""
    if not voice_gender:
        return GenderEnum.FEMALE
    s = (voice_gender or "").strip().lower()
    if s in ("male", "мужской"):
        return GenderEnum.MALE
    return GenderEnum.FEMALE


def _parse_relationship(relationship: str, sender_gender: str) -> str:
    """
    Определяет ключ для SPOKEN_TEMPLATES: male_to_female | female_to_male.
    relationship может быть: male_to_female, female_to_male, husband_to_wife, wife_to_husband.
    Или выводится из sender_gender: male → male_to_female, female → female_to_male.
    """
    if relationship:
        r = (relationship or "").strip().lower()
        if r in ("female_to_male", "wife_to_husband"):
            return "female_to_male"
        if r in ("male_to_female", "husband_to_wife"):
            return "male_to_female"
    # По умолчанию из пола отправителя: муж дарит → male_to_female, жена дарит → female_to_male
    sg = (sender_gender or "").strip().lower()
    return "female_to_male" if sg == "female" else "male_to_female"


def build_final_prompt(
    style: str,
    voice_gender: str,
    sender: str,
    recipient: str,
    relationship: str,
    sender_gender: str,
    user_lyrics: str,
    is_demo: bool = True,
    language: str = "ru",
) -> Dict[str, Any]:
    """
    Собирает финальный промпт для Suno.

    - style: веселый / лиричный / романтичный (или cheerful / lyrical / romantic)
    - voice_gender: мужской / женский (пол вокала)
    - sender: имя отправителя
    - recipient: имя получателя
    - relationship: male_to_female | female_to_male (или выводится из sender_gender)
    - sender_gender: male | female (для вывода relationship, если не задан)
    - user_lyrics: текст песни (ударения — заглавными буквами, не менять регистр)
    - is_demo: если True — в начало подставляется [Spoken Word] про демо; иначе только текст песни
    - language: ru | kg (для будущего расширения голоса/диктора)

    Возвращает: {"tags": str, "prompt": str}
    """
    style_enum = _parse_style(style)
    voice_enum = _parse_voice_gender(voice_gender)
    spoken_key = _parse_relationship(relationship, sender_gender)

    # 1. Музыкальный промпт (теги стиля + вокал)
    base_style_prompt = PROMPT_TEMPLATES[style_enum][voice_enum]
    if (language or "").strip().lower() == "kg":
        base_style_prompt = base_style_prompt.replace("Russian", "Kyrgyz")

    # 2. Текст песни — не менять регистр (CAPITALS = STRESS)
    lyrics_stripped = (user_lyrics or "").strip()

    if is_demo:
        # 3. Дикторская часть для демо (язык: ru или kg)
        is_kg = (language or "").strip().lower() == "kg"
        spoken_templates = SPOKEN_TEMPLATES_KG if is_kg else SPOKEN_TEMPLATES_RU
        default_sender = "жөнөтүүчү" if is_kg else "отправитель"
        default_recipient = "алуучу" if is_kg else "получатель"
        spoken_part = spoken_templates[spoken_key].format(
            sender=sender or default_sender,
            recipient=recipient or default_recipient,
        )
        full_lyrics = f"{spoken_part}\n\n[SONG START]\n{lyrics_stripped}"
    else:
        # Полная версия: только текст песни, без блока про демо
        full_lyrics = lyrics_stripped

    return {
        "tags": base_style_prompt,
        "prompt": full_lyrics,
    }
