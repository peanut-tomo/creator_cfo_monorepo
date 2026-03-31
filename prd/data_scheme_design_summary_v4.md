# Data Scheme Design Summary (Current Version 4)

## Scope

This summarizes the current local-first data scheme implemented in `packages/storage/src/contracts.ts`.

- Storage contract version: `4`
- Database: `creator-cfo-local.db`
- Core principle: keep `records` as the canonical operational ledger, and add tax projection layers beside it.

---

## 1. Core Tables And Parameter Explanations

### 1.1 `entities`

- `entity_id`: stable primary key for one legal reporting unit.
- `legal_name`: legal business name used in forms and reports.
- `entity_type`: legal type (for example sole proprietorship, LLC).
- `base_currency`: default reporting currency.
- `default_timezone`: timezone used for local date interpretation.
- `created_at`: creation timestamp.

### 1.2 `accounts`

- `account_id`: primary key for chart-of-accounts row.
- `entity_id`: owner entity of this account.
- `account_code`: deterministic account code per entity.
- `account_name`: human-readable account label.
- `account_type`: accounting class (`asset`, `liability`, `equity`, `income`, `expense`).
- `normal_balance`: normal sign side (`debit` or `credit`).
- `is_active`: active/inactive marker.
- `created_at`: creation timestamp.

### 1.3 `counterparties`

- `counterparty_id`: primary key.
- `entity_id`: owner entity.
- `counterparty_type`: vendor/client/platform/bank/etc.
- `legal_name`: official legal name.
- `display_name`: user-facing short name.
- `tax_id_masked`: masked identifier if stored.
- `notes`: free notes.
- `created_at`: creation timestamp.

### 1.4 `platform_accounts`

- `platform_account_id`: primary key.
- `entity_id`: owner entity.
- `platform_code`: platform identifier (for example YouTube, TikTok).
- `account_label`: internal label for the platform account.
- `external_account_ref`: external platform ID.
- `active_from`: start date for account usage.
- `active_to`: end date for account usage.
- `created_at`: creation timestamp.

### 1.5 `records` (canonical ledger)

- `record_id`: primary key for one finance event.
- `entity_id`: owning entity.
- `record_kind`: business meaning (income, expense, transfer, owner draw, etc.).
- `posting_pattern`: posting logic profile for derived accounting lines.
- `record_status`: lifecycle status (posted/reconciled/draft/etc.).
- `source_system`: ingestion/source marker.
- `counterparty_id`: optional linked counterparty.
- `platform_account_id`: optional linked platform account.
- `related_record_id`: optional link to parent/sibling record.
- `related_record_role`: meaning of the relationship.
- `external_reference`: external system reference.
- `invoice_number`: invoice number when relevant.
- `description`: required operational description.
- `memo`: optional free memo.
- `category_code`: category tag.
- `subcategory_code`: subcategory tag.
- `payment_method_code`: payment method classification.
- `evidence_status`: evidence state (`pending`, `attached`, etc.).
- `recognition_on`: accrual recognition date.
- `cash_on`: cash-basis date.
- `due_on`: due date for open items.
- `service_period_start_on`: service period start.
- `service_period_end_on`: service period end.
- `currency`: transaction currency.
- `primary_amount_cents`: primary amount in minor units.
- `gross_amount_cents`: gross amount in minor units.
- `fee_amount_cents`: fee component in minor units.
- `withholding_amount_cents`: withholding component in minor units.
- `other_adjustment_amount_cents`: other adjustment component.
- `net_cash_amount_cents`: net cash component.
- `business_use_bps`: business-use ratio in basis points.
- `tax_category_code`: tax category marker.
- `tax_line_code`: mapped tax line code for direct tax rollups.
- `is_capitalizable`: capitalization flag.
- `placed_in_service_on`: placed-in-service date.
- `primary_account_id`: primary posting account.
- `cash_account_id`: cash posting account.
- `fee_account_id`: fee posting account.
- `withholding_account_id`: withholding posting account.
- `adjustment_account_id`: adjustment posting account.
- `offset_account_id`: offset posting account.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

