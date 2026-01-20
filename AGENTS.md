# SongScript

Song transliteration learning app - follow each line of a song and learn to read/pronounce it.

## Project Status: 🚧 In Development

Tech stack decided. Ralph will execute PRD.md stories.

---

## 🤖 RALPH WORKFLOW

This project uses Ralph for autonomous task execution.

### Commands
```bash
ralph [N]           # Run N iterations on PRD.md
ralph-init          # Create PRD template
ralph-archive       # Archive completed stories
ralph-status        # Show PRD status
```

### After Creating a PRD
**🛑 STOP. Do NOT implement. Do NOT spawn subagents.**

The `/prd` command creates `PRD.md` and `progress.txt`, then YOU (Claude) must STOP and tell the user: "PRD ready. Run Ralph to execute."

---

## 🚨 GIT SAFETY

**NEVER commit or push unless explicitly told.**
**ALWAYS ask which branch before committing.**

```bash
git status  # Check current branch FIRST
# Then ASK: "Should I commit to <branch-name>?"
```

---

## Project Structure

```
songscript/
├── CLAUDE.md          ← This file
├── README.md          ← Project description
├── PRD.md             ← Ralph task list
├── progress.txt       ← Ralph progress
├── app/
│   ├── components/    ← React components
│   │   ├── YouTubePlayer.tsx
│   │   └── LyricsDisplay.tsx
│   ├── routes/        ← TanStack file-based routes
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   └── song.$songId.tsx
│   └── styles/
│       └── globals.css
├── convex/
│   ├── schema.ts      ← Database schema
│   ├── songs.ts       ← Queries/mutations
│   ├── seed.ts        ← Seed data
│   └── auth.ts        ← Auth config
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## Core Concept

**Song transliteration learning:**
- Display song lyrics line by line
- Show transliteration (phonetic spelling in user's alphabet)
- User follows along, learns pronunciation
- Possibly: audio sync, progress tracking, spaced repetition

**Target languages:** TBD (Hebrew songs? K-pop? Arabic? All?)

---

## Tech Stack (DECIDED)

- **Framework:** TanStack Start (with Bun runtime)
- **Database:** Convex (real-time sync)
- **Auth:** Convex + Better Auth (admin-only for v1)
- **Styling:** Tailwind CSS + ShadCN UI
- **State:** @convex-dev/react-query + TanStack Query
- **Testing:** Vitest + Playwright

**References:**
- [TanStack Start + Bun](https://bun.com/docs/guides/ecosystem/tanstack-start)
- [Convex + TanStack Start](https://docs.convex.dev/quickstart/tanstack-start)
- [Convex + Better Auth](https://labs.convex.dev/better-auth/framework-guides/tanstack-start)

---

## CLAUDE_COUNTER SYSTEM

Every response MUST end with: `CLAUDE_COUNTER: N`

- Start at 10, decrement by 1 each response
- When 0: re-read CLAUDE.md, reset to 10
