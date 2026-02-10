#!/usr/bin/env python3
"""
Full lyrics transcription pipeline.
Downloads, separates vocals, transcribes, transliterates (via Claude Haiku), and pushes to Convex.
"""

import os
import json
import argparse
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime

from download import download_audio, check_existing_captions, get_audio_hash
from separate import separate_vocals, is_acapella
from transcribe import transcribe_audio, format_output, save_results
from transliterate_llm import transliterate_batch, translate_batch, hebrew_transliterate_batch


# Language-specific processors
LANGUAGE_CONFIG = {
    "fa": {
        "name": "Persian",
        "segmenter": "hazm",
        "difficulty_multiplier": 1.5
    },
    "ko": {
        "name": "Korean",
        "segmenter": "kiwipiepy",
        "difficulty_multiplier": 2.0
    },
    "ar": {
        "name": "Arabic",
        "segmenter": "pyarabic",
        "difficulty_multiplier": 2.0
    },
    "he": {
        "name": "Hebrew",
        "segmenter": None,
        "difficulty_multiplier": 2.0
    },
    "es": {
        "name": "Spanish",
        "segmenter": None,
        "difficulty_multiplier": 1.0
    },
    "en": {
        "name": "English",
        "segmenter": None,
        "difficulty_multiplier": 1.0
    }
}


def segment_words(text: str, language: str) -> List[str]:
    """Segment text into words for non-space languages."""
    config = LANGUAGE_CONFIG.get(language, {})
    segmenter = config.get("segmenter")

    if not segmenter:
        return text.split()

    if segmenter == "hazm":
        try:
            from hazm import word_tokenize
            return word_tokenize(text)
        except ImportError:
            print("hazm not installed, using space splitting")
            return text.split()

    elif segmenter == "kiwipiepy":
        try:
            from kiwipiepy import Kiwi
            kiwi = Kiwi()
            result = kiwi.tokenize(text)
            return [token.form for token in result]
        except ImportError:
            print("kiwipiepy not installed, using space splitting")
            return text.split()

    elif segmenter == "pyarabic":
        try:
            import pyarabic.araby as araby
            return araby.tokenize(text)
        except ImportError:
            print("pyarabic not installed, using space splitting")
            return text.split()

    return text.split()


# Keep basic char-mapping as fallback (used when Haiku API is unavailable)
def transliterate_basic(text: str, language: str) -> str:
    """Basic character-mapping transliteration (fallback only)."""
    PERSIAN_MAP = {
        'ا': 'a', 'آ': 'â', 'ب': 'b', 'پ': 'p', 'ت': 't',
        'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
        'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh',
        'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't',
        'ظ': 'z', 'ع': "'", 'غ': 'gh', 'ف': 'f', 'ق': 'q',
        'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'و': 'v', 'ه': 'h', 'ی': 'y', 'ي': 'y', 'ئ': "'",
        'ة': 'h', 'ء': "'", '\u200c': ' '
    }
    ARABIC_MAP = {
        'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
        'ح': 'H', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r',
        'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 'S', 'ض': 'D',
        'ط': 'T', 'ظ': 'Z', 'ع': "'", 'غ': 'gh', 'ف': 'f',
        'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ء': "'"
    }

    mapping = {}
    if language == "fa":
        mapping = PERSIAN_MAP
    elif language == "ar":
        mapping = ARABIC_MAP
    elif language == "ko":
        try:
            from korean_romanizer.romanizer import Romanizer
            return Romanizer(text).romanize()
        except ImportError:
            return text

    if not mapping:
        return text
    return ''.join(mapping.get(c, c) for c in text)


def translate_text(text: str, source_lang: str, target_lang: str = "en") -> str:
    """Translate text using NLLB-200 or fallback."""
    try:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        nllb_codes = {
            "fa": "pes_Arab",
            "ko": "kor_Hang",
            "ar": "arb_Arab",
            "en": "eng_Latn",
            "he": "heb_Hebr"
        }

        source_code = nllb_codes.get(source_lang, source_lang)
        target_code = nllb_codes.get(target_lang, "eng_Latn")

        model_name = "facebook/nllb-200-distilled-600M"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

        tokenizer.src_lang = source_code
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)

        translated = model.generate(
            **inputs,
            forced_bos_token_id=tokenizer.lang_code_to_id[target_code],
            max_length=512
        )

        return tokenizer.decode(translated[0], skip_special_tokens=True)

    except ImportError:
        print("transformers not installed, skipping translation")
        return ""
    except Exception as e:
        print(f"Translation failed: {e}")
        return ""


