export interface StructuredTableContract {
  name: string;
  summary: string;
  createStatement: string;
}

export interface StructuredViewContract {
  name: string;
  summary: string;
  createStatement: string;
}

export interface StructuredIndexContract {
  name: string;
  summary: string;
  createStatement: string;
}

export interface FileVaultCollectionContract {
  slug: string;
  title: string;
  summary: string;
  defaultExtension: string;
}

export interface KeyValueRecordContract {
  key: string;
  summary: string;
  valueShape: string;
}

export interface LocalStorageOverview {
  collectionCount: number;
  indexCount: number;
  tableCount: number;
  viewCount: number;
}

export interface LocalStorageBootstrapManifestFileCollection extends FileVaultCollectionContract {
  samplePath: string;
}

export interface LocalStorageBootstrapManifest {
  databaseName: string;
  fileCollections: LocalStorageBootstrapManifestFileCollection[];
  schemaObjects: {
    indexes: string[];
    tables: string[];
    views: string[];
  };
  version: number;
}

export interface LocalStorageBootstrapPlan {
  databaseName: string;
  fileCollections: readonly FileVaultCollectionContract[];
  fileVaultRoot: string;
  maintenanceStatements: readonly string[];
  overview: LocalStorageOverview;
  pragmas: readonly string[];
  schemaStatements: readonly string[];
  structuredIndexes: readonly StructuredIndexContract[];
  structuredTables: readonly StructuredTableContract[];
  structuredViews: readonly StructuredViewContract[];
  version: number;
}

const structuredStorePragmas = ["PRAGMA journal_mode = WAL;", "PRAGMA foreign_keys = ON;"] as const;

export const accountingPostableRecordStatuses = ["posted", "reconciled"] as const;
export type AccountingPostableRecordStatus = (typeof accountingPostableRecordStatuses)[number];

export const accountingReportAccountTypes = [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
] as const;
export type AccountingReportAccountType = (typeof accountingReportAccountTypes)[number];

export const accountingStatementSections = ["balance_sheet", "profit_and_loss"] as const;
export type AccountingStatementSection = (typeof accountingStatementSections)[number];

export const accountingStatementSectionsByAccountType = {
  asset: "balance_sheet",
  liability: "balance_sheet",
  equity: "balance_sheet",
  income: "profit_and_loss",
  expense: "profit_and_loss",
} as const satisfies Record<AccountingReportAccountType, AccountingStatementSection>;

const accountingPostableRecordStatusSqlList = accountingPostableRecordStatuses
  .map((status) => `'${status}'`)
  .join(", ");

const structuredTables = [
  {
    name: "entities",
    summary: "Legal owners or reporting units for the books stored on-device.",
    createStatement: `CREATE TABLE IF NOT EXISTS entities (
      entity_id TEXT PRIMARY KEY NOT NULL,
      legal_name TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      base_currency TEXT NOT NULL,
      default_timezone TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,
  },
  {
    name: "accounts",
    summary: "Chart of accounts used by derived double-entry and finance reporting views.",
    createStatement: `CREATE TABLE IF NOT EXISTS accounts (
      account_id TEXT PRIMARY KEY NOT NULL,
      entity_id TEXT NOT NULL,
      account_code TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      normal_balance TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
    );`,
  },
  {
    name: "counterparties",
    summary: "Platforms, clients, vendors, banks, owners, and tax agencies tied to records.",
    createStatement: `CREATE TABLE IF NOT EXISTS counterparties (
      counterparty_id TEXT PRIMARY KEY NOT NULL,
      entity_id TEXT NOT NULL,
      counterparty_type TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      display_name TEXT,
      tax_id_masked TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
    );`,
  },
  {
    name: "platform_accounts",
    summary: "Creator platform identities used for payout and revenue aggregation.",
    createStatement: `CREATE TABLE IF NOT EXISTS platform_accounts (
      platform_account_id TEXT PRIMARY KEY NOT NULL,
      entity_id TEXT NOT NULL,
      platform_code TEXT NOT NULL,
      account_label TEXT NOT NULL,
      external_account_ref TEXT,
      active_from TEXT,
      active_to TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
    );`,
  },
  {
    name: "records",
    summary: "Operational finance events used as the canonical local-first source of truth.",
    createStatement: `CREATE TABLE IF NOT EXISTS records (
      record_id TEXT PRIMARY KEY NOT NULL,
      entity_id TEXT NOT NULL,
      record_kind TEXT NOT NULL,
      posting_pattern TEXT NOT NULL,
      record_status TEXT NOT NULL,
      source_system TEXT NOT NULL,
      counterparty_id TEXT,
      platform_account_id TEXT,
      related_record_id TEXT,
      related_record_role TEXT,
      external_reference TEXT,
      invoice_number TEXT,
      description TEXT NOT NULL,
      memo TEXT,
      category_code TEXT,
      subcategory_code TEXT,
      payment_method_code TEXT,
      evidence_status TEXT NOT NULL DEFAULT 'pending',
      recognition_on TEXT NOT NULL,
      cash_on TEXT,
      due_on TEXT,
      service_period_start_on TEXT,
      service_period_end_on TEXT,
      currency TEXT NOT NULL,
      primary_amount_cents INTEGER NOT NULL DEFAULT 0,
      gross_amount_cents INTEGER NOT NULL DEFAULT 0,
      fee_amount_cents INTEGER NOT NULL DEFAULT 0,
      withholding_amount_cents INTEGER NOT NULL DEFAULT 0,
      other_adjustment_amount_cents INTEGER NOT NULL DEFAULT 0,
      net_cash_amount_cents INTEGER NOT NULL DEFAULT 0,
      business_use_bps INTEGER NOT NULL DEFAULT 10000,
      tax_category_code TEXT,
      tax_line_code TEXT,
      is_capitalizable INTEGER NOT NULL DEFAULT 0,
      placed_in_service_on TEXT,
      primary_account_id TEXT,
      cash_account_id TEXT,
      fee_account_id TEXT,
      withholding_account_id TEXT,
      adjustment_account_id TEXT,
      offset_account_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id),
      FOREIGN KEY (counterparty_id) REFERENCES counterparties(counterparty_id),
      FOREIGN KEY (platform_account_id) REFERENCES platform_accounts(platform_account_id),
      FOREIGN KEY (related_record_id) REFERENCES records(record_id),
      FOREIGN KEY (primary_account_id) REFERENCES accounts(account_id),
      FOREIGN KEY (cash_account_id) REFERENCES accounts(account_id),
      FOREIGN KEY (fee_account_id) REFERENCES accounts(account_id),
      FOREIGN KEY (withholding_account_id) REFERENCES accounts(account_id),
      FOREIGN KEY (adjustment_account_id) REFERENCES accounts(account_id),
      FOREIGN KEY (offset_account_id) REFERENCES accounts(account_id)
    );`,
  },
  {
    name: "record_entry_classifications",
    summary:
      "User-facing simplified-entry classifications resolved beside the canonical records table.",
    createStatement: `CREATE TABLE IF NOT EXISTS record_entry_classifications (
      record_id TEXT PRIMARY KEY NOT NULL,
      entry_mode TEXT NOT NULL,
      user_classification TEXT NOT NULL,
      classification_status TEXT NOT NULL,
      resolver_code TEXT,
      resolver_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (record_id) REFERENCES records(record_id) ON DELETE CASCADE
    );`,
  },
  {
    name: "tax_year_profiles",
    summary: "Entity and tax-year settings that scope local tax-form reads outside the ledger rows.",
    createStatement: `CREATE TABLE IF NOT EXISTS tax_year_profiles (
      entity_id TEXT NOT NULL,
      tax_year INTEGER NOT NULL,
      accounting_method TEXT NOT NULL DEFAULT 'cash',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (entity_id, tax_year),
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
    );`,
  },
  {
    name: "tax_line_definitions",
    summary: "Seeded registry of supported tax lines across Form 1040, Schedule C, Schedule SE, and carry-through schedules.",
    createStatement: `CREATE TABLE IF NOT EXISTS tax_line_definitions (
      line_key TEXT PRIMARY KEY NOT NULL,
      form_code TEXT NOT NULL,
      schedule_code TEXT NOT NULL,
      line_code TEXT NOT NULL,
      line_label TEXT NOT NULL,
      line_kind TEXT NOT NULL,
      value_type TEXT NOT NULL,
      availability_model TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      supports_record_trace INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
  },
  {
    name: "tax_line_inputs",
    summary: "Entity-year line-shaped non-ledger tax inputs used by formulas and manual dependency rows.",
    createStatement: `CREATE TABLE IF NOT EXISTS tax_line_inputs (
      entity_id TEXT NOT NULL,
      tax_year INTEGER NOT NULL,
      line_key TEXT NOT NULL,
      input_status TEXT NOT NULL,
      amount_cents INTEGER,
      boolean_value INTEGER,
      text_value TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (entity_id, tax_year, line_key),
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id),
      FOREIGN KEY (line_key) REFERENCES tax_line_definitions(line_key)
    );`,
  },
  {
    name: "evidences",
    summary: "Logical evidence documents that can support one or many records.",
    createStatement: `CREATE TABLE IF NOT EXISTS evidences (
      evidence_id TEXT PRIMARY KEY NOT NULL,
      entity_id TEXT NOT NULL,
      evidence_kind TEXT NOT NULL,
      title TEXT NOT NULL,
      source_system TEXT NOT NULL,
      issuer_name TEXT,
      document_number TEXT,
      issue_on TEXT,
      coverage_start_on TEXT,
      coverage_end_on TEXT,
      total_amount_cents INTEGER,
      currency TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
    );`,
  },
  {
    name: "evidence_files",
    summary: "Physical file metadata for evidence objects stored in the local vault.",
    createStatement: `CREATE TABLE IF NOT EXISTS evidence_files (
      evidence_file_id TEXT PRIMARY KEY NOT NULL,
      evidence_id TEXT NOT NULL,
      vault_collection TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      original_file_name TEXT NOT NULL,
      archived_file_name TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER,
      sha256_hex TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      is_primary INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (evidence_id) REFERENCES evidences(evidence_id)
    );`,
  },
  {
    name: "record_evidence_links",
    summary: "Many-to-many linkage between records and evidence with line or page coverage metadata.",
    createStatement: `CREATE TABLE IF NOT EXISTS record_evidence_links (
      record_id TEXT NOT NULL,
      evidence_id TEXT NOT NULL,
      link_role TEXT NOT NULL,
      page_from INTEGER,
      page_to INTEGER,
      line_ref TEXT,
      amount_supported_cents INTEGER,
      coverage_start_on TEXT,
      coverage_end_on TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (record_id, evidence_id, link_role),
      FOREIGN KEY (record_id) REFERENCES records(record_id),
      FOREIGN KEY (evidence_id) REFERENCES evidences(evidence_id)
    );`,
  },
] as const satisfies readonly StructuredTableContract[];

