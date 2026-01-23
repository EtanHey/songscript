# AI Agent Instructions for Leaderboard PRD

## Design Reference

Read the full design doc at: `docs/plans/2026-01-21-leaderboard-design.md`

## ⚠️ NEVER EDIT index.json DIRECTLY

To add/modify stories, use `update.json`:

1. Create story files in `stories/`
2. Write changes to `update.json` (not index.json!)
3. Ralph merges automatically on next run

## Example update.json
```json
{
  "storyOrder": ["existing...", "NEW-001"],
  "pending": ["existing...", "NEW-001"],
  "stats": { "total": X, "pending": Y }
}
```

## Story ID Rules
- Check `archive/` for used IDs before creating new ones
- Use next available number (e.g., if US-047 exists, use US-048)

## Language Difficulty Multipliers

Based on FSI rankings:
| Tier | Languages | Multiplier |
|------|-----------|------------|
| Standard | Spanish, French, Italian, Dutch | 1.0x |
| Hard | Hebrew, Persian/fa, Russian, Hindi | 1.5x |
| Super-Hard | Arabic, Japanese, Korean, Chinese | 2.0x |

## Key Implementation Notes

1. **Schema First**: US-036 updates users table - must complete before leaderboard queries
2. **Backend Before UI**: Complete all convex/ queries before dashboard/page components
3. **Display Name**: Users can play without displayName, but won't appear on leaderboard until set
4. **Progress Score Formula**: `(words_learned × multiplier) + (lines_completed × multiplier × 0.5)`

## Browser Verification URLs

- Dashboard: http://localhost:3001/dashboard
- Leaderboard: http://localhost:3001/leaderboard
- Settings: http://localhost:3001/settings

## Running the Dev Server

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Vite frontend
bun run dev
```
