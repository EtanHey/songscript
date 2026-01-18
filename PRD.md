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
| ✅ **Stories Complete** | 13 (US-001, US-002, US-003, US-004, US-006, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014) |
| ⚠️ **BROKEN** | US-005 (Auth) |
| 🔄 **Stories Remaining** | 5 + 6 verification |
| ☑️ **Criteria Checked** | 97 / 107 (~91%) |

**Next Story:** US-005 (Auth), then US-015

---

## Browser Setup

- Viewport: Desktop (1440px) and Mobile (375px)
- Test URL: `http://localhost:3001`
- **Port:** 3001 (not 3000)

Run `bun dev` to start the development server on port 3001.

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
- [ ] Remove password-based auth, implement magic link OR passkey
- [ ] Login page at `/login` - email input only, no password field, no signup toggle
- [ ] Server-side check: reject any email that isn't `etan@heyman.net`
- [ ] Auth API endpoints return 200 (not 500)
- [ ] Use Context7 (`mcp__Context7__query-docs`) to look up Better Auth magic link/passkey setup
- [ ] **BROWSER TEST**: Navigate to `/login`, enter admin email, complete auth flow
- [ ] **BROWSER TEST**: Verify session persists after login (check `/api/auth/get-session` returns user)
- [ ] **BROWSER TEST**: Verify non-admin email is rejected with clear error message
- [ ] Typecheck passes

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
- [ ] YouTube player: 100% width on mobile, fixed width on desktop
- [ ] Lyrics below video on mobile, beside on desktop (md: breakpoint)
- [ ] Line buttons have min-height 44px for touch
- [ ] Controls (loop, speed, filter) stack vertically on mobile
- [ ] No horizontal scroll on mobile
- [ ] Typecheck passes
- [ ] Verify in browser at 375px width

**⏹️ STOP - END OF US-015. Do not continue to US-016.**

---

### US-016: Song Practice Page Route

**Description:** Create the main practice page that combines all components.

**Acceptance Criteria:**
- [ ] Create route `/song/$songId` using TanStack Router file-based routing
- [ ] Page fetches song by ID from Convex
- [ ] Renders YouTubePlayer with song's youtubeId
- [ ] Renders LyricsDisplay with song's lyrics
- [ ] Includes all controls (loop, speed, language filter)
- [ ] Shows song title and artist
- [ ] 404 handling if song not found
- [ ] Typecheck passes

**⏹️ STOP - END OF US-016. Do not continue to US-017.**

---

### US-017: Homepage with Song List

**Description:** Create homepage showing available songs.

**Acceptance Criteria:**
- [ ] Homepage at `/` route
- [ ] Fetch all songs from Convex
- [ ] Display as cards with title, artist, thumbnail (YouTube)
- [ ] Each card links to `/song/$songId`
- [ ] Show "No songs yet" if empty
- [ ] Typecheck passes

**⏹️ STOP - END OF US-017. Do not continue to US-018.**

---

### US-018: Set Up Vitest for Unit Testing

**Description:** Configure Vitest for component and utility testing.

**Acceptance Criteria:**
- [ ] Install: `bun add -D vitest @testing-library/react @testing-library/dom jsdom @vitejs/plugin-react`
- [ ] Create `vitest.config.ts` with jsdom environment
- [ ] Add test script to `package.json`: `"test": "vitest"`
- [ ] Create `src/test/setup.ts` for test utilities
- [ ] Write sample test for a utility function (e.g., time formatting)
- [ ] Run `bun test` - all tests pass
- [ ] Typecheck passes

**⏹️ STOP - END OF US-018. Do not continue to US-019.**

---

### US-019: Add Component Tests

**Description:** Add tests for key components.

**Acceptance Criteria:**
- [ ] Test YouTubePlayer: mocks API, verifies seekTo called on play
- [ ] Test LyricsDisplay: renders all language versions correctly
- [ ] Test language filter: only selected language visible
- [ ] Test loop toggle: state changes correctly
- [ ] All tests pass with `bun test`
- [ ] Typecheck passes

**⏹️ STOP - END OF US-019. Do not continue to verification stories.**

---

## Verification Stories

**🚨 MANDATORY - NOT OPTIONAL 🚨**
Do NOT claim COMPLETE until ALL V-* stories are executed.

### V-001: Verify Project Setup

- [ ] `bun dev` starts server without errors
- [ ] Homepage loads at localhost:3001
- [ ] No console errors in browser
- [ ] Take screenshot of homepage

**⏹️ STOP - END OF V-001**

---

### V-002: Verify Convex Integration

- [ ] Convex dashboard shows songs and lyrics tables
- [ ] Baraye song appears in songs table
- [ ] 31 lyrics rows appear in lyrics table
- [ ] Take screenshot of Convex dashboard

**⏹️ STOP - END OF V-002**

---

### V-003: Verify Player Functionality

- [ ] Navigate to `/song/{baraye-id}`
- [ ] YouTube video loads and plays
- [ ] Click line 5 - video jumps to ~28.61s
- [ ] Enable loop - line repeats when reaching endTime
- [ ] Change speed to 0.5x - video slows down
- [ ] Take screenshot showing player + lyrics

**⏹️ STOP - END OF V-003**

---

### V-004: Verify Language Filter

- [ ] Select "Persian only" - only Persian text shows
- [ ] Select "English only" - only English text shows
- [ ] Select "All" - all languages show
- [ ] Take screenshot of filtered view

**⏹️ STOP - END OF V-004**

---

### V-005: Verify Mobile Responsiveness

- [ ] Resize browser to 375px width
- [ ] Video is full width
- [ ] Lyrics are below video
- [ ] Controls are accessible
- [ ] No horizontal scroll
- [ ] Take screenshot of mobile view

**⏹️ STOP - END OF V-005**

---

### V-006: Verify RTL Support

- [ ] Persian text displays right-to-left
- [ ] Hebrew text displays right-to-left
- [ ] Text alignment is correct (text-right)
- [ ] No visual glitches with mixed RTL/LTR
- [ ] Take screenshot showing RTL text

**⏹️ STOP - END OF V-006**

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