const structuredViews = [
  {
    name: "record_double_entry_lines_v",
    summary: "Derived debit and credit lines expanded from records by posting pattern.",
    createStatement: `CREATE VIEW IF NOT EXISTS record_double_entry_lines_v AS
      SELECT
        record_id,
        10 AS line_no,
        recognition_on AS posting_on,
        cash_account_id AS account_id,
        'cash' AS account_role,
        net_cash_amount_cents AS debit_amount_cents,
        0 AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'gross_to_net_income'
        AND net_cash_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        20 AS line_no,
        recognition_on AS posting_on,
        fee_account_id AS account_id,
        'fee' AS account_role,
        fee_amount_cents AS debit_amount_cents,
        0 AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'gross_to_net_income'
        AND fee_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        30 AS line_no,
        recognition_on AS posting_on,
        withholding_account_id AS account_id,
        'withholding' AS account_role,
        withholding_amount_cents AS debit_amount_cents,
        0 AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'gross_to_net_income'
        AND withholding_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        CASE WHEN other_adjustment_amount_cents > 0 THEN 40 ELSE 41 END AS line_no,
        recognition_on AS posting_on,
        adjustment_account_id AS account_id,
        'adjustment' AS account_role,
        CASE WHEN other_adjustment_amount_cents > 0 THEN other_adjustment_amount_cents ELSE 0 END AS debit_amount_cents,
        CASE WHEN other_adjustment_amount_cents < 0 THEN ABS(other_adjustment_amount_cents) ELSE 0 END AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'gross_to_net_income'
        AND other_adjustment_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        90 AS line_no,
        recognition_on AS posting_on,
        primary_account_id AS account_id,
        'primary' AS account_role,
        0 AS debit_amount_cents,
        gross_amount_cents AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'gross_to_net_income'
        AND gross_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        10 AS line_no,
        recognition_on AS posting_on,
        primary_account_id AS account_id,
        'primary' AS account_role,
        primary_amount_cents AS debit_amount_cents,
        0 AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern IN ('simple_expense', 'asset_purchase')
        AND primary_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        90 AS line_no,
        recognition_on AS posting_on,
        COALESCE(offset_account_id, cash_account_id) AS account_id,
        'offset' AS account_role,
        0 AS debit_amount_cents,
        primary_amount_cents AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern IN ('simple_expense', 'asset_purchase')
        AND primary_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        10 AS line_no,
        recognition_on AS posting_on,
        primary_account_id AS account_id,
        'destination' AS account_role,
        primary_amount_cents AS debit_amount_cents,
        0 AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'transfer'
        AND primary_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        90 AS line_no,
        recognition_on AS posting_on,
        offset_account_id AS account_id,
        'source' AS account_role,
        0 AS debit_amount_cents,
        primary_amount_cents AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'transfer'
        AND primary_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        10 AS line_no,
        recognition_on AS posting_on,
        cash_account_id AS account_id,
        'cash' AS account_role,
        primary_amount_cents AS debit_amount_cents,
        0 AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'owner_contribution'
        AND primary_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        90 AS line_no,
        recognition_on AS posting_on,
        primary_account_id AS account_id,
        'equity' AS account_role,
        0 AS debit_amount_cents,
        primary_amount_cents AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'owner_contribution'
        AND primary_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        10 AS line_no,
        recognition_on AS posting_on,
        primary_account_id AS account_id,
        'equity' AS account_role,
        primary_amount_cents AS debit_amount_cents,
        0 AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'owner_draw'
        AND primary_amount_cents <> 0
      UNION ALL
      SELECT
        record_id,
        90 AS line_no,
        recognition_on AS posting_on,
        cash_account_id AS account_id,
        'cash' AS account_role,
        0 AS debit_amount_cents,
        primary_amount_cents AS credit_amount_cents,
        currency,
        description
      FROM records
      WHERE posting_pattern = 'owner_draw'
        AND primary_amount_cents <> 0;`,
  },
  {
    name: "accounting_posting_lines_v",
    summary:
      "Canonical accounting-reporting surface for postable record lines with account semantics.",
    createStatement: `CREATE VIEW IF NOT EXISTS accounting_posting_lines_v AS
      SELECT
        records.entity_id,
        records.record_id,
        records.record_kind,
        records.posting_pattern,
        records.record_status,
        records.source_system,
        records.counterparty_id,
        records.platform_account_id,
        lines.posting_on,
        lines.line_no,
        lines.account_id,
        accounts.account_code,
        accounts.account_name,
        accounts.account_type,
        accounts.normal_balance,
        CASE
          WHEN accounts.account_type IN ('asset', 'liability', 'equity') THEN 'balance_sheet'
          WHEN accounts.account_type IN ('income', 'expense') THEN 'profit_and_loss'
          ELSE 'unclassified'
        END AS statement_section,
        lines.account_role,
        lines.debit_amount_cents,
        lines.credit_amount_cents,
        lines.debit_amount_cents - lines.credit_amount_cents AS net_amount_cents,
        CASE
          WHEN accounts.normal_balance = 'debit'
            THEN lines.debit_amount_cents - lines.credit_amount_cents
          ELSE lines.credit_amount_cents - lines.debit_amount_cents
        END AS normalized_balance_delta_cents,
        lines.currency,
        lines.description
      FROM record_double_entry_lines_v AS lines
      INNER JOIN records ON records.record_id = lines.record_id
      INNER JOIN accounts ON accounts.account_id = lines.account_id
      WHERE records.record_status IN (${accountingPostableRecordStatusSqlList});`,
  },
  {
    name: "income_snapshots_v",
    summary: "Compatibility view for grouped income snapshots derived from records.",
    createStatement: `CREATE VIEW IF NOT EXISTS income_snapshots_v AS
      SELECT
        entity_id,
        COALESCE(platform_account_id, 'unassigned') AS platform_account_id,
        currency AS payout_currency,
        SUBSTR(COALESCE(cash_on, recognition_on), 1, 7) AS payout_window,
        SUM(gross_amount_cents) AS gross_amount_cents,
        COUNT(*) AS record_count,
        MAX(updated_at) AS captured_at
      FROM records
      WHERE record_kind IN ('income', 'invoice_payment', 'platform_payout')
      GROUP BY
        entity_id,
        COALESCE(platform_account_id, 'unassigned'),
        currency,
        SUBSTR(COALESCE(cash_on, recognition_on), 1, 7);`,
  },
  {
    name: "invoice_records_v",
    summary: "Compatibility view for invoice-focused record projections.",
    createStatement: `CREATE VIEW IF NOT EXISTS invoice_records_v AS
      SELECT
        record_id AS id,
        entity_id,
        counterparty_id,
        invoice_number,
        description,
        primary_amount_cents AS amount_cents,
        currency,
        record_status AS status,
        due_on,
        cash_on AS paid_on
      FROM records
      WHERE record_kind IN ('invoice', 'receivable', 'invoice_payment');`,
  },
  {
    name: "expense_records_v",
    summary: "Compatibility view for expense-focused record projections.",
    createStatement: `CREATE VIEW IF NOT EXISTS expense_records_v AS
      SELECT
        record_id AS id,
        entity_id,
        counterparty_id,
        category_code AS category,
        subcategory_code AS subcategory,
        primary_amount_cents AS amount_cents,
        currency,
        COALESCE(cash_on, recognition_on) AS incurred_on,
        description AS note
      FROM records
      WHERE record_kind IN ('expense', 'asset_purchase', 'reimbursable_expense');`,
  },
  {
    name: "tax_line_scopes_v",
    summary: "Entity-year scopes covered by records, tax-year profiles, or tax-line input rows.",
    createStatement: `CREATE VIEW IF NOT EXISTS tax_line_scopes_v AS
      SELECT DISTINCT
        entity_id,
        tax_year
      FROM (
        SELECT
          records.entity_id,
          CAST(SUBSTR(COALESCE(records.cash_on, records.recognition_on), 1, 4) AS INTEGER) AS tax_year
        FROM records
        WHERE COALESCE(records.cash_on, records.recognition_on) IS NOT NULL
        UNION ALL
        SELECT
          tax_year_profiles.entity_id,
          tax_year_profiles.tax_year
        FROM tax_year_profiles
        UNION ALL
        SELECT
          tax_line_inputs.entity_id,
          tax_line_inputs.tax_year
        FROM tax_line_inputs
      )
      WHERE tax_year BETWEEN 1900 AND 9999;`,
  },
  {
    name: "tax_line_record_contributions_v",
    summary: "Per-record direct and review-required contributions for registry-backed record-rollup lines.",
    createStatement: `CREATE VIEW IF NOT EXISTS tax_line_record_contributions_v AS
      WITH normalized_records AS (
        SELECT
          r.entity_id,
          CAST(SUBSTR(COALESCE(r.cash_on, r.recognition_on), 1, 4) AS INTEGER) AS tax_year,
          r.record_id,
          r.record_kind,
          r.record_status,
          r.cash_on,
          r.recognition_on,
          COALESCE(r.currency, 'USD') AS currency,
          CASE
            WHEN LOWER(TRIM(COALESCE(r.tax_line_code, ''))) = 'line27a' THEN 'line27b'
            ELSE LOWER(TRIM(COALESCE(r.tax_line_code, '')))
          END AS normalized_tax_line_code,
          CASE
            WHEN LOWER(TRIM(COALESCE(r.tax_line_code, ''))) = 'line1'
              THEN ABS(r.gross_amount_cents)
            ELSE ROUND(
              ABS(r.primary_amount_cents) *
              (CASE
                WHEN r.business_use_bps IS NULL OR r.business_use_bps < 0 THEN 10000
                ELSE r.business_use_bps
              END) / 10000.0
            )
          END AS contribution_amount_cents
        FROM records AS r
        WHERE r.record_status IN (${accountingPostableRecordStatusSqlList})
          AND TRIM(COALESCE(r.tax_line_code, '')) <> ''
          AND COALESCE(r.cash_on, r.recognition_on) IS NOT NULL
      )
      SELECT
        nr.entity_id,
        nr.tax_year,
        td.line_key,
        nr.record_id,
        CASE
          WHEN td.line_key IS NULL THEN 'review_required'
          WHEN nr.cash_on IS NULL OR TRIM(nr.cash_on) = '' THEN 'review_required'
          WHEN UPPER(nr.currency) <> 'USD' THEN 'review_required'
          WHEN td.line_key = 'schedule_c.line1'
            AND nr.record_kind NOT IN ('income', 'invoice_payment', 'platform_payout') THEN 'review_required'
          WHEN td.line_key <> 'schedule_c.line1'
            AND nr.record_kind NOT IN ('expense', 'reimbursable_expense', 'asset_purchase') THEN 'review_required'
          ELSE 'direct'
        END AS contribution_status,
        CASE
          WHEN td.line_key IS NULL THEN NULL
          WHEN nr.cash_on IS NULL OR TRIM(nr.cash_on) = '' THEN NULL
          WHEN UPPER(nr.currency) <> 'USD' THEN NULL
          WHEN td.line_key = 'schedule_c.line1'
            AND nr.record_kind NOT IN ('income', 'invoice_payment', 'platform_payout') THEN NULL
          WHEN td.line_key <> 'schedule_c.line1'
            AND nr.record_kind NOT IN ('expense', 'reimbursable_expense', 'asset_purchase') THEN NULL
          ELSE nr.contribution_amount_cents
        END AS contribution_amount_cents,
        UPPER(nr.currency) AS currency,
        CASE
          WHEN td.line_key IS NULL THEN 'unsupported_tax_line_code'
          WHEN nr.cash_on IS NULL OR TRIM(nr.cash_on) = '' THEN 'missing_cash_on'
          WHEN UPPER(nr.currency) <> 'USD' THEN 'non_usd_currency'
          WHEN td.line_key = 'schedule_c.line1'
            AND nr.record_kind NOT IN ('income', 'invoice_payment', 'platform_payout') THEN 'unsupported_record_kind'
          WHEN td.line_key <> 'schedule_c.line1'
            AND nr.record_kind NOT IN ('expense', 'reimbursable_expense', 'asset_purchase') THEN 'unsupported_record_kind'
          ELSE NULL
        END AS blocking_code,
        CASE
          WHEN td.line_key IS NULL THEN 'Record tax_line_code is not mapped in tax_line_definitions.'
          WHEN nr.cash_on IS NULL OR TRIM(nr.cash_on) = '' THEN 'Record is postable but missing cash_on for cash-basis line reads.'
          WHEN UPPER(nr.currency) <> 'USD' THEN 'Record currency is not USD and no translation table is stored.'
          WHEN td.line_key = 'schedule_c.line1'
            AND nr.record_kind NOT IN ('income', 'invoice_payment', 'platform_payout') THEN 'Mapped line expects an income-like record kind.'
          WHEN td.line_key <> 'schedule_c.line1'
            AND nr.record_kind NOT IN ('expense', 'reimbursable_expense', 'asset_purchase') THEN 'Mapped line expects an expense-like record kind.'
          ELSE 'Authoritative direct record contribution.'
        END AS blocking_note,
        nr.cash_on,
        nr.recognition_on
      FROM normalized_records AS nr
      LEFT JOIN tax_line_definitions AS td
        ON td.line_key = ('schedule_c.' || nr.normalized_tax_line_code)
       AND td.availability_model = 'record_rollup';`,
  },
  {
    name: "tax_line_record_rollups_v",
    summary: "Entity-year-line rollups for direct totals, record trace, and review blockers.",
    createStatement: `CREATE VIEW IF NOT EXISTS tax_line_record_rollups_v AS
      SELECT
        entity_id,
        tax_year,
        line_key,
        SUM(CASE WHEN contribution_status = 'direct' THEN contribution_amount_cents ELSE 0 END) AS amount_cents,
        SUM(CASE WHEN contribution_status = 'direct' THEN 1 ELSE 0 END) AS matched_record_count,
        COALESCE(
          GROUP_CONCAT(CASE WHEN contribution_status = 'direct' THEN record_id ELSE NULL END, ','),
          ''
        ) AS matched_record_ids_csv,
        SUM(CASE WHEN contribution_status = 'review_required' THEN 1 ELSE 0 END) AS review_record_count,
        COALESCE(
          GROUP_CONCAT(CASE WHEN contribution_status = 'review_required' THEN blocking_code ELSE NULL END, ','),
          ''
        ) AS review_codes_csv,
        CASE
          WHEN SUM(CASE WHEN contribution_status = 'review_required' THEN 1 ELSE 0 END) > 0
            THEN 'One or more mapped records require review before this line can be treated as authoritative.'
          WHEN SUM(CASE WHEN contribution_status = 'direct' THEN 1 ELSE 0 END) > 0
            THEN 'Derived directly from postable cash-basis USD records.'
          ELSE 'No direct record contributions available yet.'
        END AS source_note
      FROM tax_line_record_contributions_v
      WHERE line_key IS NOT NULL
      GROUP BY entity_id, tax_year, line_key;`,
  },
    {
    name: 'tax_lines_v',
    summary: 'Normalized tax-line projection surface with direct, derived, review-required, and manual-required statuses.',
    createStatement: `CREATE VIEW IF NOT EXISTS tax_lines_v AS
      WITH base_rows AS (
        SELECT
          s.entity_id,
          s.tax_year,
          d.form_code,
          d.schedule_code,
          d.line_key,
          d.line_code,
          d.line_label,
          d.line_kind,
          d.value_type,
          d.availability_model,
          d.source_kind,
          rr.amount_cents AS record_amount_cents,
          rr.matched_record_count,
          rr.matched_record_ids_csv,
          rr.review_record_count,
          rr.review_codes_csv,
          rr.source_note AS record_source_note,
          ti.input_status,
          ti.amount_cents AS input_amount_cents,
          ti.boolean_value AS input_boolean_value,
          ti.text_value AS input_text_value
        FROM tax_line_scopes_v AS s
        CROSS JOIN tax_line_definitions AS d
        LEFT JOIN tax_line_record_rollups_v AS rr
          ON rr.entity_id = s.entity_id
         AND rr.tax_year = s.tax_year
         AND rr.line_key = d.line_key
        LEFT JOIN tax_line_inputs AS ti
          ON ti.entity_id = s.entity_id
         AND ti.tax_year = s.tax_year
         AND ti.line_key = d.line_key
      ),
      pivots AS (
        SELECT
          entity_id,
          tax_year,
          MAX(CASE WHEN line_key = 'schedule_c.line1' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line1,
          MAX(CASE WHEN line_key = 'schedule_c.line2' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line2,
          MAX(CASE WHEN line_key = 'schedule_c.line6' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line6,
          MAX(CASE WHEN line_key = 'schedule_c.line8' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line8,
          MAX(CASE WHEN line_key = 'schedule_c.line10' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line10,
          MAX(CASE WHEN line_key = 'schedule_c.line11' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line11,
          MAX(CASE WHEN line_key = 'schedule_c.line14' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line14,
          MAX(CASE WHEN line_key = 'schedule_c.line15' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line15,
          MAX(CASE WHEN line_key = 'schedule_c.line16a' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line16a,
          MAX(CASE WHEN line_key = 'schedule_c.line16b' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line16b,
          MAX(CASE WHEN line_key = 'schedule_c.line17' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line17,
          MAX(CASE WHEN line_key = 'schedule_c.line18' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line18,
          MAX(CASE WHEN line_key = 'schedule_c.line19' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line19,
          MAX(CASE WHEN line_key = 'schedule_c.line20a' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line20a,
          MAX(CASE WHEN line_key = 'schedule_c.line20b' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line20b,
          MAX(CASE WHEN line_key = 'schedule_c.line21' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line21,
          MAX(CASE WHEN line_key = 'schedule_c.line22' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line22,
          MAX(CASE WHEN line_key = 'schedule_c.line23' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line23,
          MAX(CASE WHEN line_key = 'schedule_c.line24a' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line24a,
          MAX(CASE WHEN line_key = 'schedule_c.line25' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line25,
          MAX(CASE WHEN line_key = 'schedule_c.line26' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line26,
          MAX(CASE WHEN line_key = 'schedule_c.line27b' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line27b,
          MAX(CASE WHEN line_key = 'schedule_c.line30' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line30,
          MAX(CASE WHEN line_key = 'schedule_c.line35' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line35,
          MAX(CASE WHEN line_key = 'schedule_c.line36' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line36,
          MAX(CASE WHEN line_key = 'schedule_c.line37' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line37,
          MAX(CASE WHEN line_key = 'schedule_c.line38' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line38,
          MAX(CASE WHEN line_key = 'schedule_c.line39' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line39,
          MAX(CASE WHEN line_key = 'schedule_c.line41' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS c_line41,
          MAX(CASE WHEN line_key = 'schedule_1.line10' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS s1_line10,
          MAX(CASE WHEN line_key = 'schedule_1.line26' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS s1_line26,
          MAX(CASE WHEN line_key = 'schedule_2.line21' THEN COALESCE(record_amount_cents, input_amount_cents) END) AS s2_line21
        FROM base_rows
        GROUP BY entity_id, tax_year
      ),
      formulas AS (
        SELECT
          entity_id,
          tax_year,
          'schedule_c.line40' AS line_key,
          COALESCE(c_line35, 0) + COALESCE(c_line36, 0) + COALESCE(c_line37, 0) + COALESCE(c_line38, 0) + COALESCE(c_line39, 0) AS amount_cents,
          NULL AS blocking_codes_csv,
          0 AS missing_deps
        FROM pivots
        UNION ALL
        SELECT
          entity_id,
          tax_year,
          'schedule_c.line42' AS line_key,
          (COALESCE(c_line35, 0) + COALESCE(c_line36, 0) + COALESCE(c_line37, 0) + COALESCE(c_line38, 0) + COALESCE(c_line39, 0)) - COALESCE(c_line41, 0) AS amount_cents,
          NULL AS blocking_codes_csv,
          0 AS missing_deps
        FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'schedule_c.line3', COALESCE(c_line1, 0) - COALESCE(c_line2, 0), NULL, CASE WHEN c_line1 IS NULL AND c_line2 IS NULL THEN 1 ELSE 0 END FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'schedule_c.line4', (COALESCE(c_line35, 0) + COALESCE(c_line36, 0) + COALESCE(c_line37, 0) + COALESCE(c_line38, 0) + COALESCE(c_line39, 0)) - COALESCE(c_line41, 0), NULL, 0 FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'schedule_c.line5', (COALESCE(c_line1, 0) - COALESCE(c_line2, 0)) - ((COALESCE(c_line35, 0) + COALESCE(c_line36, 0) + COALESCE(c_line37, 0) + COALESCE(c_line38, 0) + COALESCE(c_line39, 0)) - COALESCE(c_line41, 0)), NULL, 0 FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'schedule_c.line7', ((COALESCE(c_line1, 0) - COALESCE(c_line2, 0)) - ((COALESCE(c_line35, 0) + COALESCE(c_line36, 0) + COALESCE(c_line37, 0) + COALESCE(c_line38, 0) + COALESCE(c_line39, 0)) - COALESCE(c_line41, 0))) + COALESCE(c_line6, 0), NULL, 0 FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'schedule_c.line28', COALESCE(c_line8, 0) + COALESCE(c_line10, 0) + COALESCE(c_line11, 0) + COALESCE(c_line14, 0) + COALESCE(c_line15, 0) + COALESCE(c_line16a, 0) + COALESCE(c_line16b, 0) + COALESCE(c_line17, 0) + COALESCE(c_line18, 0) + COALESCE(c_line19, 0) + COALESCE(c_line20a, 0) + COALESCE(c_line20b, 0) + COALESCE(c_line21, 0) + COALESCE(c_line22, 0) + COALESCE(c_line23, 0) + COALESCE(c_line24a, 0) + COALESCE(c_line25, 0) + COALESCE(c_line26, 0) + COALESCE(c_line27b, 0), NULL, 0 FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'schedule_c.line29', (((COALESCE(c_line1, 0) - COALESCE(c_line2, 0)) - ((COALESCE(c_line35, 0) + COALESCE(c_line36, 0) + COALESCE(c_line37, 0) + COALESCE(c_line38, 0) + COALESCE(c_line39, 0)) - COALESCE(c_line41, 0))) + COALESCE(c_line6, 0)) - (COALESCE(c_line8, 0) + COALESCE(c_line10, 0) + COALESCE(c_line11, 0) + COALESCE(c_line14, 0) + COALESCE(c_line15, 0) + COALESCE(c_line16a, 0) + COALESCE(c_line16b, 0) + COALESCE(c_line17, 0) + COALESCE(c_line18, 0) + COALESCE(c_line19, 0) + COALESCE(c_line20a, 0) + COALESCE(c_line20b, 0) + COALESCE(c_line21, 0) + COALESCE(c_line22, 0) + COALESCE(c_line23, 0) + COALESCE(c_line24a, 0) + COALESCE(c_line25, 0) + COALESCE(c_line26, 0) + COALESCE(c_line27b, 0)), NULL, 0 FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'schedule_c.line31', ((((COALESCE(c_line1, 0) - COALESCE(c_line2, 0)) - ((COALESCE(c_line35, 0) + COALESCE(c_line36, 0) + COALESCE(c_line37, 0) + COALESCE(c_line38, 0) + COALESCE(c_line39, 0)) - COALESCE(c_line41, 0))) + COALESCE(c_line6, 0)) - (COALESCE(c_line8, 0) + COALESCE(c_line10, 0) + COALESCE(c_line11, 0) + COALESCE(c_line14, 0) + COALESCE(c_line15, 0) + COALESCE(c_line16a, 0) + COALESCE(c_line16b, 0) + COALESCE(c_line17, 0) + COALESCE(c_line18, 0) + COALESCE(c_line19, 0) + COALESCE(c_line20a, 0) + COALESCE(c_line20b, 0) + COALESCE(c_line21, 0) + COALESCE(c_line22, 0) + COALESCE(c_line23, 0) + COALESCE(c_line24a, 0) + COALESCE(c_line25, 0) + COALESCE(c_line26, 0) + COALESCE(c_line27b, 0))) - COALESCE(c_line30, 0), CASE WHEN c_line30 IS NULL THEN 'missing_input:schedule_c.line30' ELSE NULL END, CASE WHEN c_line30 IS NULL THEN 1 ELSE 0 END FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'schedule_se.line2', ((((COALESCE(c_line1, 0) - COALESCE(c_line2, 0)) - ((COALESCE(c_line35, 0) + COALESCE(c_line36, 0) + COALESCE(c_line37, 0) + COALESCE(c_line38, 0) + COALESCE(c_line39, 0)) - COALESCE(c_line41, 0))) + COALESCE(c_line6, 0)) - (COALESCE(c_line8, 0) + COALESCE(c_line10, 0) + COALESCE(c_line11, 0) + COALESCE(c_line14, 0) + COALESCE(c_line15, 0) + COALESCE(c_line16a, 0) + COALESCE(c_line16b, 0) + COALESCE(c_line17, 0) + COALESCE(c_line18, 0) + COALESCE(c_line19, 0) + COALESCE(c_line20a, 0) + COALESCE(c_line20b, 0) + COALESCE(c_line21, 0) + COALESCE(c_line22, 0) + COALESCE(c_line23, 0) + COALESCE(c_line24a, 0) + COALESCE(c_line25, 0) + COALESCE(c_line26, 0) + COALESCE(c_line27b, 0))) - COALESCE(c_line30, 0), CASE WHEN c_line30 IS NULL THEN 'missing_input:schedule_c.line30' ELSE NULL END, CASE WHEN c_line30 IS NULL THEN 1 ELSE 0 END FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'schedule_1.line3', ((((COALESCE(c_line1, 0) - COALESCE(c_line2, 0)) - ((COALESCE(c_line35, 0) + COALESCE(c_line36, 0) + COALESCE(c_line37, 0) + COALESCE(c_line38, 0) + COALESCE(c_line39, 0)) - COALESCE(c_line41, 0))) + COALESCE(c_line6, 0)) - (COALESCE(c_line8, 0) + COALESCE(c_line10, 0) + COALESCE(c_line11, 0) + COALESCE(c_line14, 0) + COALESCE(c_line15, 0) + COALESCE(c_line16a, 0) + COALESCE(c_line16b, 0) + COALESCE(c_line17, 0) + COALESCE(c_line18, 0) + COALESCE(c_line19, 0) + COALESCE(c_line20a, 0) + COALESCE(c_line20b, 0) + COALESCE(c_line21, 0) + COALESCE(c_line22, 0) + COALESCE(c_line23, 0) + COALESCE(c_line24a, 0) + COALESCE(c_line25, 0) + COALESCE(c_line26, 0) + COALESCE(c_line27b, 0))) - COALESCE(c_line30, 0), CASE WHEN c_line30 IS NULL THEN 'missing_input:schedule_c.line30' ELSE NULL END, CASE WHEN c_line30 IS NULL THEN 1 ELSE 0 END FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'form_1040.line8', s1_line10, CASE WHEN s1_line10 IS NULL THEN 'missing_input:schedule_1.line10' ELSE NULL END, CASE WHEN s1_line10 IS NULL THEN 1 ELSE 0 END FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'form_1040.line10', s1_line26, CASE WHEN s1_line26 IS NULL THEN 'missing_input:schedule_1.line26' ELSE NULL END, CASE WHEN s1_line26 IS NULL THEN 1 ELSE 0 END FROM pivots
        UNION ALL
        SELECT entity_id, tax_year, 'form_1040.line23', s2_line21, CASE WHEN s2_line21 IS NULL THEN 'missing_input:schedule_2.line21' ELSE NULL END, CASE WHEN s2_line21 IS NULL THEN 1 ELSE 0 END FROM pivots
      )
      SELECT
        b.entity_id,
        b.tax_year,
        b.form_code,
        b.schedule_code,
        b.line_key,
        b.line_code,
        b.line_label,
        b.line_kind,
        CASE
          WHEN b.availability_model = 'record_rollup' AND COALESCE(b.review_record_count, 0) > 0 THEN 'review_required'
          WHEN b.availability_model = 'record_rollup' AND b.record_amount_cents IS NOT NULL THEN 'direct'
          WHEN b.availability_model = 'formula' AND COALESCE(f.missing_deps, 0) > 0 THEN 'review_required'
          WHEN b.availability_model = 'formula' AND f.amount_cents IS NOT NULL THEN 'derived'
          WHEN b.availability_model = 'input_only' AND b.input_status IN ('provided', 'not_applicable') THEN 'direct'
          ELSE 'manual_required'
        END AS line_status,
        b.source_kind,
        CASE
          WHEN b.availability_model = 'record_rollup' THEN b.record_amount_cents
          WHEN b.availability_model = 'formula' THEN f.amount_cents
          WHEN b.availability_model = 'input_only' THEN b.input_amount_cents
          ELSE NULL
        END AS amount_cents,
        CASE WHEN b.availability_model = 'input_only' THEN b.input_boolean_value ELSE NULL END AS boolean_value,
        CASE WHEN b.availability_model = 'input_only' THEN b.input_text_value ELSE NULL END AS text_value,
        CASE
          WHEN (b.availability_model = 'record_rollup' AND b.record_amount_cents IS NOT NULL)
            OR (b.availability_model = 'formula' AND f.amount_cents IS NOT NULL)
            OR (b.availability_model = 'input_only' AND b.input_amount_cents IS NOT NULL)
            THEN 'USD'
          ELSE NULL
        END AS currency,
        COALESCE(b.matched_record_count, 0) AS matched_record_count,
        COALESCE(b.matched_record_ids_csv, '') AS matched_record_ids_csv,
        CASE
          WHEN b.availability_model = 'record_rollup' THEN COALESCE(b.review_codes_csv, '')
          WHEN b.availability_model = 'formula' THEN COALESCE(f.blocking_codes_csv, '')
          ELSE ''
        END AS blocking_codes_csv,
        CASE
          WHEN b.availability_model = 'record_rollup' THEN COALESCE(b.record_source_note, 'No record rollup source note available.')
          WHEN b.availability_model = 'formula' AND COALESCE(f.missing_deps, 0) > 0 THEN 'Formula dependencies are missing and require review.'
          WHEN b.availability_model = 'formula' THEN 'Derived from upstream tax lines and configured formula rules.'
          WHEN b.availability_model = 'input_only' AND b.input_status IN ('provided', 'not_applicable') THEN 'Provided from non-ledger tax-line inputs.'
          ELSE 'Manual-only line in the current local storage contract.'
        END AS source_note
      FROM base_rows AS b
      LEFT JOIN formulas AS f
        ON f.entity_id = b.entity_id
       AND f.tax_year = b.tax_year
       AND f.line_key = b.line_key;`,
  },
] as const satisfies readonly StructuredViewContract[];

