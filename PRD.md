# PRD: SongScript - Song Transliteration Learning App

**Working Directory:** `.`

---

## 🚨 ITERATION RULES (READ THIS FIRST) 🚨

**CRITICAL: Each user story = ONE iteration. NO EXCEPTIONS.**

**📊 CHECK PROGRESS FIRST:**
- See **PROGRESS SUMMARY** section below for current status
- Only stories with `- [ ]` unchecked criteria need work
- **DO NOT re-do completed stories** - check if archived

**🚨 VERIFICATION STORIES ARE NOT OPTIONAL 🚨**
Do NOT output `<promise>COMPLETE</promise>` until ALL V-* stories are done.

1. **ONE STORY PER ITERATION**: Complete exactly ONE user story, then STOP.
2. **🧠 USE ULTRATHINK**: Think through implementation before coding.
3. **TYPECHECK IS MANDATORY**: Run before marking complete.
4. **VERIFY VISUALLY**: Check in browser using `mcp__claude-in-chrome__*` tools before marking complete.
5. **DO NOT BATCH**: Each story is a SEPARATE iteration.
6. **V-* STORIES ARE MANDATORY**: Must execute ALL verification stories.
7. **NO INLINE COLORS**: Use Tailwind preset tokens, never arbitrary hex.
8. **NO ARBITRARY PIXELS**: Use Tailwind scale or CSS variables.
9. **🚫 NO SKIPPING**: Do NOT skip stories. Use all available tools to complete them:
   - `mcp__Context7__*` for documentation lookup
   - `mcp__claude-in-chrome__*` for browser testing
   - `mcp__browser-tools__*` for debugging
   - If TRULY blocked (missing API keys, user input required), mark as `**⏸️ BLOCKED**: [reason]` and move to next story.
10. **ACTUALLY TEST**: Don't just write code - run it, test it in browser, verify it works end-to-end.

---

## 📊 PROGRESS SUMMARY

| Metric | Count |
|--------|-------|
| ✅ **Stories Complete** | 25 (archived to `docs.local/prd-completed-archive.md`) |
| ⏹️ **BLOCKED** | US-005 (Auth) |
| 🔄 **Stories Remaining** | 7 (US-022 through US-027, V-007) |

**Archive:** Completed stories (US-001-020A, V-001-006) moved to `docs.local/prd-completed-archive.md`

**Current Focus:** Download correct video, extract timestamps, re-implement audio system.

---

## Browser Setup

- Viewport: Desktop (1440px) and Mobile (375px)
- Test URL: `http://localhost:3001`
- **Port:** 3001 (not 3000)

**🚨 DEV SERVER IS ALREADY RUNNING 🚨**
- The dev server is ALREADY running on `http://localhost:3001`
- **DO NOT** run `bun dev` or start a new server
- **DO NOT** kill the dev server
- Just use `mcp__claude-in-chrome__*` tools to test at `http://localhost:3001`
- If you see port conflicts, the server is already running - just use it

---

## Introduction

SongScript is a song transliteration learning app that helps users learn to pronounce songs in foreign languages. Users can:
- Watch a YouTube video of a song
- See lyrics with transliterations and translations
- Click any line to jump to that timestamp
- Loop a single line for practice
- Control playback speed
- Filter by language (Persian, Transliteration, Hebrew, English)

**Tech Stack:**
- **Framework:** TanStack Start (with Bun)
- **Database:** Convex (real-time sync)
- **Auth:** Convex + Better Auth (admin-only for v1)
- **Styling:** Tailwind CSS + ShadCN UI
- **Testing:** Vitest + Playwright

