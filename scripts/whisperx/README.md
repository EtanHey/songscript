# WhisperX Lyrics Transcription Pipeline

Automated pipeline for transcribing song lyrics with word-level timestamps.

## Overview

This pipeline extracts lyrics from YouTube videos with precise word timing:
1. **Download** - Fetch audio from YouTube URL
2. **Separate** - Isolate vocals using Demucs (removes instrumentals)
3. **Transcribe** - WhisperX with word-level timestamps
4. **Segment** - Word segmentation for non-space languages (Korean, Persian, Arabic)
5. **Translate** - NLLB-200 or Claude for translations
6. **Transliterate** - Convert to Latin script

## Setup

### Prerequisites
- Python 3.10+
- CUDA GPU with 8GB+ VRAM (for local processing)
- FFmpeg installed

### Installation

```bash
cd scripts/whisperx
python3 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

### Environment Variables

Create `.env` file:
```
RUNPOD_API_KEY=your_runpod_key  # For serverless GPU
MICROSOFT_TRANSLATOR_KEY=your_key  # Optional: for translations
```

## Usage

### Quick Start (Local GPU)

```bash
# Transcribe a YouTube video
python3 transcribe.py "https://www.youtube.com/watch?v=VIDEO_ID" --language fa

# Full pipeline with vocal separation
python3 pipeline.py "https://www.youtube.com/watch?v=VIDEO_ID" \
  --language fa \
  --separate-vocals \
  --translate \
  --transliterate
```

### Output Format

```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "language": "fa",
  "lines": [
    {
      "lineNumber": 1,
      "startTime": 12.5,
      "endTime": 16.2,
      "original": "برای رقصیدن",
      "transliteration": "baraye raqsidan",
      "english": "for dancing",
      "words": [
        {"word": "برای", "start": 12.5, "end": 13.1},
        {"word": "رقصیدن", "start": 13.2, "end": 16.0}
      ]
    }
  ]
}
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              CONVEX ORCHESTRATION               │
│  • Workflow triggers pipeline                   │
│  • Stores results in database                   │
│  • Real-time status updates                     │
└─────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────┐
│         LOCAL OR RUNPOD SERVERLESS              │
│  • yt-dlp/pytubefix for download                │
│  • Demucs for vocal separation                  │
│  • WhisperX for transcription                   │
└─────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────┐
│              POST-PROCESSING                    │
│  • Word segmentation (kiwipiepy/Hazm)           │
│  • Translation (NLLB-200/Microsoft/Claude)      │
│  • Transliteration (PersianG2p, etc.)           │
└─────────────────────────────────────────────────┘
```

## Language Support

| Language | Transcription | Segmentation | Translation | Transliteration |
|----------|---------------|--------------|-------------|-----------------|
| Persian (fa) | WhisperX (30-40% WER) | Hazm | NLLB-200 | PersianG2p |
| Korean (ko) | WhisperX (10-15% WER) | kiwipiepy | NLLB-200 | korean-romanizer |
| Arabic (ar) | WhisperX (~4% WER MSA) | pyarabic + CAMeL | NLLB-200 | CAMeL-Lab |

## Cost Estimates

- **Local (with GPU)**: Free
- **RunPod Serverless**: ~$0.02-0.05 per song
- **Full cloud**: ~$0.05-0.10 per song

## Files

- `requirements.txt` - Python dependencies
- `download.py` - YouTube audio download
- `separate.py` - Demucs vocal separation
- `transcribe.py` - WhisperX transcription
- `segment.py` - Word segmentation utilities
- `translate.py` - Translation utilities
- `pipeline.py` - Full pipeline orchestrator
- `convex_action.py` - Convex integration

## Convex Integration

The pipeline integrates with SongScript via Convex Actions:

```typescript
// In convex/transcription.ts
export const transcribeSong = action({
  args: { youtubeUrl: v.string(), language: v.string() },
  handler: async (ctx, { youtubeUrl, language }) => {
    // Calls Python pipeline via subprocess or RunPod
  }
})
```
