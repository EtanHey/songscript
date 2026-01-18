# SongScript

Song transliteration learning app - follow each line of a song and learn to read/pronounce it.

## Project Status: 🌱 Greenfield

This project is just starting. Work WITH the user to figure out:
- Tech stack (Convex vs Supabase, TanStack, framework choice)
- Architecture
- Features

**Don't assume anything. Ask questions. Explore together.**

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

## Project Structure (TBD)

```
songscript/
├── CLAUDE.md          ← This file
├── README.md          ← Project description
├── PRD.md             ← Ralph task list (gitignored)
├── progress.txt       ← Ralph progress (gitignored)
└── ...                ← TBD with user
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

## Tech Stack (TBD - Discuss with user)

Options to explore:
- **Database:** Supabase vs Convex
- **Frontend:** React, Next.js, or other
- **State:** TanStack Query, Zustand, or Convex built-in
- **Styling:** Tailwind, CSS-in-JS, etc.

**Don't pick. Discuss first.**

---

## CLAUDE_COUNTER SYSTEM

Every response MUST end with: `CLAUDE_COUNTER: N`

- Start at 10, decrement by 1 each response
- When 0: re-read CLAUDE.md, reset to 10
