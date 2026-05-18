"""
Build Suno prompts from PDF structure: [SONG PART] by style, [TECHNICAL] for stress, Voice by language.
All text UTF-8 (Kyrgyz/Russian).
"""
from __future__ import annotations

import re
from typing import Tuple

# [SONG PART] instructions by frontend style (cite from PDF)
STYLE_SONG_PART = {
    # Весёлый / веселая / веселый
    "cheerful": "[SONG PART] Genre: Modern Upbeat Pop, Tempo: 120-128 BPM[cite: 14, 16]",
    "весёлый": "[SONG PART] Genre: Modern Upbeat Pop, Tempo: 120-128 BPM[cite: 14, 16]",
    "веселый": "[SONG PART] Genre: Modern Upbeat Pop, Tempo: 120-128 BPM[cite: 14, 16]",
    "веселая": "[SONG PART] Genre: Modern Upbeat Pop, Tempo: 120-128 BPM[cite: 14, 16]",
    "весёлая": "[SONG PART] Genre: Modern Upbeat Pop, Tempo: 120-128 BPM[cite: 14, 16]",
    # Лиричный / лиричная
    "lyrical": "[SONG PART] Genre: Deep Lyrical Ballad, Tempo: 68-76 BPM[cite: 75, 76]",
    "лиричный": "[SONG PART] Genre: Deep Lyrical Ballad, Tempo: 68-76 BPM[cite: 75, 76]",
    "лиричная": "[SONG PART] Genre: Deep Lyrical Ballad, Tempo: 68-76 BPM[cite: 75, 76]",
    # Романтичный / романтичная
    "romantic": "[SONG PART] Genre: Soft Romantic Pop / Indie-Pop, Tempo: 75-80 BPM[cite: 140, 142]",
    "романтичный": "[SONG PART] Genre: Soft Romantic Pop / Indie-Pop, Tempo: 75-80 BPM[cite: 140, 142]",
    "романтичная": "[SONG PART] Genre: Soft Romantic Pop / Indie-Pop, Tempo: 75-80 BPM[cite: 140, 142]",
}

# Default when style doesn't match (neutral pop)
DEFAULT_SONG_PART = "[SONG PART] Genre: Modern Upbeat Pop, Tempo: 120-128 BPM[cite: 14, 16]"

# [TECHNICAL] for stress patterns (cite from PDF)
TECHNICAL_SUFFIX = (
    "Capital Letters: CAPITALS = STRESS. Melody Rule: Melody must follow the stress patterns[cite: 27, 88]"
)


def _normalize_style(raw: str) -> str:
    """Lowercase, strip, collapse spaces for matching."""
    if not raw or not isinstance(raw, str):
        return ""
    s = re.sub(r"\s+", " ", raw.strip().lower())
    return s


def _match_style(style_input: str) -> str:
    """Return [SONG PART] line for the given style text."""
    normalized = _normalize_style(style_input)
    if not normalized:
        return DEFAULT_SONG_PART
    # Exact key match
    if normalized in STYLE_SONG_PART:
        return STYLE_SONG_PART[normalized]
    # Single word match (e.g. user wrote only "веселая")
    for key, value in STYLE_SONG_PART.items():
        if key in normalized or normalized in key:
            return value
    return DEFAULT_SONG_PART


# [SPOKEN WORD] for demo version (PDF: mention demo in spoken part)
DEMO_SPOKEN_WORD = (
    "[SPOKEN WORD] This is a demo version of your personalized song. "
    "Get the full version without limits and in high quality at MelodyGift."
)


def build_suno_prompt(
    lyrics: str,
    style_input: str,
    language: str,
    is_demo: bool = True,
) -> Tuple[str, str]:
    """
    Build prompt and style strings for Suno API from PDF structure.
    - lyrics: user lyrics (UTF-8).
    - style_input: selected style e.g. "Весёлый", "веселая", "Лиричный", "Романтичный".
    - language: "kg" for Kyrgyz, else Russian.
    - is_demo: if True, append [SPOKEN WORD] with demo mention (full song, but with demo tag).
    Returns (full_prompt, style_for_api).
    """
    lyrics = (lyrics or "").strip()
    song_part = _match_style(style_input or "")
    voice = "Kyrgyz" if (language or "").strip().lower() == "kg" else "Russian"
    style_for_api = f"{song_part}; Voice: {voice}"
    technical_block = f"[TECHNICAL]\n{TECHNICAL_SUFFIX}"
    full_prompt = f"{lyrics}\n\n{technical_block}" if lyrics else technical_block
    if is_demo:
        full_prompt = f"{full_prompt}\n\n{DEMO_SPOKEN_WORD}"
    return full_prompt, style_for_api