def run_pipeline(
    url: str,
    language: str = "fa",
    output_dir: str = "output",
    separate: bool = True,
    translate: bool = True,
    transliterate_output: bool = True,
    push_to_db: bool = True,
    model_size: str = "large-v3",
    device: str = "auto",
    title_override: str = None,
    artist_override: str = None,
) -> Dict[str, Any]:
    """
    Run the full transcription pipeline.

    Args:
        url: YouTube URL
        language: Source language code
        output_dir: Output directory
        separate: Whether to separate vocals first
        translate: Whether to translate to English
        transliterate_output: Whether to add transliteration
        push_to_db: Whether to push results to Convex
        model_size: Whisper model size
        device: Processing device
        title_override: Override detected song title
        artist_override: Override detected artist name

    Returns:
        Pipeline result with all transcription data
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Extract video ID from URL early (used for caching and output)
    video_id = "unknown"
    if "v=" in url:
        video_id = url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in url:
        video_id = url.split("youtu.be/")[1].split("?")[0]

    result = {
        "url": url,
        "language": language,
        "processedAt": datetime.now().isoformat(),
        "steps": []
    }

    # Step 1: Check for existing captions
    print("\n=== Step 1: Checking for existing captions ===")
    captions = check_existing_captions(url, language)
    if captions:
        result["steps"].append({"step": "captions", "status": "found"})
        print("Found existing YouTube captions!")
    else:
        result["steps"].append({"step": "captions", "status": "not_found"})

    # Step 2: Download audio
    print("\n=== Step 2: Downloading audio ===")
    audio_path, video_info = download_audio(url, str(output_path / "downloads"))
    result["videoInfo"] = {
        "title": title_override or video_info.get("title"),
        "artist": artist_override or video_info.get("uploader"),
        "duration": video_info.get("duration")
    }
    result["steps"].append({"step": "download", "status": "complete", "path": audio_path})
    result["audioHash"] = get_audio_hash(audio_path)

    # Step 3: Vocal separation (optional)
    transcribe_path = audio_path
    if separate:
        print("\n=== Step 3: Separating vocals ===")
        if is_acapella(audio_path):
            print("Audio appears to be mostly vocals, skipping separation")
            result["steps"].append({"step": "separation", "status": "skipped"})
        else:
            transcribe_path = separate_vocals(audio_path, str(output_path / "separated"))
            result["steps"].append({"step": "separation", "status": "complete", "path": transcribe_path})

    # Step 4: Transcribe (with caching)
    transcription_cache = output_path / "transcriptions" / f"{video_id}.json"
    transcription_cache.parent.mkdir(parents=True, exist_ok=True)

    if transcription_cache.exists():
        print("\n=== Step 4: Loading cached transcription ===")
        with open(transcription_cache) as f:
            transcription = json.load(f)
        print(f"Loaded {len(transcription.get('segments', []))} cached segments")
    else:
        print("\n=== Step 4: Transcribing ===")
        transcription = transcribe_audio(
            transcribe_path,
            language=language,
            model_size=model_size,
            device=device
        )
        # Cache the result
        with open(transcription_cache, "w", encoding="utf-8") as f:
            json.dump(transcription, f, ensure_ascii=False, indent=2)
        print(f"Cached transcription to {transcription_cache}")

    lines = format_output(transcription)

    # Step 4b: Fetch reference lyrics and split into proper lyric lines
    from fetch_lyrics import fetch_reference_lyrics
    from split_lines_llm import split_lines_llm
    from split_lines import split_lines as split_lines_gap

    original_count = len(lines)
    song_title = result.get("videoInfo", {}).get("title", "")
    song_artist = result.get("videoInfo", {}).get("artist", "")

    print("\n=== Step 4b: Splitting into lyric lines ===")
    reference = fetch_reference_lyrics(
        title=song_title, artist=song_artist,
        youtube_id=video_id, language=language
    )

    if reference:
        lines = split_lines_llm(lines, language=language, reference_lyrics=reference)
        split_method = "LLM + reference"
    else:
        # Try LLM blind, fall back to gap-based
        lines = split_lines_llm(lines, language=language)
        split_method = "LLM blind"

    if len(lines) != original_count:
        print(f"Split {original_count} segments → {len(lines)} lines ({split_method})")
    result["steps"].append({"step": "transcription", "status": "complete", "lineCount": len(lines), "splitMethod": split_method})

    # Step 5: Transliterate (Claude Haiku with basic fallback)
    if transliterate_output and language != "en":
        print("\n=== Step 5: Transliterating (Claude Haiku) ===")
        originals = [line["original"] for line in lines]

        transliterations = transliterate_batch(originals, language)

        # Check if Haiku worked (returns same strings if it didn't)
        haiku_worked = transliterations != originals

        # If Haiku failed, use basic char-mapping for line-level too
        if not haiku_worked:
            transliterations = [transliterate_basic(t, language) for t in originals]

        for i, line in enumerate(lines):
            line["transliteration"] = transliterations[i]
            # Assign word transliterations by splitting line transliteration
            if "words" in line and line["words"]:
                trans_words = transliterations[i].split()
                words = line["words"]
                if len(trans_words) == len(words):
                    for j, word in enumerate(words):
                        word["transliteration"] = trans_words[j]
                else:
                    # Fallback: distribute transliterated words as best we can
                    for j, word in enumerate(words):
                        if j < len(trans_words):
                            word["transliteration"] = trans_words[j]
                        else:
                            word["transliteration"] = transliterate_basic(word["word"], language) if not haiku_worked else word["word"]

        method = "Claude Haiku" if haiku_worked else "basic char-mapping (fallback)"
        result["steps"].append({"step": "transliteration", "status": "complete", "method": method})
        print(f"Transliteration method: {method}")

    # Step 6: Translate + Hebrew transliteration (batch via Haiku)
    if translate and language != "en":
        print("\n=== Step 6: Translating (Claude Haiku) ===")
        originals = [line["original"] for line in lines]

        # English translation
        english_lines = translate_batch(originals, language, "en")
        for i, line in enumerate(lines):
            line["english"] = english_lines[i]

        # Hebrew transliteration (phonetic, not translation)
        if language != "he":
            hebrew_lines = hebrew_transliterate_batch(originals, language)
            for i, line in enumerate(lines):
                line["hebrew"] = hebrew_lines[i]

        # Assign word-level translations/hebrew by splitting from line-level
        for i, line in enumerate(lines):
            if "words" not in line or not line["words"]:
                continue
            words = line["words"]

            # English per-word
            en_words = english_lines[i].split()
            if len(en_words) == len(words):
                for j, w in enumerate(words):
                    w["english"] = en_words[j]
            else:
                # Can't split evenly — store full line translation on first word, empty on rest
                for j, w in enumerate(words):
                    w["english"] = english_lines[i] if j == 0 else ""

            # Hebrew per-word
            if language != "he" and "hebrew" in line:
                he_words = line["hebrew"].split()
                if len(he_words) == len(words):
                    for j, w in enumerate(words):
                        w["hebrew"] = he_words[j]
                else:
                    for j, w in enumerate(words):
                        w["hebrew"] = line.get("hebrew", "") if j == 0 else ""

        result["steps"].append({"step": "translation", "status": "complete"})

    # Save results
    result["lines"] = lines

    # Save JSON output
    json_path = output_path / f"{video_id}_lyrics.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n=== Pipeline complete ===")
    print(f"Output saved to: {json_path}")
    print(f"Lines: {len(lines)}")
    print(f"Total words: {sum(len(l.get('words', [])) for l in lines)}")

    # Step 7: Push to Convex
    if push_to_db:
        print("\n=== Step 7: Pushing to Convex ===")
        try:
            from push_to_convex import push_song
            song_id = push_song(result, title=title_override, artist=artist_override)
            result["songId"] = song_id
            result["steps"].append({"step": "convex_push", "status": "complete", "songId": song_id})
        except Exception as e:
            print(f"WARNING: Convex push failed: {e}")
            print(f"Results saved to {json_path} — you can push manually later with:")
            print(f"  python3 push_to_convex.py {json_path}")
            result["steps"].append({"step": "convex_push", "status": "failed", "error": str(e)})
    else:
        print(f"\nSkipping Convex push (--no-push). Push manually with:")
        print(f"  python3 push_to_convex.py {json_path}")

    return result


def main():
    parser = argparse.ArgumentParser(description="Full lyrics transcription pipeline")
    parser.add_argument("url", help="YouTube URL")
    parser.add_argument("-l", "--language", default="fa", help="Source language (fa, ko, ar, he)")
    parser.add_argument("-o", "--output", default="output", help="Output directory")
    parser.add_argument("-m", "--model", default="large-v3", help="Whisper model size")
    parser.add_argument("--title", help="Override song title")
    parser.add_argument("--artist", help="Override artist name")
    parser.add_argument("--no-separate", action="store_true", help="Skip vocal separation")
    parser.add_argument("--no-translate", action="store_true", help="Skip translation + Hebrew transliteration")
    parser.add_argument("--no-transliterate", action="store_true", help="Skip Latin transliteration")
    parser.add_argument("--no-push", action="store_true", help="Skip pushing to Convex")
    parser.add_argument("--device", default="auto", choices=["auto", "cuda", "cpu", "mps"])

    args = parser.parse_args()

    run_pipeline(
        url=args.url,
        language=args.language,
        output_dir=args.output,
        separate=not args.no_separate,
        translate=not args.no_translate,
        transliterate_output=not args.no_transliterate,
        push_to_db=not args.no_push,
        model_size=args.model,
        device=args.device,
        title_override=args.title,
        artist_override=args.artist,
    )


if __name__ == "__main__":
    main()
