# SongScript

[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/EtanHey/songscript?utm_source=oss&utm_medium=github&utm_campaign=EtanHey%2Fsongscript&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)

Learn to sing songs in any language through interactive lyric practice.

## The Story Behind SongScript

<!--
NOTE TO MAINTAINER: This section is for the personal story.
You mentioned learning Persian (your mother's first language),
being inspired by the Iranian uprisings (Woman, Life, Freedom movement),
and wanting to connect with your heritage through music.
Please fill in your personal story here.
-->

[Your personal story here - why you built this, the connection to Persian/heritage, etc.]

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

- **Framework**: [TanStack Start](https://tanstack.com/start) + [Bun](https://bun.sh)
- **Database**: [Convex](https://convex.dev) (real-time sync)
- **Auth**: [Better Auth](https://www.better-auth.com/) with Convex adapter
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **State**: [@convex-dev/react-query](https://docs.convex.dev/client/react-query) + TanStack Query

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0 or higher)
- [Convex account](https://convex.dev) (free tier available)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/songscript.git
   cd songscript
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and fill in your values:
   - `VITE_CONVEX_URL` - Your Convex deployment URL
   - `ADMIN_EMAIL` / `VITE_ADMIN_EMAIL` - Admin email for passwordless login

4. Initialize Convex:
   ```bash
   bunx convex dev
   ```

5. In a new terminal, start the development server:
   ```bash
   bun run dev
   ```

6. Open [http://localhost:3001](http://localhost:3001) in your browser

### Optional: Generate Word Audio

To generate pronunciation audio for words using ElevenLabs:

1. Get an API key from [ElevenLabs](https://elevenlabs.io)
2. Add `ELEVENLABS_API_KEY` to your `.env.local`
3. Run:
   ```bash
   bun run scripts/generate-word-audio.ts
   ```

## Project Structure

```
songscript/
├── app/
│   ├── components/     # React components
│   └── routes/         # TanStack file-based routes
├── convex/
│   ├── schema.ts       # Database schema
│   ├── songs.ts        # Song queries/mutations
│   └── auth.ts         # Auth configuration
├── public/
│   ├── audio/          # Audio snippets
│   ├── video/          # Local video files
│   └── flags/          # Language flag assets
└── scripts/            # Build/generation scripts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)

---

Built with love and a desire to connect with heritage through music.
