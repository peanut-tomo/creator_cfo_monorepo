# Context Snapshot

## Version

- version: 0.3.0
- updated_at: 2026-03-27
- scope: mobile shell now includes login gate, tabs, theme, and locale on top of rn local-first

## Active Decisions

- Monorepo remains the baseline.
- Frontend is now Expo + React Native + Expo Router.
- There is no backend in the current phase.
- Structured records live in SQLite; documents live in the local file vault.
- Theme, locale, and local session summary live in AsyncStorage under the storage contract.
- Source of truth is `packages/storage`, `packages/schemas`, `docs/contracts`, and root agent rules.

## Implemented Structure

- `apps/mobile`: Expo Router app with login gate, four-tab shell, theme and locale switching, and local bootstrap status.
- `packages/storage`: storage contracts, path helpers, and contract tests.
- `packages/ui`: React Native presentation primitives.
- `packages/schemas`: creator product modules, platforms, and workflow principles.

## Verification Snapshot

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm contract:check`
- `pnpm build`

## Pending Follow-Ups

- Add real feature slices on top of the local SQLite and file-vault contracts inside Ledger and Discover.
- Decide whether Apple sign-in should later sync to a backend account once a future PRD introduces one.
- Only reintroduce backend or sync infrastructure through a new PRD.