const structuredIndexes = [
  {
    name: 'accounts_entity_code_idx',
    summary: 'Enforces unique account codes per entity.',
    createStatement:
      'CREATE UNIQUE INDEX IF NOT EXISTS accounts_entity_code_idx ON accounts(entity_id, account_code);',
  },
  {
    name: "records_entity_recognition_idx",
    summary: "Speeds record timelines by entity and recognition date.",
    createStatement:
      "CREATE INDEX IF NOT EXISTS records_entity_recognition_idx ON records(entity_id, recognition_on);",
  },
  {
    name: "records_status_due_idx",
    summary: "Speeds due-date and open-status record queries.",
    createStatement:
      "CREATE INDEX IF NOT EXISTS records_status_due_idx ON records(entity_id, record_status, due_on);",
  },
  {
    name: "records_platform_idx",
    summary: "Speeds revenue and payout lookups by platform account.",
    createStatement:
      "CREATE INDEX IF NOT EXISTS records_platform_idx ON records(platform_account_id, recognition_on);",
  },
  {
    name: "records_entity_cash_status_idx",
    summary: "Speeds year-scoped cash-basis tax queries by entity, cash date, and status.",
    createStatement:
      "CREATE INDEX IF NOT EXISTS records_entity_cash_status_idx ON records(entity_id, cash_on, record_status);",
  },
  {
    name: "records_entity_tax_line_cash_status_idx",
    summary: "Speeds tax-line projection reads by entity, tax-line code, cash date, and status.",
    createStatement:
      "CREATE INDEX IF NOT EXISTS records_entity_tax_line_cash_status_idx ON records(entity_id, tax_line_code, cash_on, record_status);",
  },
  {
    name: "evidence_files_sha_idx",
    summary: "Supports de-duplication by file hash and size.",
    createStatement:
      "CREATE UNIQUE INDEX IF NOT EXISTS evidence_files_sha_idx ON evidence_files(sha256_hex, size_bytes);",
  },
  {
    name: "record_evidence_primary_idx",
    summary: "Speeds primary evidence lookup per record.",
    createStatement:
      "CREATE INDEX IF NOT EXISTS record_evidence_primary_idx ON record_evidence_links(record_id, is_primary);",
  },
] as const satisfies readonly StructuredIndexContract[];

