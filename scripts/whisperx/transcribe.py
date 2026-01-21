#!/usr/bin/env python3
"""
WhisperX transcription with word-level timestamps.
Uses faster-whisper backend for speed and wav2vec2.0 for alignment.
"""

import os
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
import argparse


def transcribe_audio(
    audio_path: str,
    language: str = "fa",
    model_size: str = "large-v3",
    device: str = "auto",
    compute_type: str = "float16",
    batch_size: int = 16
) -> Dict[str, Any]:
    """
    Transcribe audio with word-level timestamps using WhisperX.

    Args:
        audio_path: Path to audio file (wav recommended)
        language: Language code (fa, ko, ar, en, etc.)
        model_size: Whisper model size (tiny, base, small, medium, large-v2, large-v3)
        device: cuda, cpu, or auto
        compute_type: float16, int8, or float32
        batch_size: Batch size for transcription

    Returns:
        Dict with segments and word-level timestamps
    """
    import whisperx
    import torch

    # Determine device
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"

    # Adjust compute type for CPU
    if device == "cpu" and compute_type == "float16":
        compute_type = "float32"

    print(f"Loading WhisperX model ({model_size}) on {device}...")

    # Load model
    model = whisperx.load_model(
        model_size,
        device,
        compute_type=compute_type,
        language=language
    )

    # Load audio
    print(f"Transcribing: {audio_path}")
    audio = whisperx.load_audio(audio_path)

    # Transcribe
    result = model.transcribe(audio, batch_size=batch_size, language=language)

    print(f"Found {len(result['segments'])} segments")

    # Align for word-level timestamps
    print("Aligning for word-level timestamps...")
    try:
        model_a, metadata = whisperx.load_align_model(
            language_code=language,
            device=device
        )
        result = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio,
            device,
            return_char_alignments=False
        )
        print("Alignment complete")
    except Exception as e:
        print(f"Warning: Alignment failed for language {language}: {e}")
        print("Returning segments without word-level alignment")

    # Clean up GPU memory
    if device == "cuda":
        import gc
        gc.collect()
        torch.cuda.empty_cache()

    return result


def format_output(result: Dict[str, Any], include_words: bool = True) -> List[Dict]:
    """
    Format WhisperX output into structured lines.

    Returns list of:
    {
        "lineNumber": 1,
        "startTime": 12.5,
        "endTime": 16.2,
        "original": "text here",
        "words": [{"word": "text", "start": 12.5, "end": 13.1}, ...]
    }
    """
    lines = []

    for i, segment in enumerate(result.get("segments", [])):
        line = {
            "lineNumber": i + 1,
            "startTime": round(segment.get("start", 0), 3),
            "endTime": round(segment.get("end", 0), 3),
            "original": segment.get("text", "").strip()
        }

        if include_words and "words" in segment:
            line["words"] = [
                {
                    "word": w.get("word", ""),
                    "start": round(w.get("start", 0), 3),
                    "end": round(w.get("end", 0), 3),
                    "score": round(w.get("score", 0), 3) if "score" in w else None
                }
                for w in segment["words"]
                if w.get("word", "").strip()
            ]

        lines.append(line)

    return lines


def save_results(
    lines: List[Dict],
    output_path: str,
    format: str = "json",
    video_info: Optional[Dict] = None
):
    """Save transcription results to file."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if format == "json":
        output = {
            "title": video_info.get("title", "Unknown") if video_info else "Unknown",
            "artist": video_info.get("uploader", "Unknown") if video_info else "Unknown",
            "duration": video_info.get("duration", 0) if video_info else 0,
            "lines": lines
        }
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

    elif format == "lrc":
        with open(output_path, "w", encoding="utf-8") as f:
            if video_info:
                f.write(f"[ti:{video_info.get('title', 'Unknown')}]\n")
                f.write(f"[ar:{video_info.get('uploader', 'Unknown')}]\n")
            for line in lines:
                # Convert seconds to LRC format [mm:ss.xx]
                start = line["startTime"]
                mins = int(start // 60)
                secs = start % 60
                f.write(f"[{mins:02d}:{secs:05.2f}]{line['original']}\n")

    elif format == "srt":
        with open(output_path, "w", encoding="utf-8") as f:
            for i, line in enumerate(lines, 1):
                start = format_srt_time(line["startTime"])
                end = format_srt_time(line["endTime"])
                f.write(f"{i}\n{start} --> {end}\n{line['original']}\n\n")

    print(f"Saved to: {output_path}")


def format_srt_time(seconds: float) -> str:
    """Format seconds as SRT timestamp (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{hours:02d}:{mins:02d}:{secs:02d},{ms:03d}"


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio with WhisperX")
    parser.add_argument("audio", help="Path to audio file or YouTube URL")
    parser.add_argument("-l", "--language", default="fa", help="Language code (fa, ko, ar, en)")
    parser.add_argument("-m", "--model", default="large-v3", help="Whisper model size")
    parser.add_argument("-o", "--output", help="Output file path")
    parser.add_argument("-f", "--format", default="json", choices=["json", "lrc", "srt"])
    parser.add_argument("--device", default="auto", choices=["auto", "cuda", "cpu"])
    parser.add_argument("--no-words", action="store_true", help="Skip word-level timestamps")

    args = parser.parse_args()

    # Check if input is URL or file
    audio_path = args.audio
    video_info = None

    if audio_path.startswith("http"):
        from download import download_audio
        audio_path, video_info = download_audio(audio_path)

    # Transcribe
    result = transcribe_audio(
        audio_path,
        language=args.language,
        model_size=args.model,
        device=args.device
    )

    # Format output
    lines = format_output(result, include_words=not args.no_words)

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        stem = Path(audio_path).stem
        output_path = f"output/{stem}_transcription.{args.format}"

    # Save
    save_results(lines, output_path, args.format, video_info)

    # Print summary
    print(f"\nTranscription complete:")
    print(f"  Lines: {len(lines)}")
    total_words = sum(len(l.get("words", [])) for l in lines)
    print(f"  Words: {total_words}")
    if lines:
        print(f"  Duration: {lines[-1]['endTime']:.1f}s")


if __name__ == "__main__":
    main()