### 1.6 `record_entry_classifications`

- `record_id`: one-to-one key to `records`.
- `entry_mode`: input mode (`standard_receipt`, `advanced`, `legacy`).
- `user_classification`: user intent (`income`, `expense`, `personal_spending`, `other`).
- `classification_status`: resolver state.
- `resolver_code`: machine resolver result code.
- `resolver_note`: resolver explanation.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

### 1.7 `tax_year_profiles`

- `entity_id`: owner entity.
- `tax_year`: calendar tax year.
- `accounting_method`: tax accounting method (`cash` supported locally).
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

### 1.8 `tax_line_definitions` (new in v4)

- `line_key`: stable unique line identity (`schedule_c.line31`, `form_1040.line23`).
- `form_code`: root form code (`1040`).
- `schedule_code`: subform/schedule identity.
- `line_code`: printed line code token.
- `line_label`: human-readable line name.
- `line_kind`: value shape (`amount`, `checkbox`, `text`).
- `value_type`: stored value type (`amount_cents`, `boolean`, `text`).
- `availability_model`: sourcing model (`record_rollup`, `formula`, `input_only`, `manual_only`).
- `source_kind`: source family (`record`, `formula`, `input`, `none`).
- `display_order`: deterministic ordering for UI/report exports.
- `supports_record_trace`: whether direct record trace is expected.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

### 1.9 `tax_line_inputs` (new in v4)

- `entity_id`: owner entity.
- `tax_year`: tax year.
- `line_key`: target line in `tax_line_definitions`.
- `input_status`: input state (`provided`, `not_applicable`).
- `amount_cents`: numeric input for amount lines.
- `boolean_value`: checkbox input.
- `text_value`: text input.
- `note`: supporting note.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

### 1.10 `evidences`

- `evidence_id`: primary key for logical evidence object.
- `entity_id`: owner entity.
- `evidence_kind`: document class.
- `title`: evidence title.
- `source_system`: source marker.
- `issuer_name`: issuing party.
- `document_number`: optional document number.
- `issue_on`: issue date.
- `coverage_start_on`: coverage start date.
- `coverage_end_on`: coverage end date.
- `total_amount_cents`: optional total amount.
- `currency`: evidence currency.
- `notes`: free notes.
- `created_at`: creation timestamp.

### 1.11 `evidence_files`

- `evidence_file_id`: primary key.
- `evidence_id`: parent evidence.
- `vault_collection`: file-vault collection name.
- `relative_path`: vault-relative storage path.
- `original_file_name`: original filename.
- `archived_file_name`: normalized archived filename.
- `mime_type`: MIME type.
- `size_bytes`: file size.
- `sha256_hex`: content hash.
- `captured_at`: file capture timestamp.
- `is_primary`: primary file flag.

### 1.12 `record_evidence_links`

- `record_id`: linked record.
- `evidence_id`: linked evidence.
- `link_role`: relationship role.
- `page_from`: start page for evidence coverage.
- `page_to`: end page for evidence coverage.
- `line_ref`: line-level reference.
- `amount_supported_cents`: supported amount by this evidence.
- `coverage_start_on`: coverage start date.
- `coverage_end_on`: coverage end date.
- `is_primary`: primary link flag for this record.
- `notes`: free notes.
- `created_at`: creation timestamp.

---

## 2. Derived Views And Output Parameters

### 2.1 `record_double_entry_lines_v`

Purpose: expands each record into debit/credit posting lines.

Output parameters:

- `record_id`
- `line_no`
- `posting_on`
- `account_id`
- `account_role`
- `debit_amount_cents`
- `credit_amount_cents`
- `currency`
- `description`

### 2.2 `accounting_posting_lines_v`

Purpose: canonical accounting-reporting surface for postable records.