const structuredMaintenanceStatements = [
  `INSERT OR IGNORE INTO record_entry_classifications (
    record_id,
    entry_mode,
    user_classification,
    classification_status,
    resolver_code,
    resolver_note,
    created_at,
    updated_at
  )
  SELECT
    record_id,
    'legacy',
    CASE
      WHEN record_kind IN ('income', 'invoice_payment', 'platform_payout') THEN 'income'
      WHEN record_kind IN ('expense', 'reimbursable_expense', 'asset_purchase') THEN 'expense'
      WHEN record_kind = 'owner_draw' THEN 'personal_spending'
      ELSE 'other'
    END AS user_classification,
    'legacy',
    'legacy_backfill_v1',
    'Derived from existing record_kind during the additive simplified-entry migration.',
    created_at,
    updated_at
  FROM records;`,
  `INSERT OR IGNORE INTO tax_line_definitions (
    line_key,
    form_code,
    schedule_code,
    line_code,
    line_label,
    line_kind,
    value_type,
    availability_model,
    source_kind,
    display_order,
    supports_record_trace,
    created_at,
    updated_at
  ) VALUES
    ('schedule_c.line1', '1040', 'schedule_c', 'line1', 'Gross receipts or sales', 'amount', 'amount_cents', 'record_rollup', 'record', 101, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line2', '1040', 'schedule_c', 'line2', 'Returns and allowances', 'amount', 'amount_cents', 'record_rollup', 'record', 102, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line3', '1040', 'schedule_c', 'line3', 'Subtract line 2 from line 1', 'amount', 'amount_cents', 'formula', 'formula', 103, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line4', '1040', 'schedule_c', 'line4', 'Cost of goods sold from line 42', 'amount', 'amount_cents', 'formula', 'formula', 104, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line5', '1040', 'schedule_c', 'line5', 'Gross profit', 'amount', 'amount_cents', 'formula', 'formula', 105, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line6', '1040', 'schedule_c', 'line6', 'Other income', 'amount', 'amount_cents', 'record_rollup', 'record', 106, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line7', '1040', 'schedule_c', 'line7', 'Gross income', 'amount', 'amount_cents', 'formula', 'formula', 107, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line8', '1040', 'schedule_c', 'line8', 'Advertising', 'amount', 'amount_cents', 'record_rollup', 'record', 108, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line10', '1040', 'schedule_c', 'line10', 'Commissions and fees', 'amount', 'amount_cents', 'record_rollup', 'record', 110, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line11', '1040', 'schedule_c', 'line11', 'Contract labor', 'amount', 'amount_cents', 'record_rollup', 'record', 111, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line14', '1040', 'schedule_c', 'line14', 'Employee benefit programs', 'amount', 'amount_cents', 'record_rollup', 'record', 114, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line15', '1040', 'schedule_c', 'line15', 'Insurance other than health', 'amount', 'amount_cents', 'record_rollup', 'record', 115, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line16a', '1040', 'schedule_c', 'line16a', 'Mortgage interest', 'amount', 'amount_cents', 'record_rollup', 'record', 116, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line16b', '1040', 'schedule_c', 'line16b', 'Other interest', 'amount', 'amount_cents', 'record_rollup', 'record', 117, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line17', '1040', 'schedule_c', 'line17', 'Legal and professional services', 'amount', 'amount_cents', 'record_rollup', 'record', 118, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line18', '1040', 'schedule_c', 'line18', 'Office expense', 'amount', 'amount_cents', 'record_rollup', 'record', 119, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line19', '1040', 'schedule_c', 'line19', 'Pension and profit-sharing plans', 'amount', 'amount_cents', 'record_rollup', 'record', 120, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line20a', '1040', 'schedule_c', 'line20a', 'Rent or lease vehicles machinery and equipment', 'amount', 'amount_cents', 'record_rollup', 'record', 121, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line20b', '1040', 'schedule_c', 'line20b', 'Rent or lease other business property', 'amount', 'amount_cents', 'record_rollup', 'record', 122, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line21', '1040', 'schedule_c', 'line21', 'Repairs and maintenance', 'amount', 'amount_cents', 'record_rollup', 'record', 123, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line22', '1040', 'schedule_c', 'line22', 'Supplies', 'amount', 'amount_cents', 'record_rollup', 'record', 124, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line23', '1040', 'schedule_c', 'line23', 'Taxes and licenses', 'amount', 'amount_cents', 'record_rollup', 'record', 125, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line24a', '1040', 'schedule_c', 'line24a', 'Travel', 'amount', 'amount_cents', 'record_rollup', 'record', 126, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line25', '1040', 'schedule_c', 'line25', 'Utilities', 'amount', 'amount_cents', 'record_rollup', 'record', 127, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line26', '1040', 'schedule_c', 'line26', 'Wages less employment credits', 'amount', 'amount_cents', 'record_rollup', 'record', 128, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line27b', '1040', 'schedule_c', 'line27b', 'Total other expenses from Part V', 'amount', 'amount_cents', 'record_rollup', 'record', 129, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line28', '1040', 'schedule_c', 'line28', 'Total expenses', 'amount', 'amount_cents', 'formula', 'formula', 130, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line29', '1040', 'schedule_c', 'line29', 'Tentative profit or loss', 'amount', 'amount_cents', 'formula', 'formula', 131, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line30', '1040', 'schedule_c', 'line30', 'Expenses for business use of home', 'amount', 'amount_cents', 'input_only', 'input', 132, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line31', '1040', 'schedule_c', 'line31', 'Net profit or loss', 'amount', 'amount_cents', 'formula', 'formula', 133, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line32a', '1040', 'schedule_c', 'line32a', 'All investment at risk', 'checkbox', 'boolean', 'input_only', 'input', 134, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line32b', '1040', 'schedule_c', 'line32b', 'Some investment not at risk', 'checkbox', 'boolean', 'input_only', 'input', 135, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line35', '1040', 'schedule_c', 'line35', 'Inventory at beginning of year', 'amount', 'amount_cents', 'record_rollup', 'record', 140, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line36', '1040', 'schedule_c', 'line36', 'Purchases less personal withdrawals', 'amount', 'amount_cents', 'record_rollup', 'record', 141, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line37', '1040', 'schedule_c', 'line37', 'Cost of labor', 'amount', 'amount_cents', 'record_rollup', 'record', 142, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line38', '1040', 'schedule_c', 'line38', 'Materials and supplies', 'amount', 'amount_cents', 'record_rollup', 'record', 143, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line39', '1040', 'schedule_c', 'line39', 'Other costs', 'amount', 'amount_cents', 'record_rollup', 'record', 144, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line40', '1040', 'schedule_c', 'line40', 'Add lines 35 through 39', 'amount', 'amount_cents', 'formula', 'formula', 145, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line41', '1040', 'schedule_c', 'line41', 'Inventory at end of year', 'amount', 'amount_cents', 'record_rollup', 'record', 146, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line42', '1040', 'schedule_c', 'line42', 'Cost of goods sold', 'amount', 'amount_cents', 'formula', 'formula', 147, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_c.line48', '1040', 'schedule_c', 'line48', 'Total other expenses (Part V)', 'amount', 'amount_cents', 'record_rollup', 'record', 148, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line1a', '1040', 'schedule_se', 'line1a', 'Farm profit or loss', 'amount', 'amount_cents', 'input_only', 'input', 201, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line1b', '1040', 'schedule_se', 'line1b', 'CRP payments included on Schedule F', 'amount', 'amount_cents', 'input_only', 'input', 202, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line2', '1040', 'schedule_se', 'line2', 'Net profit or loss from Schedule C line 31', 'amount', 'amount_cents', 'formula', 'formula', 203, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line3', '1040', 'schedule_se', 'line3', 'Combine lines 1a 1b and 2', 'amount', 'amount_cents', 'formula', 'formula', 204, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line4a', '1040', 'schedule_se', 'line4a', '92.35 percent of line 3', 'amount', 'amount_cents', 'formula', 'formula', 205, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line4b', '1040', 'schedule_se', 'line4b', 'Optional methods amount', 'amount', 'amount_cents', 'input_only', 'input', 206, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line4c', '1040', 'schedule_se', 'line4c', 'Combine lines 4a and 4b with threshold rule', 'amount', 'amount_cents', 'formula', 'formula', 207, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line5a', '1040', 'schedule_se', 'line5a', 'Church employee income', 'amount', 'amount_cents', 'input_only', 'input', 208, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line5b', '1040', 'schedule_se', 'line5b', 'Multiply line 5a by 92.35 percent', 'amount', 'amount_cents', 'input_only', 'input', 209, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line6', '1040', 'schedule_se', 'line6', 'Add lines 4c and 5b', 'amount', 'amount_cents', 'formula', 'formula', 210, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line8a', '1040', 'schedule_se', 'line8a', 'Social security wages from Form W-2', 'amount', 'amount_cents', 'input_only', 'input', 211, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line8b', '1040', 'schedule_se', 'line8b', 'Unreported tips and wages from Forms 4137 and 8919', 'amount', 'amount_cents', 'input_only', 'input', 212, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line8c', '1040', 'schedule_se', 'line8c', 'Add lines 8a and 8b', 'amount', 'amount_cents', 'input_only', 'input', 213, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line9', '1040', 'schedule_se', 'line9', 'Maximum amount of combined wages and self-employment earnings', 'amount', 'amount_cents', 'input_only', 'input', 214, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line10', '1040', 'schedule_se', 'line10', 'Social security tax', 'amount', 'amount_cents', 'formula', 'formula', 215, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line11', '1040', 'schedule_se', 'line11', 'Medicare tax', 'amount', 'amount_cents', 'formula', 'formula', 216, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line12', '1040', 'schedule_se', 'line12', 'Self-employment tax', 'amount', 'amount_cents', 'formula', 'formula', 217, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_se.line13', '1040', 'schedule_se', 'line13', 'Deduction for one-half of self-employment tax', 'amount', 'amount_cents', 'formula', 'formula', 218, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_1.line3', '1040', 'schedule_1', 'line3', 'Business income or loss from Schedule C line 31', 'amount', 'amount_cents', 'formula', 'formula', 301, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_1.line10', '1040', 'schedule_1', 'line10', 'Additional income total', 'amount', 'amount_cents', 'input_only', 'input', 302, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_1.line15', '1040', 'schedule_1', 'line15', 'Deductible part of self-employment tax', 'amount', 'amount_cents', 'formula', 'formula', 303, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_1.line26', '1040', 'schedule_1', 'line26', 'Adjustments to income total', 'amount', 'amount_cents', 'input_only', 'input', 304, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_2.line4', '1040', 'schedule_2', 'line4', 'Self-employment tax from Schedule SE line 12', 'amount', 'amount_cents', 'formula', 'formula', 401, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('schedule_2.line21', '1040', 'schedule_2', 'line21', 'Total other taxes', 'amount', 'amount_cents', 'input_only', 'input', 402, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('form_1040.line8', '1040', 'form_1040', 'line8', 'Additional income from Schedule 1 line 10', 'amount', 'amount_cents', 'formula', 'formula', 501, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('form_1040.line10', '1040', 'form_1040', 'line10', 'Adjustments to income from Schedule 1 line 26', 'amount', 'amount_cents', 'formula', 'formula', 502, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    ('form_1040.line23', '1040', 'form_1040', 'line23', 'Other taxes from Schedule 2 line 21', 'amount', 'amount_cents', 'formula', 'formula', 503, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));`,
  `UPDATE records
   SET tax_line_code = 'line27b',
       updated_at = COALESCE(updated_at, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
   WHERE LOWER(TRIM(COALESCE(tax_line_code, ''))) = 'line27a'
     AND LOWER(TRIM(COALESCE(tax_category_code, ''))) = 'schedule-c-other-expense';`,
  `UPDATE record_entry_classifications
   SET resolver_code = 'expense_line27b_default',
       resolver_note = REPLACE(
         COALESCE(resolver_note, ''),
         'line27a',
         'line27b'
       ),
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
   WHERE resolver_code = 'expense_line27a_default';`,
] as const;

