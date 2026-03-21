# Macroscope — SongScript Code Review Rules

> Automated code review guidelines for the SongScript music/lyrics learning app.
> Stack: React (TanStack Start), Convex, TypeScript, Tailwind CSS, Bun.

---

## Security

- Never commit API keys, Convex deploy keys, or `.env` files. Secrets belong in environment variables or 1Password.
- User authentication tokens (Better Auth / Convex) must not be exposed in client-side code or bundled output.
- Convex auth helpers (`convex/auth.ts`, `convex/authHelpers.ts`) must validate sessions server-side — never trust client-provided identity.
- Third-party API credentials (YouTube Data API, WhisperX) must be server-only; never import them in `src/` files.

## Architecture

- Convex mutations, queries, and actions live in `convex/` — never call the Convex client directly from React components. Use hooks from `@convex-dev/react-query` or the generated `src/_generated/` bindings.
- Never create `.js` files in `convex/`. Convex compiles `.ts` to `.js`; duplicate outputs cause build failures (`Two output files share the same path but have different contents`).
- Audio/video preloading must follow the established pattern: preload on mount, play on user interaction. See `YouTubePlayer.tsx` and `LocalVideoPlayer.tsx`.
- Routes go in `src/routes/`, components in `src/components/`, hooks in `src/hooks/`, utilities in `src/lib/` or `src/utils/`.
- Schema changes in `convex/schema.ts` must be backward-compatible or accompanied by a migration in `convex/migration.ts`.
- State management: prefer Convex reactive queries over local React state. Use TanStack Query for non-Convex data only.

## RTL & Internationalization

- Hebrew and Arabic text must use `text-right` and `items-end` Tailwind classes.
- Check flex order in RTL layouts — `flex-row` renders first child on the RIGHT in RTL context.
- Transliteration display must handle mixed LTR/RTL content (e.g., Hebrew lyrics with Latin transliteration). Use `dir` attributes explicitly when mixing directions.
- Language flags and labels must come from `LanguageFlag.tsx` — do not hardcode flag emoji or language names elsewhere.

## Testing

- Run `bun run test` (Vitest) before any PR. Pre-commit hooks enforce this.
- Run `bun run typecheck` before any PR. TypeScript strict mode is mandatory.
- Test both LTR and RTL layouts for any UI change that touches lyrics display or text alignment.
- New helpers/utilities require a corresponding `*.test.ts` file. New components with logic require `*.test.tsx`.
- Bug fixes should include a regression test when feasible.
- E2E tests (`bun run test:e2e`, Playwright) must pass for changes touching routes, auth flow, or song playback.

## Style & Code Quality

- TypeScript strict mode — no `any` types. Use proper generics or `unknown` with type guards.
- Use Tailwind classes exclusively; no inline styles. Component-scoped CSS is acceptable only for animations (see `Header.css`, `App.css`).
- UI primitives come from ShadCN (`src/components/ui/`). Do not introduce competing component libraries.
- Prefer named exports over default exports for components and utilities.
- Convex function files (`convex/*.ts`) must not import from `src/` — the Convex backend and frontend are separate bundles.

## Convex-Specific

- Every Convex mutation that modifies user data must check authentication via `convex/authHelpers.ts`.
- Queries that return user-specific data must filter by the authenticated user's ID — never return all rows and filter client-side.
- Convex function arguments must use `v.` validators from `convex/values`. Never use unvalidated inputs.
- Before starting `npx convex dev`, run `rm -f convex/*.js 2>/dev/null` to prevent stale JS collisions.

## Performance

- Song lyrics and word data should be fetched with Convex reactive queries so updates stream automatically — avoid polling or manual refetch.
- Audio preloading must not block initial render. Use lazy loading for heavy assets (audio files, video embeds).
- Dashboard components (`src/components/dashboard/`) should use pagination or virtualization for large data sets (leaderboards, song lists).

## Git & Workflow

- Never push directly to `main` without passing tests.
- Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.
- PRD-driven development: features come from `PRD.md` stories executed via Ralph. Do not implement features outside the PRD without discussion.
