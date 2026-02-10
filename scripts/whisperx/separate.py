#!/usr/bin/env python3
"""
Vocal separation using Demucs.
Isolates vocals from music for better transcription accuracy.
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import Optional
import shutil


def separate_vocals(
    audio_path: str,
    output_dir: str = "separated",
    model: str = "htdemucs",
    device: str = "auto"
) -> str:
    """
    Separate vocals from audio using Demucs.

    Args:
        audio_path: Path to input audio file
        output_dir: Directory for separated tracks
        model: Demucs model (htdemucs, htdemucs_ft, mdx_extra)
        device: cuda, cpu, or auto

    Returns:
        Path to isolated vocals file
    """
    audio_path = Path(audio_path)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Check if vocals already separated (cache)
    final_path = output_path / f"{audio_path.stem}_vocals.wav"
    if final_path.exists() and final_path.stat().st_size > 0:
        print(f"Vocals already separated: {final_path}")
        return str(final_path)

    # Determine device
    if device == "auto":
        try:
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            device = "cpu"

    print(f"Separating vocals using {model} on {device}...")

    # Run Demucs
    cmd = [
        sys.executable, "-m", "demucs",
        "--two-stems", "vocals",  # Only separate vocals vs other
        "-n", model,
        "-d", device,
        "-o", str(output_path),
        str(audio_path)
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Demucs separation failed: {e.stderr}")

    # Find the vocals file
    stem_name = audio_path.stem
    vocals_path = output_path / model / stem_name / "vocals.wav"

    if not vocals_path.exists():
        # Try alternative path structure
        for candidate in output_path.rglob("vocals.wav"):
            vocals_path = candidate
            break

    if not vocals_path.exists():
        raise RuntimeError(f"Vocals file not found in {output_path}")

    # Copy to simpler location
    final_path = output_path / f"{stem_name}_vocals.wav"
    shutil.copy(vocals_path, final_path)

    print(f"Vocals isolated: {final_path}")
    return str(final_path)


def is_acapella(audio_path: str, threshold: float = 0.8) -> bool:
    """
    Check if audio is already acapella (mostly vocals).
    Uses simple energy ratio heuristic.

    Returns True if audio appears to be mostly vocals.
    """
    try:
        import librosa
        import numpy as np

        # Load audio
        y, sr = librosa.load(audio_path, sr=22050, duration=30)

        # Compute spectral centroid (vocals tend to have higher centroid)
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)

        # Compute harmonic-percussive separation
        y_harmonic, y_percussive = librosa.effects.hpss(y)

        # Ratio of harmonic to total energy
        harmonic_ratio = np.sum(y_harmonic ** 2) / (np.sum(y ** 2) + 1e-10)

        # If mostly harmonic and high centroid, likely acapella
        return harmonic_ratio > threshold

    except ImportError:
        print("librosa not installed, assuming not acapella")
        return False
    except Exception as e:
        print(f"Acapella check failed: {e}")
        return False


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python separate.py <audio_file> [output_dir]")
        sys.exit(1)

    audio_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "separated"

    # Check if separation is needed
    if is_acapella(audio_path):
        print("Audio appears to be mostly vocals, skipping separation")
    else:
        vocals_path = separate_vocals(audio_path, output_dir)
        print(f"Vocals saved to: {vocals_path}")