const structuredSchemaStatements = [
  ...structuredTables.map((table) => table.createStatement),
  ...structuredViews.map((view) => view.createStatement),
  ...structuredIndexes.map((index) => index.createStatement),
] as const;
export const structuredStoreContract = {
  databaseName: "creator-cfo-local.db",
  maintenanceStatements: structuredMaintenanceStatements,
  version: 4,
  pragmas: structuredStorePragmas,
  tables: structuredTables,
  views: structuredViews,
  indexes: structuredIndexes,
  schemaStatements: structuredSchemaStatements,
} as const satisfies {
  databaseName: string;
  indexes: readonly StructuredIndexContract[];
  maintenanceStatements: readonly string[];
  pragmas: readonly string[];
  schemaStatements: readonly string[];
  tables: readonly StructuredTableContract[];
  version: number;
  views: readonly StructuredViewContract[];
};

export const fileVaultContract = {
  rootDirectory: "creator-cfo-vault",
  collections: [
    {
      slug: "evidence-objects",
      title: "Evidence Objects",
      summary: "Canonical evidence binaries stored once by content hash.",
      defaultExtension: "bin",
    },
    {
      slug: "evidence-manifests",
      title: "Evidence Manifests",
      summary: "Per-evidence manifest files that describe linked documents and metadata.",
      defaultExtension: "json",
    },
    {
      slug: "evidence-derived",
      title: "Evidence Derived",
      summary: "Generated previews or future sidecar files derived from canonical evidence.",
      defaultExtension: "jpg",
    },
    {
      slug: "invoice-exports",
      title: "Invoice Exports",
      summary: "Generated invoice PDFs or shareable drafts for clients.",
      defaultExtension: "pdf",
    },
    {
      slug: "tax-support",
      title: "Tax Support",
      summary: "Exports reserved for period-close, tax packaging, and audit support.",
      defaultExtension: "zip",
    },
  ],
} as const satisfies {
  collections: readonly FileVaultCollectionContract[];
  rootDirectory: string;
};

