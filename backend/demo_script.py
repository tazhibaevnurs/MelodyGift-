"""
Demo version scripts: spoken word with {sender} and {recipient} substitution.
Сценарий «Мужчина — Жене» / «Женщина — мужу» (all styles).
"""
from __future__ import annotations

# Сценарий «Мужчина — Жене» (all styles)
DEMO_MALE_TO_RECIPIENT = """[Spoken Word]
[male Narrator]
[Clear and Confident Speech]
[Radio Announcer Style]

Это бесплатная демо-версия от компании "MelodyGift KG".
{recipient}, эту песню для вас написал ваш любимый {sender}.
Вы для него источник вдохновения и смысл жизни."""

# Сценарий «Женщина — мужу» (all styles)
DEMO_FEMALE_TO_RECIPIENT = """[Spoken Word]
[Female Narrator]
[Clear and Confident Speech]
[Radio Announcer Style]

Это бесплатная демо-версия от компании "MelodyGift KG"!
{recipient}, эту песню для вас написала ваша любимая {sender}.
Вы для неё герой и опора в жизни."""


def build_demo_lyrics(
    sender_name: str,
    recipient_name: str,
    is_male_sender: bool,
) -> str:
    """
    Build demo lyrics with placeholders replaced.
    - sender_name: name of the person creating the song (О тебе).
    - recipient_name: name of the recipient (О получателе).
    - is_male_sender: True = male narrator script, False = female narrator script.
    """
    sender = (sender_name or "").strip() or "друг"
    recipient = (recipient_name or "").strip() or "близкий"
    template = DEMO_MALE_TO_RECIPIENT if is_male_sender else DEMO_FEMALE_TO_RECIPIENT
    return template.replace("{sender}", sender).replace("{recipient}", recipient)
