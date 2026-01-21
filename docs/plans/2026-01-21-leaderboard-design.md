# Leaderboard Feature Design

**Date:** 2026-01-21
**Status:** Approved

## Overview

Add a leaderboard system to SongScript for motivation and gamification. Users compete on streak consistency and weighted progress scores that account for language difficulty.

## Leaderboards

### 1. Streak Leaderboard
- Metric: Current consecutive days practiced
- Simple and clear - rewards consistency

### 2. Progress Leaderboard
- Metric: `(words_learned × multiplier) + (lines_completed × multiplier × 0.5)`
- Weighted by language difficulty

## Language Difficulty Multipliers

Based on [FSI Language Difficulty Rankings](https://effectivelanguagelearning.com/language-guide/language-difficulty/):

| Tier | Languages | Multiplier | FSI Hours |
|------|-----------|------------|-----------|
| Standard | Spanish, French, Italian, Dutch | 1.0x | 600 |
| Hard | Hebrew, Persian, Russian, Hindi | 1.5x | 1,100 |
| Super-Hard | Arabic, Japanese, Korean, Chinese | 2.0x | 2,200 |

## Time Periods

Three tabs on leaderboard:
- **Weekly** - Resets every Monday
- **Monthly** - Resets on 1st of month
- **All-time** - Cumulative hall of fame

## UI Components

### Mini Leaderboard (Dashboard Section)
- Top 5 for each board (Streak / Progress toggle)
- "You're #23" indicator if user is ranked
- "View full leaderboard →" link
- "Set display name to join" CTA if name not set

### Full Leaderboard Page (`/leaderboard`)
- Two main tabs: Streak | Progress
- Sub-tabs: Weekly | Monthly | All-time
- Top 50 with pagination
- User's own row highlighted/pinned
- Future: Filter by language

### Row Format
```
#1  🥇  Ahmed      🔥 45 days    [Persian flag]
#2  🥈  Sarah      🔥 38 days    [Arabic flag]
#3  🥉  Mike       🔥 31 days    [Hebrew flag]
...
#23 ⭐  You        🔥 12 days    [Persian flag]  ← highlighted
```

## Identity & Display Names

- Users can play without display name
- Progress tracked silently in background
- Display name required to appear on leaderboard
- Once set, user instantly appears with accumulated score

### Display Name Rules
- 3-20 characters
- Basic offensive word filter
- Editable in settings

## Auth & Profile Flow

### Signup Enhancement
- Keep magic link auth
- After first auth: prompt for display name (skippable)
- "What should we call you?" screen

### New Settings Page (`/settings`)
- Display name (editable)
- Email (read-only)
- Language preferences
- Future: notifications, delete account

### Header Update
- Show display name instead of email
- "Set name" prompt if unset
- Dropdown: Settings, Sign Out

## Schema Changes

### Users Table (Modified)
```typescript
users: defineTable({
  email: v.string(),
  authId: v.optional(v.string()),
  displayName: v.optional(v.string()),  // NEW
  createdAt: v.optional(v.number()),    // NEW
  // REMOVED: role field (unused, admin by email check)
})
```

### New File: `convex/leaderboard.ts`
```typescript
// Queries
leaderboard.getStreakLeaderboard({ period, limit, offset })
leaderboard.getProgressLeaderboard({ period, limit, offset })
leaderboard.getUserRank({ visitorId, type, period })
```

### New File: `convex/languageDifficulty.ts`
```typescript
// Utility with multiplier mappings
const DIFFICULTY_MULTIPLIERS = {
  // Standard (1.0x)
  spanish: 1.0, french: 1.0, italian: 1.0, dutch: 1.0,
  // Hard (1.5x)
  hebrew: 1.5, persian: 1.5, fa: 1.5, russian: 1.5, hindi: 1.5,
  // Super-Hard (2.0x)
  arabic: 2.0, japanese: 2.0, korean: 2.0, chinese: 2.0, mandarin: 2.0,
}
```

## New Routes

| Route | Description |
|-------|-------------|
| `/leaderboard` | Full leaderboard page |
| `/settings` | User profile settings |

## Implementation Order

1. Schema changes (add displayName, createdAt, remove role)
2. Display name mutation + settings page
3. Leaderboard queries (streak + progress with multipliers)
4. Mini leaderboard dashboard component
5. Full leaderboard page
6. Signup flow enhancement (display name prompt)

## Future Enhancements (Not in v1)

- Filter leaderboard by language
- Country-based leaderboards
- Friends/groups competition
- OTP authentication option
- Weekly recap emails
