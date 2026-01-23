# Anonymous Progress Tracking Design

**Date:** 2025-01-22
**Status:** Approved
**Related Stories:** US-052 through US-056, V-029, TEST-008

## Problem Statement

Anonymous users can practice songs but their progress is not saved. The current implementation requires authentication for all progress mutations (`requireAuth(ctx)`), which is correct for security. However, there's no localStorage-based tracking for anonymous users, and the migration flow assumes Convex→Convex migration rather than localStorage→Convex.

## Solution Overview

1. **localStorage storage layer** for anonymous users (frontend only)
2. **Unified progress hook** that abstracts the data source
3. **Migration rewrite** to read from localStorage and insert to Convex
4. **CTA for anonymous users** encouraging signup

## Architecture

### localStorage Schema

Mirrors Convex tables for easy migration:

```typescript
// Key: "songscript_anonymous_progress"
interface AnonymousProgress {
  visitorId: string;  // UUID, also stored as songscript_visitor_id
  wordProgress: Array<{
    persian: string;
    wordId?: string;
    learned: boolean;
    viewCount: number;
    playCount: number;
    lastSeen: number;
  }>;
  lineProgress: Array<{
    songId: string;
    lineNumber: number;
    learned: boolean;
    completionCount: number;
  }>;
  songProgress: Array<{
    songId: string;
    lastPlayedAt: number;
    totalListenTime: number;
  }>;
  practiceLog: Array<{
    date: string;  // YYYY-MM-DD
    practiceSeconds: number;
    wordsLearned: number;
    linesCompleted: number;
  }>;
  wishlist: Array<{ songId: string }>;
  preferences: {
    playbackSpeed: number;
    languageFilter: string;
    videoMuted: boolean;
    videoCollapsed: boolean;
  };
}
```

### Data Flow

```
Anonymous User                    Authenticated User
      │                                  │
      ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│  localStorage   │              │     Convex      │
│  (browser-only) │              │   (cloud sync)  │
└────────┬────────┘              └────────┬────────┘
         │                                │
         └───────────┬────────────────────┘
                     ▼
              ┌─────────────────┐
              │  useProgress()  │  ← Single hook abstracts the source
              │     hook        │
              └─────────────────┘
```

### Key Components

1. **`useAnonymousProgress()`** - Reads/writes localStorage
2. **`useAuthenticatedProgress()`** - Existing Convex queries/mutations
3. **`useProgress()`** - Combines both, picks source based on auth state
4. **Updated `migrateAnonymousData`** - Accepts localStorage data, validates, inserts to Convex

## Security Considerations

### Data Validation on Migration

Before inserting localStorage data to Convex, validate:

- **Type checking:** All fields match expected types
- **String length limits:** persian/songId capped at reasonable lengths (e.g., 500 chars)
- **Valid IDs:** songId must be valid Convex ID format
- **Numeric bounds:** counts/times must be positive integers within bounds
- **Array limits:** Max items per array (e.g., 10,000 words, 1,000 songs)

```typescript
// Example validation
function validateWordProgress(data: unknown): WordProgress[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(isValidWordProgressItem)
    .slice(0, 10000)  // Limit array size
    .map(sanitizeWordProgress);
}
```

### localStorage Corruption Handling

- On read: validate JSON structure, return empty state if corrupted
- Never trust localStorage data without validation
- Log corruption events for debugging

## Migration Flow

1. User practices anonymously → data saved to localStorage
2. User signs up with "Bring my progress" checked
3. Magic link verified in `verify.tsx`
4. `verify.tsx` reads localStorage, calls `migrateAnonymousData` with full data
5. Convex mutation validates and inserts records with new userId
6. localStorage cleared on success
7. User redirected to dashboard with their progress

## User Experience

### Anonymous User Banner

Show on song page when anonymous user has progress:

```
┌──────────────────────────────────────────────────┐
│ 🎵 You've learned 12 words!                      │
│ Sign up to save your progress across devices →   │
└──────────────────────────────────────────────────┘
```

### Progress Persistence

- Anonymous: checkmarks persist on page refresh (same browser)
- After signup: checkmarks persist across browsers/devices

## Implementation Order

1. US-052: Create localStorage hook
2. US-053: Create unified progress hook
3. US-054: Update song page to use new hook
4. US-055: Rewrite migration mutation
5. US-056: Add anonymous user CTA
6. V-029: Verify full flow
7. TEST-008: E2E test

## Notes

- The existing `requireAuth(ctx)` pattern in Convex is CORRECT - don't change it
- This design adds a frontend layer, not backend changes (except migration mutation args)
- localStorage has ~5MB limit, sufficient for typical usage
- Consider adding localStorage cleanup for very old data (>1 year) in future
