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

## 🔥 CONVEX .JS FILE ERROR (CRITICAL - MEMORIZE THIS)

**Error message:**
```
✘ [ERROR] Two output files share the same path but have different contents: out/filename.js
```

### What Causes It
Convex bundler finds BOTH `.ts` and `.js` files with the same name in `convex/` folder.
This happens when:
1. Git worktrees are created (copies compiled .js files)
2. Convex crashes mid-compilation
3. Manual file operations gone wrong

### BEFORE Starting Convex Dev Server - ALWAYS RUN:
```bash
rm -f convex/*.js
npx convex dev
```

### Fix When Error Occurs:
```bash
# Stop convex dev (Ctrl+C)
rm -f convex/*.js
npx convex dev
```

### Prevention Rules:
1. **NEVER create .js files in convex/** - Only .ts files belong there
2. **After creating git worktree** - Run `rm -f convex/*.js` before `npx convex dev`
3. **Add to .gitignore** - Ensure `convex/*.js` is ignored (it should be)
4. **Check before starting** - Quick `ls convex/*.js 2>/dev/null` to verify clean state

### For Ralph/Automated Workflows:
Add this to the START of any iteration that uses Convex:
```bash
# Clean Convex before starting
rm -f convex/*.js 2>/dev/null || true
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

## 🧪 TESTING REQUIREMENTS

**All new helpers/utilities MUST have tests.**

### Test Location Convention
- Component tests: `src/components/ComponentName.test.tsx`
- Hook tests: `src/hooks/hookName.test.ts`
- Utility tests: `src/lib/utilName.test.ts` or `src/utils/utilName.test.ts`
- Integration tests: `src/__tests__/featureName.test.ts`

### Pre-commit Hooks
Tests run automatically on every commit via Husky:
```bash
bun run test        # Unit tests (Vitest)
bun run typecheck   # TypeScript check
```

If tests fail, the commit is blocked. Fix tests before committing.

### Running Tests Manually
```bash
bun run test        # Run all tests once
bun run test:watch  # Watch mode for development
bun run test:e2e    # Playwright E2E tests
```

### When Creating New Code
1. **New helper/utility** → Create `*.test.ts` file with unit tests
2. **New component with logic** → Create `*.test.tsx` file
3. **Bug fix** → Add regression test if possible
4. **Refactoring** → Ensure existing tests still pass

---

## 🎵 WHISPERX PIPELINE (Add New Songs in 30 min)

**Full documentation:** `docs.local/learnings/whisperx-pipeline.md`

### Quick Reference (Unified CLI)
```bash
# Install CLI (first time only)
cd scripts/whisperx && ./install-cli.sh

# Full pipeline: YouTube to database
songscript-whisperx add "YOUTUBE_URL" fa --song-id ID --pattern "برای"

# OR step-by-step:
# 1. Extract timestamps
songscript-whisperx extract downloads/SONGNAME.m4a fa

# 2. Match to lyrics (if needed)
songscript-whisperx match output/SONGNAME_whisperx_words.json --pattern "برای"

# 3. Apply to database
songscript-whisperx apply output/SONGNAME_final_timestamps.json ID
```

### Manual Method (Legacy)
```bash
# 1. Download audio
cd scripts/whisperx
yt-dlp -f "bestaudio[ext=m4a]" -o "downloads/SONGNAME.m4a" "YOUTUBE_URL"

# 2. Activate venv & run WhisperX
source venv/bin/activate
whisperx downloads/SONGNAME.m4a \
  --model large-v3 \
  --language fa \
  --align_model jonatasgrosman/wav2vec2-large-xlsr-53-persian \
  --output_dir output/ \
  --output_format json

# 3. Match words to lines (custom script per song structure)
python3 final_timestamps.py

# 4. Apply to database
npx convex run lyrics:updateTimestamps '{"songId": "ID", "unlockCode": "UNLOCK_TIMESTAMPS", "updates": [...]}'
```

### Language Models
| Language | Code | Alignment Model |
|----------|------|-----------------|
| Persian | fa | `jonatasgrosman/wav2vec2-large-xlsr-53-persian` |
| Korean | ko | `jonatasgrosman/wav2vec2-large-xlsr-53-korean` |
| Arabic | ar | `jonatasgrosman/wav2vec2-large-xlsr-53-arabic` |
| Hebrew | he | `imvladikon/wav2vec2-xls-r-300m-hebrew` |

### Key Insight
For songs with repeating patterns (e.g., "برای" in Baraye):
1. Count pattern word occurrences in WhisperX output
2. Map each occurrence to line numbers
3. Handle lines with DOUBLE patterns specially
4. Interpolate for WhisperX gaps

---

## 🛠️ SKILLS (from ralphtools)

Skills are sourced globally from `~/.claude/commands/` (symlinked to ralphtools).

### Convex Workflows

Use `/convex` for Convex-specific tasks:

| Workflow | Use Case |
|----------|----------|
| `/convex dev` | Start dev server |
| `/convex deploy` | Deploy to production |
| `/convex user-deletion` | Delete user and all related data |
| `/convex run-function` | Run queries/mutations |
| `/convex troubleshooting` | Debug common issues |

### Other Available Skills

| Skill | Description |
|-------|-------------|
| `/1password` | Secret management |
| `/github` | Commits, PRs, issues |
| `/worktrees` | Git worktree isolation |

### Updating Skills

Skills auto-update when ralphtools is pulled:
```bash
cd ~/.config/ralph && git pull
```

---

## CLAUDE_COUNTER SYSTEM

Every response MUST end with: `CLAUDE_COUNTER: N`

- Start at 10, decrement by 1 each response
- When 0: re-read CLAUDE.md, reset to 10
