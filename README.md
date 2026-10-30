# SongScript

[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/EtanHey/songscript?utm_source=oss&utm_medium=github&utm_campaign=EtanHey%2Fsongscript&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)

Learn to sing songs in any language through interactive lyric practice. SongScript combines AI-powered transcription, vocal separation, and transliteration to help you master pronunciation and lyrics in Persian, Korean, Arabic, Hebrew, and more.

## The Story Behind SongScript

SongScript was built to connect with heritage through music. By combining modern AI (WhisperX transcription, vocal separation, and transliteration), the app makes it accessible to learn songs in languages like Persian—helping you understand pronunciation, practice singing, and deepen your connection to the culture and music that inspires you.

## Features

- **Line-by-Line Learning** - Follow along with lyrics displayed one line at a time
- **Transliteration** - See phonetic spelling to help with pronunciation
- **Multiple Playback Modes**:
  - **Fluid** - Video plays continuously with synchronized lyrics
  - **Single** - Play one line at a time, pause between lines
  - **Loop** - Repeat the current line until you've mastered it
- **Adjustable Speed** - Slow down playback to 0.5x, 0.75x, or 1x
- **Word-by-Word Breakdown** - Tap any line to see detailed word meanings
- **Progress Tracking** - Mark words and lines as "learned"
- **Practice Stats** - Track your vocabulary, practice time, and streaks
- **Learning Dashboard** - See your progress across languages and songs
- **Song Wishlist** - Queue up songs you want to learn next

## Tech Stack