Output parameters include:

- record identity/status dimensions (`entity_id`, `record_id`, `record_kind`, `record_status`, etc.)
- posting dimensions (`posting_on`, `line_no`, `account_id`, `account_code`, `account_type`, etc.)
- amounts (`debit_amount_cents`, `credit_amount_cents`, `net_amount_cents`)
- reporting-normalized amount (`normalized_balance_delta_cents`)
- `statement_section` (`balance_sheet` or `profit_and_loss`)

### 2.3 Compatibility views

- `income_snapshots_v`: grouped payout-like income projections.
- `invoice_records_v`: invoice-centric compatibility projection.
- `expense_records_v`: expense-centric compatibility projection.

### 2.4 `tax_line_scopes_v` (new)

Purpose: derive all available `(entity_id, tax_year)` scopes from ledger, tax profile, and tax input rows.

Output parameters:

- `entity_id`
- `tax_year`

### 2.5 `tax_line_record_contributions_v` (new)

Purpose: one row per record contribution attempt for line rollups.

Output parameters:

- scope and identity: `entity_id`, `tax_year`, `line_key`, `record_id`
- contribution state: `contribution_status` (`direct` or `review_required`)
- value and currency: `contribution_amount_cents`, `currency`
- review fields: `blocking_code`, `blocking_note`
- dates: `cash_on`, `recognition_on`

### 2.6 `tax_line_record_rollups_v` (new)

Purpose: aggregate contribution rows to one line-level rollup row.

Output parameters:

- `entity_id`, `tax_year`, `line_key`
- `amount_cents`
- `matched_record_count`
- `matched_record_ids_csv`
- `review_record_count`
- `review_codes_csv`
- `source_note`

### 2.7 `tax_lines_v` (new unified surface)

Purpose: normalized line surface for filtered tax reads.

Output parameters:

- line identity: `entity_id`, `tax_year`, `form_code`, `schedule_code`, `line_key`, `line_code`, `line_label`, `line_kind`
- status/source: `line_status`, `source_kind`
- values: `amount_cents`, `boolean_value`, `text_value`, `currency`
- trace summary: `matched_record_count`, `matched_record_ids_csv`, `blocking_codes_csv`
- explanation: `source_note`

Status semantics:

- `direct`: authoritative from records or explicit input rows.
- `derived`: formula-derived from upstream rows.
- `review_required`: dependencies or mapped records block authority.
- `manual_required`: no authoritative source yet.

---

## 3. Indexes And Why They Exist

- `accounts_entity_code_idx`: enforce unique account code per entity.
- `records_entity_recognition_idx`: recognition-date timeline reads.
- `records_status_due_idx`: due/status queries.
- `records_platform_idx`: platform account timeline reads.
- `records_entity_cash_status_idx`: tax-year scoped cash-basis reads.
- `records_entity_tax_line_cash_status_idx`: tax-line filtered scoped reads (new).
- `evidence_files_sha_idx`: dedupe evidence files by content.
- `record_evidence_primary_idx`: fast primary evidence lookup per record.

---

## 4. Maintenance Statements (Migration/Backfill Behavior)

Current maintenance includes:

- legacy backfill into `record_entry_classifications` from `records`.
- idempotent seed insert into `tax_line_definitions`.
- idempotent correction from `line27a` fallback rows to `line27b` for `schedule-c-other-expense`.
- resolver metadata update from `expense_line27a_default` to `expense_line27b_default`.

---

## 5. Practical Read Pattern

For one entity and year:

1. read `tax_lines_v` with filters (`entity_id`, `tax_year`, optional `form/schedule/line/status`).
2. if needed, read `tax_line_record_contributions_v` for detailed trace rows.
3. fill missing non-ledger dependencies in `tax_line_inputs`.
4. re-query `tax_lines_v` and verify status transitions from `manual_required`/`review_required` toward `direct`/`derived`.
