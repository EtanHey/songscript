#!/usr/bin/env python3
"""
Fetch reference lyrics from multiple sources.

Priority: YouTube captions > Genius > fallback to None.
Returns a list of lyric lines (strings) that can be used as reference
for the LLM line splitter.
"""

import os
import re
from typing import Optional, List, Dict, Any


def fetch_reference_lyrics(
    title: str,
    artist: str = "",
    youtube_id: str = "",
    language: str = "fa",
) -> Optional[List[str]]:
    """
    Try to fetch reference lyrics from available sources.

    Args:
        title: Song title
        artist: Artist name
        youtube_id: YouTube video ID (for captions)
        language: Language code

    Returns:
        List of lyric line strings, or None if not found
    """
    # Try YouTube captions first (free, often has timing too)
    if youtube_id:
        lines = _fetch_youtube_captions(youtube_id, language)
        if lines:
            print(f"  Reference lyrics: YouTube captions ({len(lines)} lines)")
            return lines

    # Try Genius
    lines = _fetch_genius(title, artist)
    if lines:
        print(f"  Reference lyrics: Genius ({len(lines)} lines)")
        return lines

    print("  No reference lyrics found")
    return None


def _fetch_youtube_captions(video_id: str, language: str) -> Optional[List[str]]:
    """Fetch captions from YouTube video."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        return None

    try:
        ytt_api = YouTubeTranscriptApi()

        # Try manual captions in target language first, then auto-generated
        lang_codes = [language]
        # Add common variants
        lang_map = {"fa": ["fa", "fa-IR"], "ko": ["ko", "ko-KR"], "ar": ["ar", "ar-SA"],
                     "he": ["he", "iw"], "ja": ["ja"], "zh": ["zh", "zh-CN", "zh-TW"],
                     "es": ["es", "es-ES", "es-MX", "es-419"]}
        if language in lang_map:
            lang_codes = lang_map[language]

        transcript = ytt_api.fetch(video_id, languages=lang_codes)

        lines = []
        for entry in transcript:
            text = entry.text.strip()
            # Filter out music/applause markers in any language
            skip_patterns = ["[Music]", "[Applause]", "[موسیقی]", "[تشویق]",
                             "[음악]", "[박수]", "[מוזיקה]", "[موسيقى]"]
            if text and not any(p in text for p in skip_patterns):
                # Split on newlines within entries
                for line in text.split("\n"):
                    line = line.strip()
                    # Skip single-char lines (caption artifacts)
                    if line and len(line) > 1:
                        lines.append(line)

        if len(lines) >= 3:  # Need at least a few lines to be useful
            return lines
        return None

    except Exception:
        return None


def _fetch_genius(title: str, artist: str = "") -> Optional[List[str]]:
    """Fetch lyrics from Genius."""
    try:
        import lyricsgenius
    except ImportError:
        return None

    token = os.environ.get("GENIUS_API_TOKEN")
    if not token:
        # Try 1Password
        try:
            import subprocess
            result = subprocess.run(
                ["op", "item", "get", "Genius", "--fields", "label=Client access token", "--reveal"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0 and result.stdout.strip():
                token = result.stdout.strip()
        except Exception:
            pass
    if not token:
        return None

    try:
        genius = lyricsgenius.Genius(token, verbose=False, timeout=10)
        genius.remove_section_headers = True

        song = genius.search_song(title, artist if artist else None)
        if not song or not song.lyrics:
            return None

        # Clean up Genius lyrics
        raw = song.lyrics
        lines = []
        for line in raw.split("\n"):
            line = line.strip()
            # Skip section headers like [Verse 1], [Chorus], etc.
            if re.match(r'^\[.*\]$', line):
                continue
            # Skip empty lines and Genius artifacts
            if not line or line.endswith("Lyrics") or "Embed" in line:
                continue
            # Skip "You might also like" and similar
            if "You might also like" in line:
                continue
            # Skip title/header lines (e.g., "متن آهنگ «...» از ...")
            if "متن آهنگ" in line or "Lyrics" in line:
                continue
            lines.append(line)

        if len(lines) >= 3:
            return lines
        return None

    except Exception:
        return None


def fetch_timed_captions(video_id: str, language: str) -> Optional[List[Dict[str, Any]]]:
    """
    Fetch timed captions from YouTube (with start/duration).

    Returns list of {"text": str, "start": float, "duration": float}
    or None if not available.
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        return None

    try:
        ytt_api = YouTubeTranscriptApi()
        lang_codes = [language]
        lang_map = {"fa": ["fa", "fa-IR"], "ko": ["ko", "ko-KR"], "ar": ["ar", "ar-SA"],
                     "he": ["he", "iw"]}
        if language in lang_map:
            lang_codes = lang_map[language]

        transcript = ytt_api.fetch(video_id, languages=lang_codes)

        entries = []
        for entry in transcript:
            text = entry.text.strip()
            if text and text != "[Music]" and text != "[Applause]":
                entries.append({
                    "text": text,
                    "start": entry.start,
                    "duration": entry.duration,
                })

        return entries if len(entries) >= 3 else None

    except Exception:
        return None
