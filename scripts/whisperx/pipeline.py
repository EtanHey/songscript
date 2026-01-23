#!/usr/bin/env python3
"""
Full lyrics transcription pipeline.
Downloads, separates vocals, transcribes, segments, translates, and transliterates.
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


# Language-specific processors
LANGUAGE_CONFIG = {
    "fa": {
        "name": "Persian",
        "segmenter": "hazm",
        "transliterator": "persian_g2p",
        "difficulty_multiplier": 1.5
    },
    "ko": {
        "name": "Korean",
        "segmenter": "kiwipiepy",
        "transliterator": "korean_romanizer",
        "difficulty_multiplier": 2.0
    },
    "ar": {
        "name": "Arabic",
        "segmenter": "pyarabic",
        "transliterator": "camel",
        "difficulty_multiplier": 2.0
    },
    "en": {
        "name": "English",
        "segmenter": None,
        "transliterator": None,
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


def transliterate(text: str, language: str) -> str:
    """Convert text to Latin script."""
    config = LANGUAGE_CONFIG.get(language, {})
    transliterator = config.get("transliterator")

    if not transliterator:
        return text

    if transliterator == "persian_g2p":
        try:
            # Simple Persian transliteration mapping
            # For production, use PersianG2p or similar
            mapping = {
                'ا': 'a', 'آ': 'â', 'ب': 'b', 'پ': 'p', 'ت': 't',
                'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
                'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh',
                'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't',
                'ظ': 'z', 'ع': "'", 'غ': 'gh', 'ف': 'f', 'ق': 'q',
                'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
                'و': 'v', 'ه': 'h', 'ی': 'y', 'ي': 'y', 'ئ': "'",
                'ة': 'h', 'ء': "'", '\u200c': ' '  # ZWNJ
            }
            return ''.join(mapping.get(c, c) for c in text)
        except Exception as e:
            print(f"Persian transliteration failed: {e}")
            return text

    elif transliterator == "korean_romanizer":
        try:
            from korean_romanizer.romanizer import Romanizer
            r = Romanizer(text)
            return r.romanize()
        except ImportError:
            print("korean_romanizer not installed")
            return text

    elif transliterator == "camel":
        try:
            # Simplified Arabic transliteration
            # For production, use CAMeL Tools
            mapping = {
                'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
                'ح': 'H', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r',
                'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 'S', 'ض': 'D',
                'ط': 'T', 'ظ': 'Z', 'ع': "'", 'غ': 'gh', 'ف': 'f',
                'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
                'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ء': "'"
            }
            return ''.join(mapping.get(c, c) for c in text)
        except Exception as e:
            print(f"Arabic transliteration failed: {e}")
            return text

    return text


def translate_text(text: str, source_lang: str, target_lang: str = "en") -> str:
    """Translate text using NLLB-200 or fallback."""
    try:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        # NLLB language codes
        nllb_codes = {
            "fa": "pes_Arab",  # Persian
            "ko": "kor_Hang",  # Korean
            "ar": "arb_Arab",  # Arabic
            "en": "eng_Latn",  # English
            "he": "heb_Hebr"   # Hebrew
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
    translate: bool = False,
    transliterate_output: bool = True,
    model_size: str = "large-v3",
    device: str = "auto"
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
        model_size: Whisper model size
        device: Processing device

    Returns:
        Pipeline result with all transcription data
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

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
        "title": video_info.get("title"),
        "artist": video_info.get("uploader"),
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

    # Step 4: Transcribe
    print("\n=== Step 4: Transcribing ===")
    transcription = transcribe_audio(
        transcribe_path,
        language=language,
        model_size=model_size,
        device=device
    )
    lines = format_output(transcription)
    result["steps"].append({"step": "transcription", "status": "complete", "lineCount": len(lines)})

    # Step 5: Transliterate
    if transliterate_output:
        print("\n=== Step 5: Transliterating ===")
        for line in lines:
            line["transliteration"] = transliterate(line["original"], language)
            if "words" in line:
                for word in line["words"]:
                    word["transliteration"] = transliterate(word["word"], language)
        result["steps"].append({"step": "transliteration", "status": "complete"})

    # Step 6: Translate
    if translate:
        print("\n=== Step 6: Translating ===")
        for line in lines:
            line["english"] = translate_text(line["original"], language, "en")
        result["steps"].append({"step": "translation", "status": "complete"})

    # Save results
    result["lines"] = lines

    # Save JSON output
    video_id = video_info.get("id", "unknown")
    json_path = output_path / f"{video_id}_lyrics.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n=== Pipeline complete ===")
    print(f"Output saved to: {json_path}")
    print(f"Lines: {len(lines)}")
    print(f"Total words: {sum(len(l.get('words', [])) for l in lines)}")

    return result


def main():
    parser = argparse.ArgumentParser(description="Full lyrics transcription pipeline")
    parser.add_argument("url", help="YouTube URL")
    parser.add_argument("-l", "--language", default="fa", help="Source language (fa, ko, ar)")
    parser.add_argument("-o", "--output", default="output", help="Output directory")
    parser.add_argument("-m", "--model", default="large-v3", help="Whisper model size")
    parser.add_argument("--no-separate", action="store_true", help="Skip vocal separation")
    parser.add_argument("--translate", action="store_true", help="Add English translation")
    parser.add_argument("--no-transliterate", action="store_true", help="Skip transliteration")
    parser.add_argument("--device", default="auto", choices=["auto", "cuda", "cpu"])

    args = parser.parse_args()

    run_pipeline(
        url=args.url,
        language=args.language,
        output_dir=args.output,
        separate=not args.no_separate,
        translate=args.translate,
        transliterate_output=not args.no_transliterate,
        model_size=args.model,
        device=args.device
    )


if __name__ == "__main__":
    main()