export const deviceStateContract = {
  storageEngine: "AsyncStorage",
  namespace: "@creator-cfo/mobile",
  version: 1,
  records: [
    {
      key: "theme_preference",
      summary: "Persist the user's chosen light, dark, or system theme mode.",
      valueShape: '"system" | "light" | "dark"',
    },
    {
      key: "locale_preference",
      summary: "Persist the user's preferred display language for the mobile shell.",
      valueShape: '"system" | "en" | "zh-CN"',
    },
    {
      key: "auth_session",
      summary:
        "Persist the locally trusted session summary for guest mode or on-device Apple sign-in.",
      valueShape:
        '{ kind: "guest" | "apple"; appleUserId?: string; email?: string | null; displayName?: string | null }',
    },
  ],
} as const satisfies {
  storageEngine: string;
  namespace: string;
  version: number;
  records: KeyValueRecordContract[];
};

export type FileVaultCollectionSlug = (typeof fileVaultContract.collections)[number]["slug"];
export type DeviceStateRecordKey = (typeof deviceStateContract.records)[number]["key"];

function normalizeSha256Hex(sha256Hex: string): string {
  const normalized = sha256Hex.trim().toLowerCase().replace(/[^a-f0-9]+/g, "");

  return normalized.length > 0 ? normalized : "0000";
}

