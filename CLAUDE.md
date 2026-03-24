# SongScript

Song transliteration learning app — follow each line of a song and learn to read/pronounce it.

## Purpose (WHY)
- Display song lyrics line by line with transliteration
- Help users learn pronunciation by following along
- Supported languages: Persian, Korean, Arabic, Hebrew, English

## Tech Stack (WHAT)
- Framework: TanStack Start (Bun runtime)
- Database: Convex (real-time sync)
- Auth: Convex + Better Auth
- Styling: Tailwind CSS + shadcn/ui
- State: @convex-dev/react-query + TanStack Query
- Testing: Vitest (199 tests) + Playwright (E2E)

## Workflow (HOW)

### Git safety
Never commit or push unless explicitly told.
Always ask which branch before committing.

```bash
git status  # Check current branch FIRST
# Then ask: "Should I commit to <branch-name>?"
```

### Convex .js file error (critical)
If Convex sees both `.ts` and `.js` in `convex/`, it will fail with:
`Two output files share the same path but have different contents`.
Fix by removing stray JS files before starting dev:

```bash
rm -f convex/*.js
npx convex dev
```

If it happens mid-run, stop dev, delete `convex/*.js`, restart.
Never create `.js` files in `convex/` (only `.ts`).

Prevention rules:
- After creating a git worktree, run `rm -f convex/*.js` before `npx convex dev`
- Ensure `convex/*.js` is ignored in `.gitignore`
- Check before starting: `ls convex/*.js 2>/dev/null`

### Testing requirements
All new helpers/utilities must have tests.

Test locations:
- Component tests: `src/components/ComponentName.test.tsx`
- Hook tests: `src/hooks/hookName.test.ts`
- Utility tests: `src/lib/utilName.test.ts` or `src/utils/utilName.test.ts`
- Integration tests: `src/__tests__/featureName.test.ts`
- Convex function tests: `convex/functionName.test.ts`

Pre-commit hooks run:
```bash
bun run test      # Unit tests (Vitest)
bun run typecheck # TypeScript check
```

If tests fail, the commit is blocked. Fix tests before committing.

Manual test commands:
```bash
bun run test        # Run all tests once (199 tests)
bun run test:watch  # Watch mode for development
bun run test:e2e    # Playwright E2E tests
```

When creating new code:
1. New helper/utility -> add `*.test.ts`
2. New component with logic -> add `*.test.tsx`
3. Bug fix -> add regression test if possible
4. Refactor -> ensure existing tests still pass

### WhisperX pipeline
Full documentation: `docs.local/learnings/whisperx-pipeline.md`
Use it when adding songs or updating timestamps.
Pipeline scripts live in `scripts/whisperx/`.
