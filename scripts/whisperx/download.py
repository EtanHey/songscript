#!/usr/bin/env python3
"""
YouTube audio download utilities for lyrics transcription.
Uses yt-dlp for reliability, with pytubefix as fallback.
"""

import os
import hashlib
from pathlib import Path
from typing import Optional, Tuple
import subprocess
import json


def get_video_info(url: str) -> dict:
    """Get video metadata without downloading."""
    try:
        result = subprocess.run(
            ["yt-dlp", "--dump-json", "--no-download", url],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to get video info: {e.stderr}")


def download_audio(
    url: str,
    output_dir: str = "downloads",
    format: str = "wav",
    sample_rate: int = 16000
) -> Tuple[str, dict]:
    """
    Download audio from YouTube URL.

    Args:
        url: YouTube video URL
        output_dir: Directory to save audio
        format: Output format (wav, mp3, m4a)
        sample_rate: Audio sample rate for transcription (16000 recommended for Whisper)

    Returns:
        Tuple of (output_path, video_info)
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Get video info first
    info = get_video_info(url)
    video_id = info.get("id", "unknown")
    title = info.get("title", "unknown")

    # Create filename from video ID
    output_file = output_path / f"{video_id}.{format}"

    # Skip if already downloaded
    if output_file.exists():
        print(f"Audio already exists: {output_file}")
        return str(output_file), info

    # Download with yt-dlp
    cmd = [
        "yt-dlp",
        "-x",  # Extract audio
        "--audio-format", format,
        "--audio-quality", "0",  # Best quality
        "--postprocessor-args", f"ffmpeg:-ar {sample_rate}",
        "-o", str(output_file).replace(f".{format}", ".%(ext)s"),
        url
    ]

    print(f"Downloading: {title}")
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Download failed: {e.stderr}")

    # yt-dlp might use different extension, find the actual file
    for ext in [format, "wav", "mp3", "m4a", "webm"]:
        potential_file = output_path / f"{video_id}.{ext}"
        if potential_file.exists():
            if ext != format:
                # Convert to desired format if needed
                convert_audio(str(potential_file), str(output_file), sample_rate)
                potential_file.unlink()  # Remove original
            return str(output_file), info

    raise RuntimeError(f"Downloaded file not found in {output_path}")


def convert_audio(input_path: str, output_path: str, sample_rate: int = 16000):
    """Convert audio file to desired format and sample rate."""
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-ar", str(sample_rate),
        "-ac", "1",  # Mono
        output_path
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def get_audio_hash(audio_path: str) -> str:
    """Get content hash of audio file for caching."""
    hasher = hashlib.sha256()
    with open(audio_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()[:16]


def check_existing_captions(url: str, language: str = "fa") -> Optional[str]:
    """
    Check if YouTube has existing captions for the video.
    Returns caption text if available, None otherwise.
    """
    try:
        # Try youtube-transcript-api approach
        from youtube_transcript_api import YouTubeTranscriptApi

        # Extract video ID
        if "v=" in url:
            video_id = url.split("v=")[1].split("&")[0]
        elif "youtu.be/" in url:
            video_id = url.split("youtu.be/")[1].split("?")[0]
        else:
            return None

        # Try to get transcript (v1.x API)
        ytt_api = YouTubeTranscriptApi()
        lang_codes = [language]
        lang_map = {"fa": ["fa", "fa-IR"], "ko": ["ko", "ko-KR"], "ar": ["ar", "ar-SA"],
                     "he": ["he", "iw"]}
        if language in lang_map:
            lang_codes = lang_map[language]

        try:
            return ytt_api.fetch(video_id, languages=lang_codes)
        except Exception:
            try:
                return ytt_api.fetch(video_id, languages=["en"])
            except Exception:
                return None
    except ImportError:
        print("youtube-transcript-api not installed, skipping caption check")
        return None
    except Exception as e:
        print(f"No existing captions found: {e}")
        return None


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python download.py <youtube_url> [output_dir]")
        sys.exit(1)

    url = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "downloads"

    # Check for existing captions first
    captions = check_existing_captions(url)
    if captions:
        print("Found existing YouTube captions!")
        print(captions[:500] + "..." if len(str(captions)) > 500 else captions)

    # Download audio
    audio_path, info = download_audio(url, output_dir)
    print(f"Downloaded: {audio_path}")
    print(f"Title: {info.get('title')}")
    print(f"Duration: {info.get('duration')}s")
