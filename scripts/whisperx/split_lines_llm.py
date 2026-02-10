#!/usr/bin/env python3
"""
LLM-based line splitting for WhisperX output.

Uses Claude Haiku to intelligently group words into proper lyric lines,
understanding language structure and natural phrasing.
"""

import os
import json
from typing import List, Dict, Any, Optional

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


def split_lines_llm(
    lines: List[Dict[str, Any]],
    language: str = "fa",
    reference_lyrics: Optional[List[str]] = None,
    api_key: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Use Claude Haiku to split WhisperX segments into proper lyric lines.

    Args:
        lines: WhisperX formatted lines (from format_output)
        language: Language code
        reference_lyrics: Optional list of correct lyric lines to guide splitting
        api_key: Anthropic API key (falls back to env var)

    Returns:
        New list of lines with proper splits
    """
    if not HAS_ANTHROPIC:
        print("WARNING: anthropic SDK not installed, falling back to gap-based splitting")
        from split_lines import split_lines
        return split_lines(lines)

    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        print("WARNING: No ANTHROPIC_API_KEY, falling back to gap-based splitting")
        from split_lines import split_lines
        return split_lines(lines)

    # Collect all words with timestamps
    all_words = []
    for line in lines:
        for word in line.get("words", []):
            if word.get("word", "").strip():
                all_words.append(word)

    if not all_words:
        return lines

    all_words.sort(key=lambda w: w.get("start", 0))

    # Build the word list for the prompt
    word_list = []
    for i, w in enumerate(all_words):
        word_list.append(f"{i}: {w['word']} [{w.get('start', 0):.2f}-{w.get('end', 0):.2f}]")

    words_text = "\n".join(word_list)

    lang_names = {
        "fa": "Persian/Farsi", "ko": "Korean", "ar": "Arabic",
        "he": "Hebrew", "ja": "Japanese", "zh": "Chinese",
        "tr": "Turkish", "hi": "Hindi", "ur": "Urdu",
    }
    lang_name = lang_names.get(language, language)

    # Build prompt
    if reference_lyrics:
        ref_text = "\n".join(f"  {i+1}. {line}" for i, line in enumerate(reference_lyrics))
        prompt = f"""You are a {lang_name} lyrics expert. I have word-level timestamps from audio transcription of a song.
The transcription may have minor spelling errors but the words are mostly correct.

I also have the CORRECT lyrics for reference. Your job is to match the transcribed words to the correct lyric lines.

CORRECT LYRICS (reference):
{ref_text}

TRANSCRIBED WORDS (with timestamps):
{words_text}

Group the word indices into lines that match the reference lyrics. Each group should correspond to one reference lyric line.
Some transcribed words may be misspelled versions of the reference words — match them by sound/position.

Output ONLY a JSON array of arrays, where each inner array contains the word indices for that line.
Example: [[0,1,2,3], [4,5,6], [7,8,9,10]]

No explanation, just the JSON array."""
    else:
        prompt = f"""You are a {lang_name} lyrics expert. I have word-level timestamps from audio transcription of a song.
Your job is to group these words into proper lyric lines based on natural phrasing in {lang_name}.

TRANSCRIBED WORDS (with timestamps):
{words_text}

Rules:
- Each line should be a natural lyric phrase (typically 3-8 words, 2-5 seconds)
- Use gaps in timestamps as hints for line breaks
- Consider {lang_name} grammar and poetic structure
- Song lyrics typically have consistent line lengths
- Repeated phrases (like a chorus) should be their own lines

Output ONLY a JSON array of arrays, where each inner array contains the word indices for that line.
Example: [[0,1,2,3], [4,5,6], [7,8,9,10]]

No explanation, just the JSON array."""

    client = anthropic.Anthropic(api_key=key)

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()
        # Extract JSON from response (may have markdown backticks)
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        in_tokens = response.usage.input_tokens
        out_tokens = response.usage.output_tokens
        cost = (in_tokens * 0.80 + out_tokens * 4.0) / 1_000_000
        mode = "with reference" if reference_lyrics else "blind"
        print(f"  Haiku line-split ({mode}): {in_tokens} in + {out_tokens} out = ${cost:.4f}")

        groupings = json.loads(text)

        # Build new lines from groupings
        new_lines = []
        for group_idx, indices in enumerate(groupings):
            group_words = []
            for idx in indices:
                if 0 <= idx < len(all_words):
                    group_words.append(all_words[idx])

            if not group_words:
                continue

            text_parts = [w.get("word", "") for w in group_words]
            new_lines.append({
                "lineNumber": group_idx + 1,
                "startTime": round(group_words[0].get("start", 0), 3),
                "endTime": round(group_words[-1].get("end", 0), 3),
                "original": " ".join(text_parts),
                "words": group_words,
            })

        if new_lines:
            return new_lines
        else:
            print("WARNING: LLM returned empty groupings, falling back to gap-based")
            from split_lines import split_lines
            return split_lines(lines)

    except Exception as e:
        print(f"WARNING: LLM line-split failed ({e}), falling back to gap-based")
        from split_lines import split_lines
        return split_lines(lines)