function normalizeFileExtension(extension: string): string {
  const normalized = extension.trim().toLowerCase().replace(/^\.+/, "").replace(/[^a-z0-9]+/g, "");

  return normalized.length > 0 ? normalized : "bin";
}

export function sanitizeVaultFileName(fileName: string): string {
  const normalized = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length === 0 || normalized.replace(/\./g, "").length === 0) {
    return "file";
  }

  return normalized;
}

export function sanitizeVaultPathSegment(segment: string): string {
  const normalized = segment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "item";
}

export function buildVaultRelativePath(
  collection: FileVaultCollectionSlug,
  fileName: string,
): string {
  return `${collection}/${sanitizeVaultFileName(fileName)}`;
}

export function buildDeviceStateStorageKey(key: DeviceStateRecordKey): string {
  return `${deviceStateContract.namespace}/${key}`;
}

export function buildEvidenceObjectPath(sha256Hex: string, extension: string): string {
  const normalizedSha = normalizeSha256Hex(sha256Hex);
  const normalizedExtension = normalizeFileExtension(extension);
  const levelOne = normalizedSha.slice(0, 2).padEnd(2, "0");
  const levelTwo = normalizedSha.slice(2, 4).padEnd(2, "0");

  return `evidence-objects/${levelOne}/${levelTwo}/${normalizedSha}.${normalizedExtension}`;
}

