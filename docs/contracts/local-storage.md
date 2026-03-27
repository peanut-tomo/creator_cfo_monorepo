# Local Storage Contract

## Structured Database

- Database name: `creator-cfo-local.db`
- Current contract version: `1`
- Tables:
  - `income_snapshots`
  - `invoice_records`
  - `expense_records`
  - `tax_forecasts`
  - `cash_flow_snapshots`

## File Vault

- Root directory: `creator-cfo-vault`
- Collections:
  - `receipts`
  - `invoice_exports`
  - `statements`
  - `tax_support`

## Device State Store

- Storage engine: `AsyncStorage`
- Namespace: `@creator-cfo/mobile`
- Current contract version: `1`
- Records:
  - `theme_preference`: `"system" | "light" | "dark"`
  - `locale_preference`: `"system" | "en" | "zh-CN"`
  - `auth_session`: `{ kind: "guest" | "apple"; appleUserId?: string; email?: string | null; displayName?: string | null }`

## Invariants

- The mobile app must be able to bootstrap both the database and the vault without any backend dependency.
- Theme, locale, and login session state remain device-local and must be represented in the storage contract before UI flows persist them.
- Contract updates require a matching test update in `packages/storage/tests/`.
- Any migration that changes table shape or vault conventions must update this document in the same change.