### Frontend & Backend
- **Framework**: [TanStack Start](https://tanstack.com/start) + [Bun](https://bun.sh)
- **Database**: [Convex](https://convex.dev) (real-time sync)
- **Auth**: [Better Auth](https://www.better-auth.com/) with Convex adapter
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **State**: [@convex-dev/react-query](https://docs.convex.dev/client/react-query) + TanStack Query

### Audio Processing Pipeline (WhisperX)
- **Transcription**: [WhisperX](https://github.com/m-bain/whisperx) (faster-whisper + alignment)
- **Vocal Separation**: [Demucs](https://github.com/facebookresearch/demucs)
- **Language Support**: Persian (hazm), Korean (kiwipiepy), Arabic (pyarabic)
- **Translation**: [NLLB-200](https://huggingface.co/facebook/nllb-200-distilled-600M)
- **Audio Download**: [yt-dlp](https://github.com/yt-dlp/yt-dlp)

### Word Pronunciation
- **Text-to-Speech**: [ElevenLabs API](https://elevenlabs.io) (optional, for word audio generation)
- **Forvo API**: Alternative for crowdsourced pronunciation audio

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0 or higher)
- [Python 3.9+](https://www.python.org/) (for WhisperX pipeline)
- [Convex account](https://convex.dev) (free tier available)
- [FFmpeg](https://ffmpeg.org/) (for audio processing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/EtanHey/songscript.git
   cd songscript
   ```

2. Install Node.js dependencies:
   ```bash
   bun install
   ```

3. Set up Python environment for WhisperX:
   ```bash
   cd scripts/whisperx
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your values:
   ```env
   # Convex
   VITE_CONVEX_URL=https://your-project.convex.cloud

   # Auth
   ADMIN_EMAIL=your-email@example.com
   VITE_ADMIN_EMAIL=your-email@example.com

   # Optional: Audio generation
   ELEVENLABS_API_KEY=your-elevenlabs-api-key
   ```

5. Start the development server:
   ```bash
   # Terminal 1: Convex backend
   bunx convex dev

   # Terminal 2: Frontend (in a new terminal)
   bun run dev
   ```

6. Open [http://localhost:3001](http://localhost:3001) in your browser

## WhisperX Pipeline: Adding New Songs

The WhisperX pipeline automates transcription and transliteration. It takes a YouTube link and produces accurate lyrics with timestamps and transliteration.

### Quick Start (30 minutes)

```bash
cd scripts/whisperx
source venv/bin/activate

# Run full pipeline: download → separate vocals → transcribe → transliterate
python3 pipeline.py "https://www.youtube.com/watch?v=VIDEO_ID" \
  -l fa \
  --model large-v3 \
  -o output/
```

### Step-by-Step: Manual Pipeline

If you prefer more control, run each step separately:

#### 1. Download Audio
```bash
python3 download.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads/
```
This uses `yt-dlp` to grab the best quality audio (usually M4A) and extracts metadata (title, artist, duration).

#### 2. Separate Vocals (Optional)
Remove background music and focus on vocals for cleaner transcription:

```bash
python3 separate.py downloads/SONGNAME.m4a separated/
```

This uses **Demucs** (Meta's music source separation) to isolate vocals. Recommended for songs with heavy instrumentation.

#### 3. Transcribe with WhisperX
```bash
python3 transcribe.py separated/SONGNAME.wav \
  -l fa \
  --model large-v3 \
  -o output/
```

Options:
- `-l, --language` - Language code: `fa` (Persian), `ko` (Korean), `ar` (Arabic), `en` (English)
- `--model` - Whisper model size: `tiny`, `base`, `small`, `medium`, `large-v3` (larger = slower but more accurate)
- `--align` - Enable WhisperX alignment (recommended for accuracy)

#### 4. Get Transliteration
```bash
python3 pipeline.py "https://www.youtube.com/watch?v=VIDEO_ID" \
  -l fa \
  --translate \
  -o output/
```

### Pipeline Output

The pipeline generates a JSON file with:
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "language": "fa",
  "videoInfo": {
    "title": "Song Title",
    "artist": "Artist Name",
    "duration": 240
  },
  "lines": [
    {
      "original": "بارای",
      "transliteration": "barâye",
      "startTime": 0.5,
      "endTime": 1.2,
      "english": "for",
      "words": [
        {
          "word": "بارای",
          "transliteration": "barâye",
          "startTime": 0.5,
          "endTime": 1.2
        }
      ]
    }
  ]
}
```

### Language Support & Models

| Language | Code | Alignment Model | Difficulty |
|----------|------|-----------------|-----------|
| Persian | `fa` | `jonatasgrosman/wav2vec2-large-xlsr-53-persian` | ⭐⭐⭐ |
| Korean | `ko` | `jonatasgrosman/wav2vec2-large-xlsr-53-korean` | ⭐⭐⭐⭐ |
| Arabic | `ar` | `jonatasgrosman/wav2vec2-large-xlsr-53-arabic` | ⭐⭐⭐⭐ |
| Hebrew | `he` | `imvladikon/wav2vec2-xls-r-300m-hebrew` | ⭐⭐⭐⭐ |
| English | `en` | (built-in) | ⭐ |

### Word Pronunciation Audio

Generate audio pronunciations for individual words using ElevenLabs:

```bash
# Requires ELEVENLABS_API_KEY in .env.local
bun run scripts/generate-word-audio.ts
```

This creates MP3 files for each unique word, enabling users to click and hear native pronunciation.

### Integrating with the App

Once you have the transcription JSON:

1. **Update Song in Database**:
   ```bash
   npx convex run lyrics:updateTimestamps '{
     "songId": "song-id",
     "unlockCode": "UNLOCK_TIMESTAMPS",
     "updates": [...]
   }'
   ```

2. **Upload to Convex Storage**:
   Use the Convex dashboard to store audio files and video references.

3. **Add to Catalog**:
   Update `convex/seed.ts` or the admin panel to make the song visible in the app.

## Project Structure

```
songscript/
├── src/
│   ├── components/          # React components
│   ├── routes/              # TanStack file-based routes
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   └── styles.css           # Global CSS
├── convex/
│   ├── schema.ts            # Database schema
│   ├── songs.ts             # Song queries/mutations
│   └── auth.ts              # Auth configuration
├── public/
│   ├── audio/               # Generated word pronunciation audio
│   ├── video/               # Local video files
│   └── flags/               # Language flag assets
├── scripts/
│   ├── whisperx/
│   │   ├── pipeline.py      # Full transcription pipeline
│   │   ├── download.py      # YouTube audio download
│   │   ├── separate.py      # Vocal separation (Demucs)
│   │   ├── transcribe.py    # WhisperX transcription
│   │   └── requirements.txt # Python dependencies
│   ├── generate-word-audio.ts      # ElevenLabs word audio generation
│   ├── fetch-forvo-audio.ts        # Forvo pronunciation downloader
│   └── extract-snippets.sh         # Audio snippet extraction
└── package.json             # Node.js dependencies
```

## Development

### Running Tests

```bash
# Run all tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run E2E tests with Playwright
bun run test:e2e
```

Tests are automatically run on commit via Husky pre-commit hooks.

### TypeScript

```bash
bun run typecheck      # Type checking
```

### Building for Production

```bash
# Build the app
bun run build

# Preview production build
bun run preview
```

## Troubleshooting

### Convex Bundler Error
If you see: "Two output files share the same path but have different contents: out/*.js"

Solution:
```bash
rm -f convex/*.js
npx convex dev
```

This happens when compiled `.js` files conflict with TypeScript sources. Only `.ts` files should be in `convex/`.

### WhisperX Installation Issues

**On macOS with Apple Silicon:**
```bash
# Install PyTorch for ARM64
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

**CUDA Support (NVIDIA GPU):**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Missing FFmpeg:**
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

## Architecture

### Frontend
- **TanStack Start** handles file-based routing and SSR
- **Convex React Query** provides real-time data sync from the database
- **Tailwind + shadcn/ui** components for consistent UI

### Backend
- **Convex** manages database, authentication, and real-time subscriptions
- **Better Auth** handles passwordless login via magic links
- **Convex Storage** stores audio and video files

### Audio Processing
The WhisperX pipeline is a standalone Python application that:
1. Downloads audio from YouTube
2. Separates vocals using Demucs
3. Transcribes with Whisper (OpenAI)
4. Aligns words to timestamps using WhisperX
5. Transliterates to Latin script
6. Optionally translates to English

Output is a structured JSON that's then imported into the Convex database.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests locally to ensure everything passes
4. Commit your changes with a descriptive message
5. Push to the branch and open a Pull Request

## License

[Apache 2.0](LICENSE)

---

Built with love and a desire to connect with heritage through music. 🎵