export function buildEvidenceManifestPath(evidenceId: string): string {
  return `evidence-manifests/${sanitizeVaultPathSegment(evidenceId)}.json`;
}

export function buildEvidenceDerivedPath(evidenceId: string, fileName: string): string {
  return `evidence-derived/${sanitizeVaultPathSegment(evidenceId)}/${sanitizeVaultFileName(fileName)}`;
}

export function buildInvoiceExportPath(
  recordId: string,
  year: number | string,
  extension = "pdf",
): string {
  return `invoice-exports/${sanitizeVaultPathSegment(String(year))}/${sanitizeVaultPathSegment(recordId)}.${normalizeFileExtension(extension)}`;
}

export function buildTaxSupportPath(periodKey: string, fileName: string): string {
  return `tax-support/${sanitizeVaultPathSegment(periodKey)}/${sanitizeVaultFileName(fileName)}`;
}

export function getVaultCollectionSamplePath(collection: FileVaultCollectionSlug): string {
  switch (collection) {
    case "evidence-objects":
      return buildEvidenceObjectPath(
        "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
        "bin",
      );
    case "evidence-manifests":
      return buildEvidenceManifestPath("sample-evidence");
    case "evidence-derived":
      return buildEvidenceDerivedPath("sample-evidence", "preview-1.jpg");
    case "invoice-exports":
      return buildInvoiceExportPath("sample-record", "2026");
    case "tax-support":
      return buildTaxSupportPath("2026-q1", "evidence-package.zip");
  }

  const exhaustiveCollection: never = collection;
  return exhaustiveCollection;
}

export function getLocalStorageOverview(): LocalStorageOverview {
  return {
    collectionCount: fileVaultContract.collections.length,
    indexCount: structuredStoreContract.indexes.length,
    tableCount: structuredStoreContract.tables.length,
    viewCount: structuredStoreContract.views.length,
  };
}

export function createLocalStorageBootstrapManifest(): LocalStorageBootstrapManifest {
  return {
    databaseName: structuredStoreContract.databaseName,
    fileCollections: fileVaultContract.collections.map((collection) => ({
      ...collection,
      samplePath: getVaultCollectionSamplePath(collection.slug),
    })),
    schemaObjects: {
      indexes: structuredStoreContract.indexes.map((index) => index.name),
      tables: structuredStoreContract.tables.map((table) => table.name),
      views: structuredStoreContract.views.map((view) => view.name),
    },
    version: structuredStoreContract.version,
  };
}

export function getLocalStorageBootstrapPlan(): LocalStorageBootstrapPlan {
  return {
    databaseName: structuredStoreContract.databaseName,
    fileCollections: fileVaultContract.collections,
    fileVaultRoot: fileVaultContract.rootDirectory,
    maintenanceStatements: structuredStoreContract.maintenanceStatements,
    overview: getLocalStorageOverview(),
    pragmas: structuredStoreContract.pragmas,
    schemaStatements: structuredStoreContract.schemaStatements,
    structuredIndexes: structuredStoreContract.indexes,
    structuredTables: structuredStoreContract.tables,
    structuredViews: structuredStoreContract.views,
    version: structuredStoreContract.version,
  };
}