**References:**
- [TanStack Start + Bun Guide](https://bun.com/docs/guides/ecosystem/tanstack-start)
- [Convex + TanStack Start Quickstart](https://docs.convex.dev/quickstart/tanstack-start)
- [Convex + Better Auth](https://labs.convex.dev/better-auth/framework-guides/tanstack-start)

**🔧 MCP Tools Available:**
- **Context7**: Use `mcp__Context7__resolve-library-id` and `mcp__Context7__query-docs` to look up latest documentation for TanStack Start, Convex, Tailwind, ShadCN, etc. Always prefer Context7 over web search for library docs.

---

## 🌍 RTL RULES (CRITICAL FOR PERSIAN/HEBREW)

1. Think in START/END, not LEFT/RIGHT:
   - START = RIGHT in RTL (beginning of reading)
   - END = LEFT in RTL (end of reading)
2. RTL must propagate to ALL inner flex containers
3. Persian/Hebrew text should be `text-right`, flex columns should be `items-end`
4. Prices/numbers: Wrap in `<span dir="ltr">` to prevent reversal
5. Flex items: Add `min-w-0` to prevent overflow
6. Verify visually: Persian/Hebrew text flows right-to-left

---

## User Stories

### US-001: Project Scaffolding with TanStack Start + Bun

**Description:** Initialize the project with TanStack Start and Bun runtime.

**Acceptance Criteria:**
- [x] Run `bun create @tanstack/start songscript-app` or equivalent to scaffold project
- [x] Move scaffolded files to project root (not nested in songscript-app/)
- [x] Configure `vite.config.ts` with `nitro({ preset: "bun" })` and `server: { port: 3001 }`
- [x] Update `package.json` scripts (note: `bun --bun` caused issues, using plain vite commands)
- [x] Verify `bun dev` starts the server on localhost:3001
- [x] Typecheck passes (`bun run typecheck` or equivalent)

**✅ COMPLETE**

---

### US-002: Add Tailwind CSS v4 + ShadCN UI

**Description:** Set up Tailwind CSS v4 (2026 setup - different from v3!) and ShadCN UI.

**⚠️ TAILWIND V4 SETUP (NOT V3!):**
- No `tailwind.config.ts` - config is CSS-based now
- Use `@tailwindcss/vite` plugin, not PostCSS
- Import via `@import "tailwindcss";` in CSS

**Acceptance Criteria:**
- [x] Install: `bun add tailwindcss @tailwindcss/vite`
- [x] Add `tailwindcss()` plugin to `vite.config.ts`
- [x] Create `src/styles.css` with `@import "tailwindcss";` (using existing styles.css)
- [x] Import CSS in `__root.tsx` with `?url` query (see TanStack docs)
- [x] Initialize ShadCN UI: `bunx shadcn@latest init`
- [x] Add Button component: `bunx shadcn@latest add button`
- [x] Verify Tailwind classes work on homepage (e.g., `text-3xl font-bold`)
- [x] Typecheck passes

**Reference:** [Tailwind CSS v4 + TanStack Start](https://tailwindcss.com/docs/installation/framework-guides/tanstack-start)

**✅ COMPLETE**

---

### US-003: Set Up Convex Backend

**Description:** Initialize Convex and connect it to the TanStack Start app.

**Acceptance Criteria:**
- [x] Install convex packages: `bun add convex`
- [x] Run `bunx convex dev` to create Convex project (harmless-husky-580)
- [x] Create `convex/` directory with initial schema
- [x] Set up ConvexProvider in app router (`src/providers/ConvexClientProvider.tsx`)
- [x] Configure environment variables for Convex (`.env.local`)
- [x] Verify Convex dashboard shows project
- [x] Typecheck passes

**✅ COMPLETE**

---

### US-004: Convex Schema for Songs and Lyrics

**Description:** Define the database schema for songs and their lyrics.

**Acceptance Criteria:**
- [x] Create `convex/schema.ts` with songs table:
  ```typescript
  songs: defineTable({
    title: v.string(),
    artist: v.string(),
    youtubeId: v.string(),
    sourceLanguage: v.string(), // e.g., "persian"
    createdAt: v.number(),
  })
  ```
- [x] Add lyrics table with timestamps:
  ```typescript
  lyrics: defineTable({
    songId: v.id("songs"),
    lineNumber: v.number(),
    startTime: v.number(), // seconds
    endTime: v.number(),
    original: v.string(), // Persian text
    transliteration: v.string(),
    hebrew: v.optional(v.string()),
    english: v.string(),
  }).index("by_song", ["songId", "lineNumber"])
  ```
- [x] Run `bunx convex dev` to push schema
- [x] Verify tables appear in Convex dashboard
- [x] Typecheck passes

**✅ COMPLETE**

---

### US-005: Admin-Only Passwordless Authentication

**Description:** Set up Convex + Better Auth with PASSWORDLESS auth (magic link OR passkey). No passwords, no signup page.

**Admin Email:** `etan@heyman.net`

**⚠️ PREVIOUS ATTEMPT FAILED:**
- Password-based auth returned HTTP 500 errors on `/api/auth/get-session` and `/api/auth/sign-in/email`
- Server logs showed `TypeError: fetch failed` with `EAGAIN` errors
- The auth flow was never actually tested in the browser

**🔧 REQUIREMENTS:**
1. **Passwordless only** - Use magic link (email) OR passkey, NOT password
2. **No signup page** - Only login page, admin is pre-seeded or auto-created on first login
3. **Only admin can log in** - Hardcode `etan@heyman.net` check server-side
4. **Must test in browser** - Use `mcp__claude-in-chrome__*` tools to verify the flow works end-to-end

**Acceptance Criteria:**
- [x] Remove password-based auth, implement magic link OR passkey
- [x] Login page at `/login` - email input only, no password field, no signup toggle
- [x] Server-side check: reject any email that isn't `etan@heyman.net`
- [ ] Auth API endpoints return 200 (not 500)
- [x] Use Context7 (`mcp__Context7__query-docs`) to look up Better Auth magic link/passkey setup
- [ ] **BROWSER TEST**: Navigate to `/login`, enter admin email, complete auth flow
- [ ] **BROWSER TEST**: Verify session persists after login (check `/api/auth/get-session` returns user)
- [x] **BROWSER TEST**: Verify non-admin email is rejected with clear error message
- [x] Typecheck passes

**Status:** ⏹️ BLOCKED: Auth API endpoints (`/api/auth/get-session`, `/api/auth/sign-in/magic-link`) return 500 or hang indefinitely. The Convex + Better Auth integration has a fundamental issue with request handling. Frontend magic link UI is complete and non-admin rejection works, but the actual auth flow cannot complete.

**⏹️ STOP - END OF US-005. Do not continue to US-006.**

---

### US-006: Seed Baraye Song Data

**Description:** Create seed script to populate Convex with Baraye song.

**Acceptance Criteria:**
- [x] Create `convex/seed.ts` with Baraye song data (31 lines)
- [x] Song metadata: title="Baraye (برای)", artist="Shervin Hajipour", youtubeId="xLvUEF2zpj8"
- [x] All 31 lyrics lines with timestamps, Persian, transliteration, Hebrew, English
- [x] Create Convex mutation `seedBaraye` that inserts data
- [x] Run seed via Convex CLI: `npx convex run seed:seedBaraye`
- [x] Verify song and lyrics appear in Convex dashboard (songId: j972m34dzqgx6a0r5a00n9k6pd7zekfa)
- [x] Typecheck passes

**✅ COMPLETE**

---

### US-007: YouTube Player Component

**Description:** Create a YouTube player component using the IFrame API.

**Acceptance Criteria:**
- [x] Create `app/components/YouTubePlayer.tsx`
- [x] Load YouTube IFrame API dynamically
- [x] Expose player controls: play, pause, seekTo, getCurrentTime
- [x] Accept `videoId` prop
- [x] Accept `onTimeUpdate` callback for current time tracking
- [x] Use `useRef` to store player instance
- [x] Add loading state while API loads
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-007. Do not continue to US-008.**

---

### US-008: Lyrics Display Component

**Description:** Create component to display lyrics from Convex.

**Acceptance Criteria:**
- [x] Create `app/components/LyricsDisplay.tsx`
- [x] Fetch lyrics from Convex using `useSuspenseQuery`
- [x] Display each line with all language versions stacked
- [x] Persian text: RTL, larger font (text-xl), `dir="rtl"`
- [x] Transliteration: italic, green color (text-emerald-500)
- [x] Hebrew: RTL, blue color (text-blue-500), `dir="rtl"`
- [x] English: smaller, gray (text-gray-400)
- [x] Each line is a clickable button/div
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-008. Do not continue to US-009.**

---

### US-009: Line Click to Seek + Auto-Play

**Description:** Clicking a lyric line seeks YouTube player to that timestamp. Player should auto-play on load and after seeking.

**Acceptance Criteria:**
- [x] Pass `onLineClick(startTime)` callback to LyricsDisplay
- [x] **FIX SEEK**: `player.seekTo(startTime, true)` - use second param `true` for allowSeekAhead
- [x] **AUTO-PLAY ON LOAD**: Player starts playing automatically when page loads (use `autoplay: 1` in playerVars)
- [x] **AUTO-PLAY AFTER SEEK**: After `seekTo()`, call `player.playVideo()` to resume without user click
- [x] Visual feedback on click (brief highlight)
- [x] Typecheck passes
- [x] **BROWSER TEST**: Click line 1 → video seeks to ~14.8s (not 0)
- [x] **BROWSER TEST**: Click line 10 → video seeks to ~46.9s
- [x] **BROWSER TEST**: Click line 28 → video seeks to ~113.4s
- [x] **BROWSER TEST**: Verify auto-plays after seek without manual click

**✅ COMPLETE**

**⏹️ STOP - END OF US-009. Do not continue to US-010.**

---

### US-010: Loop Mode Toggle

**Description:** Add loop toggle that repeats the current line.

**Acceptance Criteria:**
- [x] Add ShadCN Switch component for loop toggle
- [x] Store `isLooping` and `currentLineIndex` in state
- [x] When loop ON and time reaches `endTime`, seek back to `startTime`
- [x] Use `setInterval` (100ms) to check currentTime
- [x] Clear interval on unmount
- [x] Visual indicator when loop is active (icon or badge)
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-010. Do not continue to US-011.**

---

### US-011: Playback Speed Control

**Description:** Add dropdown to control playback speed (0.5x, 0.75x, 1x).

**Acceptance Criteria:**
- [x] Add ShadCN Select component for speed
- [x] Options: 0.5x, 0.75x, 1x (default)
- [x] Call `player.setPlaybackRate(speed)` on change
- [x] Persist speed selection in component state
- [x] Show current speed in dropdown
- [x] Typecheck passes

**⏹️ STOP - END OF US-011. Do not continue to US-012.**

---

### US-012: Language Filter Dropdown

**Description:** Add dropdown to filter which language versions are shown.

**Acceptance Criteria:**
- [x] Add ShadCN Select for language filter
- [x] Options: All, Persian only, Transliteration only, Hebrew only, English only
- [x] Filter affects which text rows are visible per line
- [x] Default: All
- [x] Filter state stored in component
- [x] Typecheck passes

**⏹️ STOP - END OF US-012. Do not continue to US-013.**

---

### US-013: Active Line Highlighting

**Description:** Highlight the currently playing line based on video time.

**Acceptance Criteria:**
- [x] Track `currentTime` from YouTube player (via interval)
- [x] Find which line's `startTime <= currentTime < endTime`
- [x] Apply highlight class to active line (bg-primary/10 or similar)
- [x] Auto-scroll active line into view (smooth scroll)
- [x] Typecheck passes

**⏹️ STOP - END OF US-013. Do not continue to US-014.**

---

### US-014: Dark Theme with Iranian Flag Accent

**Description:** Style the app with dark theme and Iranian flag colors.

**Acceptance Criteria:**
- [x] Set dark mode as default in Tailwind config
- [x] Background: dark (bg-gray-900 or bg-slate-950)
- [x] Title gradient: green → white → red (Iranian flag)
- [x] Add CSS gradient class for title: `bg-gradient-to-r from-green-500 via-white to-red-500`
- [x] Text colors contrast well on dark background
- [x] Typecheck passes
- [x] Verify in browser: app has dark theme with accent colors

**✅ COMPLETE**

**⏹️ STOP - END OF US-014. Do not continue to US-015.**

---

### US-015: Mobile Responsive Design

**Description:** Ensure the app works well on mobile devices.

**🧠 ULTRATHINK REQUIRED:** Before coding, analyze:
- How should YouTube player size on mobile vs desktop?
- Should lyrics be below or beside video on different breakpoints?
- Touch targets for line clicks (44px minimum)

**Acceptance Criteria:**
- [x] YouTube player: 100% width on mobile, fixed width on desktop
- [x] Lyrics below video on mobile, beside on desktop (md: breakpoint)
- [x] Line buttons have min-height 44px for touch
- [x] Controls (loop, speed, filter) stack vertically on mobile
- [x] No horizontal scroll on mobile
- [x] Typecheck passes
- [x] Verify in browser at 375px width

**✅ COMPLETE**

**⏹️ STOP - END OF US-015. Do not continue to US-016.**

---

### US-016: Song Practice Page Route

**Description:** Create the main practice page that combines all components.

**Acceptance Criteria:**
- [x] Create route `/song/$songId` using TanStack Router file-based routing
- [x] Page fetches song by ID from Convex
- [x] Renders YouTubePlayer with song's youtubeId
- [x] Renders LyricsDisplay with song's lyrics
- [x] Includes all controls (loop, speed, language filter)
- [x] Shows song title and artist
- [x] 404 handling if song not found
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-016. Do not continue to US-017.**

---

### US-017: Homepage with Song List

**Description:** Create homepage showing available songs.

**Acceptance Criteria:**
- [x] Homepage at `/` route
- [x] Fetch all songs from Convex
- [x] Display as cards with title, artist, thumbnail (YouTube)
- [x] Each card links to `/song/$songId`
- [x] Show "No songs yet" if empty
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-017. Do not continue to US-018.**

---

### US-018: Set Up Vitest for Unit Testing

**Description:** Configure Vitest for component and utility testing.

**Acceptance Criteria:**
- [x] Install: `bun add -D vitest @testing-library/react @testing-library/dom jsdom @vitejs/plugin-react`
- [x] Create `vitest.config.ts` with jsdom environment
- [x] Add test script to `package.json`: `"test": "vitest"`
- [x] Create `src/test/setup.ts` for test utilities
- [x] Write sample test for a utility function (e.g., time formatting)
- [x] Run `bun test` - all tests pass
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-018. Do not continue to US-019.**

---

### US-019: Add Component Tests

**Description:** Add tests for key components.

**Acceptance Criteria:**
- [x] Test YouTubePlayer: mocks API, verifies seekTo called on play
- [x] Test LyricsDisplay: renders all language versions correctly
- [x] Test language filter: only selected language visible
- [x] Test loop toggle: state changes correctly
- [x] All tests pass with `bun test`
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-019. Do not continue to verification stories.**

---

## Verification Stories

**🚨 MANDATORY - NOT OPTIONAL 🚨**
Do NOT claim COMPLETE until ALL V-* stories are executed.

### V-001: Verify Project Setup

- [x] `bun dev` starts server without errors
- [x] Homepage loads at localhost:3001
- [x] No console errors in browser
- [x] Take screenshot of homepage

**✅ COMPLETE**

**⏹️ STOP - END OF V-001**

---

### V-002: Verify Convex Integration

- [x] Convex dashboard shows songs and lyrics tables (verified via CLI: `npx convex data songs` and `npx convex data lyrics`)
- [x] Baraye song appears in songs table (ID: j972m34dzqgx6a0r5a00n9k6pd7zekfa)
- [x] 31 lyrics rows appear in lyrics table (verified via CLI - all with audioSnippetUrl populated)
- [x] Take screenshot of Convex dashboard (alternative: screenshot of homepage showing Convex data loaded - song card with title, artist, thumbnail from database)

**✅ COMPLETE**

**⏹️ STOP - END OF V-002**

---

### V-003: Verify Player Functionality

- [x] Navigate to `/song/{baraye-id}`
- [x] YouTube video loads and plays
- [x] Click line 5 - video jumps to ~28.61s
- [x] Enable loop - line repeats when reaching endTime
- [x] Change speed to 0.5x - video slows down
- [x] Take screenshot showing player + lyrics

**✅ COMPLETE**

**⏹️ STOP - END OF V-003**

---

### V-004: Verify Language Filter

- [x] Select "Persian only" - only Persian text shows
- [x] Select "English only" - only English text shows
- [x] Select "All" - all languages show
- [x] Take screenshot of filtered view

**✅ COMPLETE**

**⏹️ STOP - END OF V-004**

---

### V-005: Verify Mobile Responsiveness

- [x] Resize browser to 375px width
- [x] Video is full width
- [x] Lyrics are below video
- [x] Controls are accessible
- [x] No horizontal scroll
- [x] Take screenshot of mobile view

**✅ COMPLETE**

**⏹️ STOP - END OF V-005**

---

### V-006: Verify RTL Support

- [x] Persian text displays right-to-left
- [x] Hebrew text displays right-to-left
- [x] Text alignment is correct (text-right)
- [x] No visual glitches with mixed RTL/LTR
- [x] Take screenshot showing RTL text

**✅ COMPLETE**

**⏹️ STOP - END OF V-006**

---

### US-020A: Sticky Layout - Fixed Player, Scrollable Lyrics

**Description:** Fix the song page layout so the header, song title, video player, and controls stay fixed/sticky while only the lyrics list scrolls.

**🚨 CURRENT BROKEN STATE (NOT FIXED!):**
- Video player is FULL WIDTH / FULL SCREEN, covering everything
- Lyrics list is BEHIND the video, not visible or accessible
- This is COMPLETELY WRONG

**✅ CORRECT LAYOUT:**
- **Desktop (lg+):** Video on LEFT (50% width, sticky), Lyrics on RIGHT (50% width, scrollable)
- **Mobile:** Video on TOP (sticky), Lyrics BELOW (scrollable)
- Header always sticky at very top

**Implementation Approach:**
```tsx
// In song.$songId.tsx - DESKTOP: side-by-side layout
<div className="h-screen flex flex-col overflow-hidden">
  {/* Sticky header */}
  <header className="flex-shrink-0 border-b ...">...</header>

  {/* Main content - side by side on desktop */}
  <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
    {/* LEFT: Sticky player section (50% on desktop) */}
    <div className="flex-shrink-0 lg:w-1/2 lg:h-full lg:overflow-hidden p-4">
      <div className="lg:sticky lg:top-0">
        <YouTubePlayer ... />
        <div className="controls ...">...</div>
      </div>
    </div>

    {/* RIGHT: Scrollable lyrics (50% on desktop) */}
    <div className="flex-1 lg:w-1/2 overflow-y-auto p-4">
      <LyricsDisplay ... />
    </div>
  </div>
</div>
```

**Acceptance Criteria:**
- [x] **DESKTOP**: Video takes LEFT 50%, Lyrics take RIGHT 50%
- [x] **DESKTOP**: Lyrics scroll independently, video stays fixed
- [x] **MOBILE**: Video on top (sticky), lyrics below (scrollable)
- [x] Header stays fixed at top (never scrolls)
- [x] Controls (loop, speed, language filter) stay with video
- [x] Lyrics list scrolls independently
- [x] **BROWSER TEST**: On desktop, video and lyrics are SIDE BY SIDE
- [x] **BROWSER TEST**: Scroll through lyrics → video stays visible
- [x] **BROWSER TEST**: On mobile (375px) → video on top, lyrics scroll below
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-020A. Do not continue to US-020.**

---

### US-020: Local Audio Snippets for Instant Playback

**Description:** Replace YouTube seekTo with local audio snippets for instant, zero-latency playback when clicking lyric lines.

**🎯 WHY THIS MATTERS:**
- YouTube seekTo has noticeable latency (500ms-2s) - frustrating for learners
- Local audio snippets play instantly (<10ms latency)
- No buffering delays, works offline once cached
- Better UX for rapid line-by-line practice

**📊 FILE SIZE ESTIMATE:**
- 31 snippets × 3-5 seconds each
- At 192 kbps MP3: ~2-3 MB total
- Acceptable to preload all snippets on page load

---

**PHASE 1: Offline Audio Extraction (Manual/Script)**

This is a ONE-TIME process per song, NOT runtime code.

**Steps:**
1. Download full audio from YouTube:
   ```bash
   yt-dlp -x --audio-format mp3 --audio-quality 192 "https://youtube.com/watch?v=xLvUEF2zpj8" -o baraye_full.mp3
   ```

2. Extract each snippet using ffmpeg (fast copy, no re-encode):
   ```bash
   # Example for line 1 (14.81s to 17.46s)
   ffmpeg -i baraye_full.mp3 -ss 14.81 -t 2.65 -c copy snippets/baraye_001.mp3

   # Example for line 28 (113.43s to 123.56s)
   ffmpeg -i baraye_full.mp3 -ss 113.43 -t 10.13 -c copy snippets/baraye_028.mp3
   ```

3. Create a shell script `scripts/extract-snippets.sh` that:
   - Reads timestamps from a JSON/CSV file
   - Batch-extracts all 31 snippets
   - Names them consistently: `{songSlug}_{lineNumber:03d}.mp3`

**Acceptance Criteria (Phase 1):**
- [x] Create `scripts/extract-snippets.sh` that extracts snippets from a full audio file
- [x] Script reads timestamps from `scripts/baraye-timestamps.json`
- [x] Script outputs to `public/audio/{songSlug}/` directory
- [x] All 31 Baraye snippets extracted at 192 kbps MP3
- [x] Total size < 4 MB (3.07MB)
- [x] Document the manual yt-dlp step in script comments

---

**PHASE 2: Convex Schema Update**

**Update `convex/schema.ts`:**
```typescript
lyrics: defineTable({
  songId: v.id("songs"),
  lineNumber: v.number(),
  startTime: v.number(),
  endTime: v.number(),
  original: v.string(),
  transliteration: v.string(),
  hebrew: v.optional(v.string()),
  english: v.string(),
  // NEW: Local audio snippet URL (relative path)
  audioSnippetUrl: v.optional(v.string()), // e.g., "/audio/baraye/baraye_001.mp3"
}).index("by_song", ["songId", "lineNumber"])
```

**Acceptance Criteria (Phase 2):**
- [x] Add `audioSnippetUrl` field to lyrics schema (optional for backward compat)
- [x] Push schema update: `bunx convex dev`
- [x] Update seed script to include audioSnippetUrl for each line
- [x] Re-seed Baraye with audio URLs: `npx convex run seed:seedBaraye`
- [x] Verify in Convex dashboard: lyrics have audioSnippetUrl populated (31 lyrics updated)
- [x] Typecheck passes

---

**PHASE 3: Audio Preloader Hook**

**Create `src/hooks/useAudioPreloader.ts`:**
```typescript
import { useEffect, useState, useRef } from 'react'

interface AudioSnippet {
  lineNumber: number
  audioUrl: string
}

interface PreloadState {
  loaded: number
  total: number
  ready: boolean
  audioElements: Map<number, HTMLAudioElement>
}

export function useAudioPreloader(snippets: AudioSnippet[]) {
  const [state, setState] = useState<PreloadState>({
    loaded: 0,
    total: snippets.length,
    ready: false,
    audioElements: new Map(),
  })
  const audioMapRef = useRef<Map<number, HTMLAudioElement>>(new Map())

  useEffect(() => {
    if (snippets.length === 0) return

    let loadedCount = 0
    const total = snippets.length

    snippets.forEach(({ lineNumber, audioUrl }) => {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.src = audioUrl

      audio.addEventListener('canplay', () => {
        loadedCount++
        audioMapRef.current.set(lineNumber, audio)
        setState({
          loaded: loadedCount,
          total,
          ready: loadedCount === total,
          audioElements: audioMapRef.current,
        })
      }, { once: true })
    })

    return () => {
      audioMapRef.current.forEach(audio => {
        audio.pause()
        audio.src = ''
      })
      audioMapRef.current.clear()
    }
  }, [snippets])

  const play = (lineNumber: number) => {
    // Stop any currently playing audio
    audioMapRef.current.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })

    const audio = audioMapRef.current.get(lineNumber)
    if (audio) {
      audio.currentTime = 0
      audio.play()
    }
  }

  const stop = () => {
    audioMapRef.current.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  return { ...state, play, stop }
}
```

**Acceptance Criteria (Phase 3):**
- [x] Create `src/hooks/useAudioPreloader.ts` with above implementation
- [x] Hook preloads all audio files on mount using `preload="auto"`
- [x] Hook tracks loading progress (loaded/total)
- [x] Hook exposes `ready` boolean when all snippets loaded
- [x] Hook exposes `play(lineNumber)` function for instant playback
- [x] Hook exposes `stop()` function to stop all audio
- [x] Hook cleans up audio elements on unmount
- [x] Typecheck passes

---

**PHASE 4: Integrate Audio Playback into Song Page**

**Update `src/routes/song.$songId.tsx`:**
1. Import and use `useAudioPreloader` hook
2. Pass lyrics with audioSnippetUrl to hook
3. Replace YouTube seekTo with `audioPreloader.play(lineIndex)`
4. Keep YouTube video for visual reference (muted or optional)
5. Show loading progress while snippets preload

**Key Changes:**
```typescript
// In SongPageContent component:
const { ready, loaded, total, play: playSnippet } = useAudioPreloader(
  sortedLyrics.map(line => ({
    lineNumber: line.lineNumber,
    audioUrl: line.audioSnippetUrl || '',
  })).filter(l => l.audioUrl)
)

const handleLineClick = useCallback((startTime: number, lineIndex: number) => {
  // Play local audio snippet (instant)
  playSnippet(sortedLyrics[lineIndex].lineNumber)

  // Optionally sync YouTube video (for visual)
  // playerRef.current?.seekTo(startTime)

  triggerClickAnimation(lineIndex)
  setActiveLineIndex(lineIndex)
  setCurrentLineIndex(lineIndex)
}, [playSnippet, sortedLyrics, triggerClickAnimation])
```

**Acceptance Criteria (Phase 4):**
- [x] Song page uses `useAudioPreloader` hook
- [x] Show "Loading audio... X/31" while preloading
- [x] Clicking a lyric line plays local audio snippet instantly
- [x] Previous audio stops when new line is clicked
- [x] Loop mode works with local audio (replay snippet when it ends)
- [x] Playback speed control works (use `audio.playbackRate`)
- [x] YouTube video is OPTIONAL - can be hidden or shown for reference
- [x] Typecheck passes

---

**PHASE 5: Browser Testing**

**Status:** ⏹️ BLOCKED: Browser extension not connected. Cannot perform browser automation tests.

**Acceptance Criteria (Phase 5):**
- [ ] **BROWSER TEST**: Navigate to `/song/{baraye-id}`
- [ ] **BROWSER TEST**: Wait for "Loading audio..." to complete
- [ ] **BROWSER TEST**: Click line 1 → audio plays INSTANTLY (no buffering)
- [ ] **BROWSER TEST**: Click line 15 → audio plays INSTANTLY
- [ ] **BROWSER TEST**: Click line 28 → audio plays INSTANTLY
- [ ] **BROWSER TEST**: Rapid clicking between lines → each plays correctly
- [ ] **BROWSER TEST**: Enable loop → line replays automatically
- [ ] **BROWSER TEST**: Change speed to 0.5x → audio slows down
- [ ] **BROWSER TEST**: Measure latency: click-to-sound < 100ms
- [ ] Take screenshot showing song page with audio controls

---

**OPTIONAL ENHANCEMENTS (Future):**

1. **Howler.js Integration**: Replace raw HTML5 audio with Howler.js for better cross-browser support
2. **Audio Sprites**: Combine all snippets into one file with time markers
3. **Convex File Storage**: Store snippets in Convex instead of public/ folder
4. **Waveform Visualization**: Show audio waveform while playing
5. **Offline Support**: Cache snippets in Service Worker for offline use

---

**⏹️ STOP - END OF US-020. Do not continue to next story.**

---

### US-021: Real Audio from YouTube + Practice Mode

**Description:** Replace placeholder audio files with real audio extracted from YouTube. Implement practice mode where clicking a line plays that segment, with loop toggle. Download video too for seamless seeking.

**🎯 THE GOAL:**
- Use the ACTUAL song audio from YouTube, not TTS placeholders
- Practice mode: click line → play that segment → stop (or loop if toggle on)
- Highlighting follows playback and moves to next line when segment ends
- Downloaded video allows seamless seeking without buffering

---

**PHASE 1: Download Real Audio & Video**

1. Download audio from YouTube:
   ```bash
   cd /Users/etanheyman/Desktop/Gits/songscript
   yt-dlp -x --audio-format mp3 --audio-quality 192 "https://youtube.com/watch?v=xLvUEF2zpj8" -o "public/audio/baraye/baraye_full.mp3"
   ```

2. Download video from YouTube:
   ```bash
   yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" "https://youtube.com/watch?v=xLvUEF2zpj8" -o "public/video/baraye/baraye_full.mp4"
   ```

3. Delete placeholder audio files:
   ```bash
   rm public/audio/baraye/baraye_*.mp3
   ```

4. Extract real snippets using ffmpeg:
   ```bash
   # Run the existing extract-snippets.sh script with the real audio
   ./scripts/extract-snippets.sh public/audio/baraye/baraye_full.mp3
   ```

**Acceptance Criteria (Phase 1):**
- [ ] yt-dlp installed (or install with `brew install yt-dlp`)
- [ ] Real audio downloaded to `public/audio/baraye/baraye_full.mp3`
- [ ] Real video downloaded to `public/video/baraye/baraye_full.mp4`
- [ ] Placeholder MP3 files deleted
- [ ] Real snippets extracted using timestamps from lyrics data
- [ ] Verify snippets play actual song audio (not TTS)

---

**PHASE 2: Practice Mode UI**

1. **Mute YouTube embed** - video is visual reference only, audio comes from snippets
2. **Click line behavior:**
   - Play that line's audio snippet
   - When snippet ends: stop (unless loop is on)
   - Highlighting stays on current line while playing
3. **Loop toggle** (already exists):
   - ON: replay snippet when it ends
   - OFF: stop when snippet ends
4. **Auto-advance highlighting:**
   - Track when snippet ends based on duration
   - Move highlight to next line when current segment completes (if not looping)

**Acceptance Criteria (Phase 2):**
- [ ] YouTube video is MUTED (audio from snippets only)
- [ ] Clicking line plays real audio snippet
- [ ] Snippet stops at end (not looping by default)
- [ ] Loop toggle makes snippet repeat
- [ ] Highlighting follows playback
- [ ] When snippet ends (no loop), highlight moves to next line OR stays (user choice)
- [ ] Typecheck passes

---

**PHASE 3: Local Video Player (Optional Enhancement)**

Replace YouTube embed with local video player using downloaded MP4:
- Use HTML5 `<video>` element with downloaded video
- Seamless seeking without buffering
- Can sync video position with audio snippets

**Acceptance Criteria (Phase 3):**
- [ ] Local video plays from `public/video/baraye/baraye_full.mp4`
- [ ] Video seeks instantly when clicking lines
- [ ] Video is muted, audio from snippets
- [ ] Fallback to YouTube embed if local video not found

**⏹️ STOP - END OF US-021. Do not continue to next story.**

---

### US-022: Download Correct Baraye Video

**Description:** Download the correct Baraye video (original, not cover) and store locally.

**Correct YouTube URL:** `https://www.youtube.com/watch?v=0th9_v-BbUI`
**Wrong URL (currently used):** `xLvUEF2zpj8` (some fingerstyle cover)

**Acceptance Criteria:**
- [x] Install yt-dlp if needed: `brew install yt-dlp`
- [x] Download video: `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" -o "public/video/baraye/baraye.mp4" "https://www.youtube.com/watch?v=0th9_v-BbUI"`
- [x] Download audio: `yt-dlp -x --audio-format mp3 --audio-quality 192 -o "public/audio/baraye/baraye_full.mp3" "https://www.youtube.com/watch?v=0th9_v-BbUI"`
- [x] Verify files exist and play correctly
- [x] Delete old placeholder audio snippets: `rm public/audio/baraye/baraye_*.mp3` (keep baraye_full.mp3)

**✅ COMPLETE**

**⏹️ STOP - END OF US-022**

---

### US-023: Get Timestamps for New Video

**Description:** Get accurate line-by-line timestamps for the new video. Multiple options available - try in order until one works.

**🎯 TIMESTAMP OPTIONS (try in order):**

1. **Option A: Megalobiz LRC (FREE, FAST)**
   - URL: https://www.megalobiz.com/lrc/maker/Baraye.55657462
   - Download LRC file, parse timestamps
   - May need offset adjustment for this specific video

2. **Option B: QuickLRC AI (FREE tier)**
   - URL: https://www.quicklrc.com
   - Upload the downloaded audio file
   - AI generates word-level timestamps
   - Export as LRC format

3. **Option C: whisper-timestamped (FREE, local)**
   - Install: `pip install whisper-timestamped`
   - Run: `whisper_timestamped baraye_full.mp3 --language fa`
   - Outputs word/segment-level timestamps
   - Reference: https://github.com/linto-ai/whisper-timestamped

4. **Option D: Manual timing**
   - Watch video, note timestamps manually
   - Use existing lyrics text, just update times
   - Time-consuming but accurate

**Acceptance Criteria:**
- [x] Try Option A (Megalobiz) first - download and test timestamps
- [x] If Option A timestamps don't match video, try Option B (QuickLRC)
- [x] If Option B fails, try Option C (whisper-timestamped)
- [x] Create `scripts/baraye-new-timestamps.json` with accurate timestamps
- [x] Verify at least 3 random lines: timestamp matches when line is sung in video
- [x] Document which option worked in progress.txt

**✅ COMPLETE** - Option A (Megalobiz/existing PRD timestamps) worked perfectly with the new video!

**⏹️ STOP - END OF US-023**

---

### US-024: Update Seed Data with New Video + Timestamps

**Description:** Update Convex seed data with correct YouTube ID and new timestamps.

**Acceptance Criteria:**
- [x] Update `convex/seed.ts`: change `youtubeId` from `xLvUEF2zpj8` to `0th9_v-BbUI`
- [x] Update all 31 lyrics with new timestamps from `scripts/baraye-new-timestamps.json`
- [x] Add `videoUrl` field to songs schema: `v.optional(v.string())` for local video path
- [x] Update seed to include `videoUrl: "/video/baraye/baraye.mp4"`
- [x] Push schema: `bunx convex dev`
- [x] Re-seed: `npx convex run seed:seedBaraye`
- [x] Verify in Convex: new youtubeId and timestamps are correct
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-024**

---

### US-025: Extract Audio Snippets from New Video

**Description:** Extract individual audio snippets for each lyric line from the new audio file.

**Acceptance Criteria:**
- [x] Update `scripts/extract-snippets.sh` to use new timestamps
- [x] Run script: `./scripts/extract-snippets.sh scripts/baraye-new-timestamps.json public/audio/baraye/baraye_full.mp3`
- [x] Verify all 31 snippets created in `public/audio/baraye/`
- [x] Verify snippets play correct audio (spot check 3 random lines)
- [x] Total size < 5 MB (3.16MB)
- [x] Update seed audioSnippetUrl paths if changed (paths unchanged - already using correct `/audio/baraye/baraye_XXX.mp3` format)

**✅ COMPLETE**

**⏹️ STOP - END OF US-025**

---

### US-026: Local Video Player with Muted Video + Audio Snippets

**Description:** Replace YouTube iframe with local video player. Video is muted, audio comes from snippets.

**🎯 THE VISION:**
- Local `<video>` element plays downloaded MP4
- Video is MUTED by default (user can unmute for full experience)
- Clicking lyric line plays audio SNIPPET (instant, no buffering)
- Video seeks to match the line (visual sync)
- User can toggle between: snippets-only, video-audio, or both

**Acceptance Criteria:**
- [x] Replace YouTubePlayer component usage with HTML5 `<video>` element
- [x] Video src: `/video/baraye/baraye.mp4`
- [x] Video `muted={true}` by default
- [x] Video `playsInline` for mobile
- [x] Clicking line: plays audio snippet + seeks video to startTime
- [x] Add "Unmute video" toggle to controls
- [x] When unmuted: video audio plays, snippets are paused/disabled
- [x] Fallback: if local video missing, show error or use YouTube embed
- [x] Typecheck passes

**✅ COMPLETE**

**⏹️ STOP - END OF US-026**

---

### US-027: Full Video Playback Mode

**Description:** Add mode where video plays with audio and lyrics auto-sync/highlight.

**Acceptance Criteria:**
- [ ] Add "Play Full Video" button
- [ ] When clicked: unmute video, start from beginning, auto-play
- [ ] Lyrics highlight based on video currentTime (existing logic)
- [ ] Loop mode still works (re-seek to line startTime)
- [ ] Speed control works on video
- [ ] User can click line to jump (video seeks + continues playing)
- [ ] Typecheck passes

**⏹️ STOP - END OF US-027**

---

### V-007: Verify New Video + Audio System

**Description:** Verify the new video/audio system works correctly.

- [ ] **BROWSER TEST**: Navigate to `/song/{baraye-id}`
- [ ] **BROWSER TEST**: Video shows correct Baraye video (not fingerstyle cover)
- [ ] **BROWSER TEST**: Video is muted by default
- [ ] **BROWSER TEST**: Click line 5 → audio snippet plays instantly
- [ ] **BROWSER TEST**: Click line 15 → audio snippet plays, video seeks
- [ ] **BROWSER TEST**: Enable "Unmute video" → video audio plays
- [ ] **BROWSER TEST**: Click "Play Full Video" → video plays from start with audio
- [ ] **BROWSER TEST**: Lyrics highlight correctly during full playback
- [ ] **BROWSER TEST**: Loop mode works (line repeats)
- [ ] Take screenshot showing new player

**⏹️ STOP - END OF V-007**

---

## Non-Goals (v1)

- CLI tool for song creation (v2)
- User accounts beyond admin
- Song upload/import from external APIs
- Audio-only mode (no video)
- Spaced repetition / progress tracking
- Multiple simultaneous songs

---

## Technical Notes

**Files to create:**
- `app/components/YouTubePlayer.tsx`
- `app/components/LyricsDisplay.tsx`
- `app/routes/song.$songId.tsx`
- `app/routes/index.tsx`
- `app/routes/login.tsx`
- `convex/schema.ts`
- `convex/songs.ts` (queries/mutations)
- `convex/seed.ts`
- `convex/auth.ts`

**Baraye Full Lyrics Data (for US-006):**

```typescript
const barayeLyrics = [
  { lineNumber: 1, startTime: 14.81, endTime: 17.46, original: "برای توی کوچه رقصیدن", transliteration: "Barāye tūye kūche raqsidan", hebrew: "בָּרָאיֶה טוּיֶה כּוּצֶ'ה רַקְסִידַן", english: "For dancing in the alley" },
  { lineNumber: 2, startTime: 17.46, endTime: 20.91, original: "برای ترسیدن به وقت بوسیدن", transliteration: "Barāye tarsidan be vaqt-e būsidan", hebrew: "בָּרָאיֶה טַרְסִידַן בֶּה וַקְטֶה בּוּסִידַן", english: "For being afraid at the moment of kissing" },
  { lineNumber: 3, startTime: 20.91, endTime: 24.63, original: "برای خواهرم خواهرت خواهرامون", transliteration: "Barāye khāharam khāharet khāharāmūn", hebrew: "בָּרָאיֶה חָאהַרַם חָאהַרֶת חָאהַרָמוּן", english: "For my sister, your sister, our sisters" },
  { lineNumber: 4, startTime: 24.63, endTime: 28.61, original: "برای تغییر مغزها که پوسیدن", transliteration: "Barāye taghyir-e maghz-hā ke pūsidan", hebrew: "בָּרָאיֶה תַגְ'יִירֶה מַגְ'זְהָא כֶּה פּוּסִידַן", english: "For changing the minds that have rotted" },
  { lineNumber: 5, startTime: 28.61, endTime: 32.33, original: "برای شرمندگی، برای بی پولی", transliteration: "Barāye sharmandegi, Barāye bi-pūli", hebrew: "בָּרָאיֶה שַׁרְמַנְדֶגִי, בָּרָאיֶה בִּיפּוּלִי", english: "For shame, for being penniless" },
  { lineNumber: 6, startTime: 32.33, endTime: 35.78, original: "برای حسرت یک زندگی معمولی", transliteration: "Barāye hasrat-e yek zendegi-ye ma'mūli", hebrew: "בָּרָאיֶה חַסְרַטֶה יֶק זֶנְדֶגִיֶה מַעְמוּלִי", english: "For the longing for an ordinary life" },
  { lineNumber: 7, startTime: 35.78, endTime: 39.50, original: "برای کودک زباله گرد و آرزوهاش", transliteration: "Barāye kūdak-e zobālegard o ārezūhāsh", hebrew: "בָּרָאיֶה כּוּדַכֶּה זוּבָּלֶגַרְד אוֹ אָרֶזוּהָאש", english: "For the scavenger child and his dreams" },
  { lineNumber: 8, startTime: 39.50, endTime: 43.22, original: "برای این اقتصاد دستوری", transliteration: "Barāye in eqtesād-e dastūri", hebrew: "בָּרָאיֶה אִין אֶקְטֶסָאדֶה דַסְטוּרִי", english: "For this controlled economy" },
  { lineNumber: 9, startTime: 43.22, endTime: 46.94, original: "برای این هوای آلوده", transliteration: "Barāye in havā-ye ālūde", hebrew: "בָּרָאיֶה אִין הַוָאיֶה אָלוּדֶה", english: "For this polluted air" },
  { lineNumber: 10, startTime: 46.94, endTime: 50.66, original: "برای ولیعصر و درختان فرسوده", transliteration: "Barāye Vali-'asr o derakht-hāye farsūde", hebrew: "בָּרָאיֶה וַלִיעַסְר אוֹ דֶרַחְטְהָאיֶה פַרְסוּדֶה", english: "For Valiasr and its dying trees" },
  { lineNumber: 11, startTime: 50.66, endTime: 54.38, original: "برای پیروز و احتمال انقراضش", transliteration: "Barāye Pirūz o ehtemāl-e enqerāzesh", hebrew: "בָּרָאיֶה פִּירוּז אוֹ אֶחְתֶמָאלֶה אֶנְקֶרָאזֶש", english: "For Pirouz and the possibility of its extinction" },
  { lineNumber: 12, startTime: 54.38, endTime: 58.10, original: "برای سگهای بی گناه ممنوعه", transliteration: "Barāye sag-hāye bi-gonāh-e mamnū'e", hebrew: "בָּרָאיֶה סַגְהָאיֶה בִּיגוּנָאהֶה מַמְנוּעֶה", english: "For the innocent dogs that are banned" },
  { lineNumber: 13, startTime: 58.10, endTime: 61.81, original: "برای گریه های بی وقفه", transliteration: "Barāye gerye-hāye bi-vaqfe", hebrew: "בָּרָאיֶה גֶרְיֶהָאיֶה בִּיוַקְפֶה", english: "For the endless crying" },
  { lineNumber: 14, startTime: 61.81, endTime: 65.30, original: "برای تصویر تکرار این لحظه", transliteration: "Barāye tasvir-e tekrār-e in lahze", hebrew: "בָּרָאיֶה טַסְוִירֶה טֶכְרָארֶה אִין לַחְזֶה", english: "For the image of repeating this moment" },
  { lineNumber: 15, startTime: 65.30, endTime: 69.03, original: "برای چهره ای که میخنده", transliteration: "Barāye chehre-'i ke mikhande", hebrew: "בָּרָאיֶה צֶ'הְרֶאִי כֶּה מִיחַנְדֶה", english: "For a face that is laughing" },
  { lineNumber: 16, startTime: 69.03, endTime: 72.75, original: "برای دانش آموزا برای آینده", transliteration: "Barāye dānesh-āmūz-hā, Barāye āyande", hebrew: "בָּרָאיֶה דָאנֶשְׁאָמוּזְהָא, בָּרָאיֶה אָיַנְדֶה", english: "For the students, for the future" },
  { lineNumber: 17, startTime: 72.75, endTime: 77.27, original: "برای این بهشت اجباری", transliteration: "Barāye in behesht-e ejbāri", hebrew: "בָּרָאיֶה אִין בֶּהֶשְׁטֶה אֶג'בָּארִי", english: "For this forced paradise" },
  { lineNumber: 18, startTime: 77.27, endTime: 83.94, original: "برای نخبه های زندانی", transliteration: "Barāye nokhbe-hāye zendāni", hebrew: "בָּרָאיֶה נוֹחְבֶּהָאיֶה זֶנְדָאנִי", english: "For the imprisoned intellectuals" },
  { lineNumber: 19, startTime: 83.94, endTime: 84.47, original: "برای کودکان افغانی", transliteration: "Barāye kūdakān-e Afghāni", hebrew: "בָּרָאיֶה כּוּדַכָּאנֶה אַפְגָ'אנִי", english: "For the Afghan children" },
  { lineNumber: 20, startTime: 84.47, endTime: 87.39, original: "برای این همه برای غیر تکراری", transliteration: "Barāye in hame barāye gheire tekrāri", hebrew: "בָּרָאיֶה אִין הַמֶה בָּרָאיֶה גֵ'ירֶה טֶכְרָארִי", english: "For all these 'for's that are not repetitive" },
  { lineNumber: 21, startTime: 87.39, endTime: 91.38, original: "برای اینهمه شعار های تو خالی", transliteration: "Barāye in hame sho'ār-hāye tū-khāli", hebrew: "בָּרָאיֶה אִין הַמֶה שׁוֹעָארְהָאיֶה טוּחָאלִי", english: "For all these empty slogans" },
  { lineNumber: 22, startTime: 91.38, endTime: 94.83, original: "برای آوار خونه های پوشالی", transliteration: "Barāye āvār-e khāne-hāye pūshāli", hebrew: "בָּרָאיֶה אָוָארֶה חָאנֶהָאיֶה פּוּשָׁאלִי", english: "For the rubble of houses made of straw" },
  { lineNumber: 23, startTime: 94.83, endTime: 98.55, original: "برای احساس آرامش", transliteration: "Barāye ehsās-e ārāmesh", hebrew: "בָּרָאיֶה אֶחְסָאסֶה אָרָאמֶש", english: "For the feeling of peace" },
  { lineNumber: 24, startTime: 98.55, endTime: 102.27, original: "برای خورشید پس از شبای طولانی", transliteration: "Barāye khorshid pas az shab-hāye tūlāni", hebrew: "בָּרָאיֶה חוֹרְשִׁיד פַּס אַז שַׁבְּהָאיֶה טוּלָאנִי", english: "For the sun after the long nights" },
  { lineNumber: 25, startTime: 102.27, endTime: 105.99, original: "برای قرصهای اعصاب و بی خوابی", transliteration: "Barāye qors-hāye a'sāb o bi-khābi", hebrew: "בָּרָאיֶה קוֹרְסְהָאיֶה אַעְסָאב אוֹ בִּיחָאבִּי", english: "For the nerve pills and insomnia" },
  { lineNumber: 26, startTime: 105.99, endTime: 109.71, original: "برای مـرد، میهن، آبادی", transliteration: "Barāye mard, mihan, ābādi", hebrew: "בָּרָאיֶה מַרְד, מִיהַן, אָבָּאדִי", english: "For man, homeland, prosperity" },
  { lineNumber: 27, startTime: 109.71, endTime: 113.43, original: "برای دختری که آرزو داشت پسر بود", transliteration: "Barāye dokhtari ke ārezū dāsht pesar būd", hebrew: "בָּרָאיֶה דוֹחְטַרִי כֶּה אָרֶזוּ דָאשְׁט פֶּסַר בּוּד", english: "For the girl who wished she was a boy" },
  { lineNumber: 28, startTime: 113.43, endTime: 123.56, original: "برای زن، زندگی، آزادی", transliteration: "Barāye zan, zendegi, āzādi", hebrew: "בָּרָאיֶה זַן, זֶנְדֶגִי, אָזָאדִי", english: "For woman, life, freedom" },
  { lineNumber: 29, startTime: 123.56, endTime: 130.81, original: "بــــرای آزادی", transliteration: "Barāye āzādi", hebrew: "בָּרָאיֶה אָזָאדִי", english: "For freedom" },
  { lineNumber: 30, startTime: 130.81, endTime: 138.15, original: "بـــرای آزادی", transliteration: "Barāye āzādi", hebrew: "בָּרָאיֶה אָזָאדִי", english: "For freedom" },
  { lineNumber: 31, startTime: 138.15, endTime: 151.46, original: "بـــرای آزادی", transliteration: "Barāye āzādi", hebrew: "בָּרָאיֶה אָזָאדִי", english: "For freedom" },
];
```
