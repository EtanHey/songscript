#!/usr/bin/env python3
"""
LLM-powered transliteration using Claude Haiku.
Replaces basic char-mapping with pronunciation-accurate Latin output.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


LANGUAGE_NAMES = {
    "fa": "Persian (Farsi)",
    "ko": "Korean",
    "ar": "Arabic",
    "he": "Hebrew",
    "es": "Spanish",
    "tr": "Turkish",
    "ja": "Japanese",
    "zh": "Chinese (Mandarin)",
}

SYSTEM_PROMPT = """You are a professional linguist specializing in transliteration.
Your job is to convert song lyrics from their original script into Latin characters
that accurately represent the PRONUNCIATION of each word.

Rules:
- Include ALL vowels (critical for Arabic/Hebrew/Persian which don't write them)
- Use standard romanization conventions for the language
- For Persian: use â for long 'a' (آ), use ' for ain (ع), kh for خ, gh for غ, sh for ش, zh for ژ, ch for چ
- For Korean: use Revised Romanization (the standard system)
- For Arabic: include short vowels (a, i, u), use ' for ain, ' for hamza, th/dh/sh/kh/gh for emphatic consonants
- For Hebrew: include vowels, use kh for כ (fricative), ts for צ, sh for ש
- Preserve word boundaries exactly as in the original
- Return ONLY the transliteration, no explanations

Respond with a JSON array of transliterated strings, one per input line.
Example input: ["שלום עולם", "מה שלומך"]
Example output: ["shalom olam", "ma shlomkha"]"""


COST_LOG = Path(__file__).parent / "output" / "api_costs.jsonl"


def _extract_json_array(text: str) -> list:
    """Extract a JSON array from LLM response text, handling markdown fences and trailing notes."""
    text = text.strip()
    # Strip ```json ... ``` wrapper
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    # Try parsing as-is first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find the JSON array boundaries
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        return json.loads(text[start:end + 1])
    raise json.JSONDecodeError("No JSON array found", text, 0)


def _log_api_call(input_tokens: int, output_tokens: int, cost: float, line_count: int, language: str):
    """Append API call to cost log (JSONL format)."""
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": datetime.now().isoformat(),
        "model": "claude-haiku-4-5-20251001",
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": round(cost, 6),
        "lines": line_count,
        "language": language,
    }
    with open(COST_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")


def transliterate_batch(
    lines: List[str],
    language: str,
    api_key: Optional[str] = None,
) -> List[str]:
    """
    Transliterate a batch of lines using Claude Haiku.

    Args:
        lines: List of text lines in original script
        language: Language code (fa, ko, ar, he, etc.)
        api_key: Anthropic API key (falls back to ANTHROPIC_API_KEY env var)

    Returns:
        List of transliterated strings (same length as input)
    """
    if not HAS_ANTHROPIC:
        print("WARNING: anthropic SDK not installed, falling back to basic transliteration")
        return lines

    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        print("WARNING: No ANTHROPIC_API_KEY set, falling back to basic transliteration")
        return lines

    lang_name = LANGUAGE_NAMES.get(language, language)
    client = anthropic.Anthropic(api_key=key)

    # Batch all lines in one call
    user_message = f"Language: {lang_name}\n\nTransliterate these {len(lines)} lines:\n{json.dumps(lines, ensure_ascii=False)}"

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        # Log usage and cost
        usage = response.usage
        input_tokens = usage.input_tokens
        output_tokens = usage.output_tokens
        # Haiku 4.5 pricing: $0.80/MTok input, $4/MTok output
        cost = (input_tokens * 0.80 + output_tokens * 4.0) / 1_000_000
        print(f"  Haiku API: {input_tokens} in + {output_tokens} out = ${cost:.4f}")
        _log_api_call(input_tokens, output_tokens, cost, len(lines), language)

        result = _extract_json_array(response.content[0].text)

        if len(result) != len(lines):
            print(f"WARNING: Got {len(result)} transliterations for {len(lines)} lines, padding/truncating")
            while len(result) < len(lines):
                result.append(lines[len(result)])
            result = result[:len(lines)]

        return result

    except Exception as e:
        print(f"WARNING: Haiku transliteration failed ({e}), falling back to basic")
        return lines


def translate_batch(
    lines: List[str],
    source_language: str,
    target_language: str = "en",
    api_key: Optional[str] = None,
) -> List[str]:
    """
    Translate a batch of lines using Claude Haiku.

    Args:
        lines: List of text lines in source language
        source_language: Source language code
        target_language: Target language code (default: en)
        api_key: Anthropic API key

    Returns:
        List of translated strings (same length as input)
    """
    if not HAS_ANTHROPIC:
        return [""] * len(lines)

    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        return [""] * len(lines)

    src_name = LANGUAGE_NAMES.get(source_language, source_language)
    tgt_name = LANGUAGE_NAMES.get(target_language, target_language)

    system = f"""You are a professional translator specializing in song lyrics.
Translate each line from {src_name} to {tgt_name}.
- Preserve the poetic feel where possible
- Each translation should correspond to exactly one input line
- Return ONLY a JSON array of translated strings, one per input line
- Do NOT add explanations or notes"""

    client = anthropic.Anthropic(api_key=key)
    user_message = f"Translate these {len(lines)} lines from {src_name} to {tgt_name}:\n{json.dumps(lines, ensure_ascii=False)}"

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )

        usage = response.usage
        cost = (usage.input_tokens * 0.80 + usage.output_tokens * 4.0) / 1_000_000
        print(f"  Haiku translate ({src_name}→{tgt_name}): {usage.input_tokens} in + {usage.output_tokens} out = ${cost:.4f}")
        _log_api_call(usage.input_tokens, usage.output_tokens, cost, len(lines), f"{source_language}→{target_language}")

        result = _extract_json_array(response.content[0].text)
        while len(result) < len(lines):
            result.append("")
        return result[:len(lines)]

    except Exception as e:
        print(f"WARNING: Translation failed ({e})")
        return [""] * len(lines)


def hebrew_transliterate_batch(
    lines: List[str],
    source_language: str,
    api_key: Optional[str] = None,
) -> List[str]:
    """
    Transliterate lines into Hebrew script using Claude Haiku.
    Used for the Hebrew-speaking audience of SongScript.

    Args:
        lines: List of text lines in source language
        source_language: Source language code
        api_key: Anthropic API key

    Returns:
        List of Hebrew-script transliterations (same length as input)
    """
    if not HAS_ANTHROPIC:
        return [""] * len(lines)

    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        return [""] * len(lines)

    src_name = LANGUAGE_NAMES.get(source_language, source_language)

    system = f"""You are a professional linguist specializing in Hebrew phonetic transliteration.
Convert {src_name} song lyrics into Hebrew script that represents the PRONUNCIATION.

Rules:
- Use Hebrew letters to phonetically represent the sounds of the {src_name} words
- Include nikkud (vowel points) for accurate pronunciation guidance
- This is NOT translation — it's phonetic representation in Hebrew script
- For Persian: خ→כ, غ→ע/ר, ش→ש, ژ→ז׳, چ→צ׳
- For Korean: approximate Korean sounds with closest Hebrew equivalents
- For Arabic: map Arabic sounds to their Hebrew cognates
- Preserve word boundaries exactly as in the original
- Return ONLY a JSON array of Hebrew transliterations, one per input line"""

    client = anthropic.Anthropic(api_key=key)
    user_message = f"Transliterate these {len(lines)} {src_name} lines into Hebrew script:\n{json.dumps(lines, ensure_ascii=False)}"

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )

        usage = response.usage
        cost = (usage.input_tokens * 0.80 + usage.output_tokens * 4.0) / 1_000_000
        print(f"  Haiku Hebrew translit: {usage.input_tokens} in + {usage.output_tokens} out = ${cost:.4f}")
        _log_api_call(usage.input_tokens, usage.output_tokens, cost, len(lines), f"{source_language}→he")

        result = _extract_json_array(response.content[0].text)
        while len(result) < len(lines):
            result.append("")
        return result[:len(lines)]

    except Exception as e:
        print(f"WARNING: Hebrew transliteration failed ({e})")
        return [""] * len(lines)


def transliterate_word(word: str, language: str, api_key: Optional[str] = None) -> str:
    """Transliterate a single word. Uses batch internally."""
    result = transliterate_batch([word], language, api_key)
    return result[0]


if __name__ == "__main__":
    import sys

    test_lines = {
        "fa": ["برای رقصیدن توی خیابونا", "برای ترسیدن هنگام بوسیدن"],
        "he": ["שלום עולם", "אני אוהב מוזיקה"],
        "ko": ["사랑해 너를 만나서", "오늘 밤은 아름다워"],
        "ar": ["يا ليل يا عين", "حبيبي يا نور العين"],
    }

    lang = sys.argv[1] if len(sys.argv) > 1 else "fa"
    mode = sys.argv[2] if len(sys.argv) > 2 else "all"
    lines = test_lines.get(lang, test_lines["fa"])

    print(f"Testing {lang}:")
    for orig in lines:
        print(f"  {orig}")

    if mode in ("all", "translit"):
        print(f"\nLatin transliteration:")
        for orig, t in zip(lines, transliterate_batch(lines, lang)):
            print(f"  {orig} → {t}")

    if mode in ("all", "translate"):
        print(f"\nEnglish translation:")
        for orig, t in zip(lines, translate_batch(lines, lang, "en")):
            print(f"  {orig} → {t}")

    if mode in ("all", "hebrew") and lang != "he":
        print(f"\nHebrew transliteration:")
        for orig, t in zip(lines, hebrew_transliterate_batch(lines, lang)):
            print(f"  {orig} → {t}")
