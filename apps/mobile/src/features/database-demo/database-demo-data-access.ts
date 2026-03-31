import {
  persistResolvedStandardReceiptEntry,
  resolveStandardReceiptEntry,
  type ReadableStorageDatabase,
  type WritableStorageDatabase,
} from "@creator-cfo/storage";

import {
  buildDatabaseDemoReportState,
  buildDatabaseDemoSummary,
  createDatabaseDemoFixture,
  createDatabaseDemoRecordLikePattern,
  createDatabaseDemoStandardReceiptDraft,
  databaseDemoSourceSystem,
  formatAmountLabel,
  formatDatabaseDemoClassificationLabel,
  getNextDatabaseDemoRecordSequence,
  type DatabaseDemoAccountingRow,
  type DatabaseDemoDoubleEntryPreview,
  type DatabaseDemoFieldUpdate,
  type DatabaseDemoReceiptClassification,
  type DatabaseDemoRecordPreview,
  type DatabaseDemoSnapshot,
} from "./demo-data";

interface DemoRecordIdRow {
  recordId: string;
}

interface DemoRecordRow {
  cashOn: string | null;
  currency: string;
  description: string;
  grossAmountCents: number;
  netCashAmountCents: number;
  primaryAmountCents: number;
  recognitionOn: string;
  recordId: string;
  recordKind: string;
  recordStatus: string;
  userClassification: DatabaseDemoReceiptClassification | null;
}

export interface DemoEditableRecordRow {
  description: string;
  recordId: string;
  recordStatus: string;
  userClassification: DatabaseDemoReceiptClassification | null;
}

interface DemoDoubleEntryRow {
  accountName: string | null;
  accountRole: string;
  creditAmountCents: number;
  currency: string;
  debitAmountCents: number;
  lineNo: number;
}

export interface LoadDatabaseDemoSnapshotResult {
  selectedRecordId: string | null;
  snapshot: DatabaseDemoSnapshot;
}

export async function loadDatabaseDemoSnapshot(
  database: ReadableStorageDatabase,
  preferredSelectedRecordId: string | null,
): Promise<LoadDatabaseDemoSnapshotResult> {
  const recentRecords = await database.getAllAsync<DemoRecordRow>(
    `SELECT
      r.record_id AS recordId,
      r.record_kind AS recordKind,
      classification.user_classification AS userClassification,
      r.description,
      r.primary_amount_cents AS primaryAmountCents,
      r.gross_amount_cents AS grossAmountCents,
      r.net_cash_amount_cents AS netCashAmountCents,
      r.currency,
      r.record_status AS recordStatus,
      r.recognition_on AS recognitionOn,
      r.cash_on AS cashOn
    FROM records AS r
    LEFT JOIN record_entry_classifications AS classification
      ON classification.record_id = r.record_id
    WHERE r.source_system = ? AND r.record_id LIKE ?
    ORDER BY r.recognition_on DESC, r.created_at DESC, r.record_id DESC;`,
    databaseDemoSourceSystem,
    createDatabaseDemoRecordLikePattern(),
  );

  const resolvedSelectedRecordId = resolveSelectedRecordId(recentRecords, preferredSelectedRecordId);
  const doubleEntryRows = resolvedSelectedRecordId
    ? await database.getAllAsync<DemoDoubleEntryRow>(
        `SELECT
          lines.line_no AS lineNo,
          lines.account_role AS accountRole,
          accounts.account_name AS accountName,
          lines.debit_amount_cents AS debitAmountCents,
          lines.credit_amount_cents AS creditAmountCents,
          lines.currency AS currency
        FROM record_double_entry_lines_v AS lines
        LEFT JOIN accounts ON accounts.account_id = lines.account_id
        WHERE lines.record_id = ?
        ORDER BY lines.line_no ASC;`,
        resolvedSelectedRecordId,
      )
    : [];
  const accountingRows = await database.getAllAsync<DatabaseDemoAccountingRow>(
    `SELECT
      record_id AS recordId,
      description,
      posting_on AS postingOn,
      line_no AS lineNo,
      account_role AS accountRole,
      account_code AS accountCode,
      account_name AS accountName,
      account_type AS accountType,
      normal_balance AS normalBalance,
      statement_section AS statementSection,
      debit_amount_cents AS debitAmountCents,
      credit_amount_cents AS creditAmountCents,
      normalized_balance_delta_cents AS normalizedBalanceDeltaCents,
      currency
    FROM accounting_posting_lines_v
    WHERE source_system = ? AND record_id LIKE ?
    ORDER BY posting_on ASC, record_id ASC, line_no ASC;`,
    databaseDemoSourceSystem,
    createDatabaseDemoRecordLikePattern(),
  );
  const reportState = buildDatabaseDemoReportState(accountingRows);

  const snapshot: DatabaseDemoSnapshot = {
    balanceSheetSections: reportState.balanceSheetSections,
    counts: {
      journalEntryCount: reportState.journalEntries.length,
      ledgerAccountCount: reportState.ledgerAccounts.length,
      recordCount: recentRecords.length,
      selectedLineCount: doubleEntryRows.length,
    },
    journalEntries: reportState.journalEntries,
    ledgerAccounts: reportState.ledgerAccounts,
    ledgerHealth: reportState.ledgerHealth,
    profitAndLossSections: reportState.profitAndLossSections,
    recentRecords: buildRecentRecordPreview(recentRecords),
    selectedPostingLines: buildDoubleEntryPreview(doubleEntryRows),
    summary: "",
  };

  snapshot.summary = buildDatabaseDemoSummary(snapshot, resolvedSelectedRecordId);

  return {
    selectedRecordId: resolvedSelectedRecordId,
    snapshot,
  };
}

export async function listDatabaseDemoRecordIds(database: ReadableStorageDatabase): Promise<string[]> {
  const rows = await database.getAllAsync<DemoRecordIdRow>(
    `SELECT record_id AS recordId
    FROM records
    WHERE source_system = ? AND record_id LIKE ?;`,
    databaseDemoSourceSystem,
    createDatabaseDemoRecordLikePattern(),
  );

  return rows.map((row) => row.recordId);
}

export async function ensureDatabaseDemoFixture(database: WritableStorageDatabase): Promise<void> {
  const fixture = createDatabaseDemoFixture();

  await database.runAsync(
    `INSERT OR IGNORE INTO entities (
      entity_id,
      legal_name,
      entity_type,
      base_currency,
      default_timezone,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    fixture.entity.entityId,
    fixture.entity.legalName,
    fixture.entity.entityType,
    fixture.entity.baseCurrency,
    fixture.entity.defaultTimezone,
    fixture.entity.createdAt,
  );

  for (const account of fixture.accounts) {
    await database.runAsync(
      `INSERT OR IGNORE INTO accounts (
        account_id,
        entity_id,
        account_code,
        account_name,
        account_type,
        normal_balance,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      account.accountId,
      account.entityId,
      account.accountCode,
      account.accountName,
      account.accountType,
      account.normalBalance,
      account.createdAt,
    );
  }

  await database.runAsync(
    `INSERT OR IGNORE INTO counterparties (
      counterparty_id,
      entity_id,
      counterparty_type,
      legal_name,
      display_name,
      notes,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    fixture.counterparty.counterpartyId,
    fixture.counterparty.entityId,
    fixture.counterparty.counterpartyType,
    fixture.counterparty.legalName,
    fixture.counterparty.displayName,
    fixture.counterparty.notes,
    fixture.counterparty.createdAt,
  );

  await database.runAsync(
    `INSERT OR IGNORE INTO platform_accounts (
      platform_account_id,
      entity_id,
      platform_code,
      account_label,
      external_account_ref,
      active_from,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    fixture.platformAccount.platformAccountId,
    fixture.platformAccount.entityId,
    fixture.platformAccount.platformCode,
    fixture.platformAccount.accountLabel,
    fixture.platformAccount.externalAccountRef,
    fixture.platformAccount.activeFrom,
    fixture.platformAccount.createdAt,
  );
}

export async function createDatabaseDemoRecord(
  database: WritableStorageDatabase,
  classification: DatabaseDemoReceiptClassification,
): Promise<string> {
  await ensureDatabaseDemoFixture(database);
  const existingRecordIds = await listDatabaseDemoRecordIds(database);
  const nextSequence = getNextDatabaseDemoRecordSequence(existingRecordIds);
  const draft = createDatabaseDemoStandardReceiptDraft(nextSequence, classification);
  const resolvedEntry = resolveStandardReceiptEntry(draft.input, draft.persistenceContext);

  await persistResolvedStandardReceiptEntry(database, resolvedEntry);

  return resolvedEntry.record.recordId;
}

export async function loadDatabaseDemoEditableRecord(
  database: ReadableStorageDatabase,
  recordId: string,
): Promise<DemoEditableRecordRow | null> {
  return database.getFirstAsync<DemoEditableRecordRow>(
    `SELECT
      r.record_id AS recordId,
      r.description,
      r.record_status AS recordStatus,
      classification.user_classification AS userClassification
    FROM records AS r
    LEFT JOIN record_entry_classifications AS classification
      ON classification.record_id = r.record_id
    WHERE r.record_id = ? AND r.source_system = ?
    LIMIT 1;`,
    recordId,
    databaseDemoSourceSystem,
  );
}

export async function updateDatabaseDemoRecordField(
  database: WritableStorageDatabase,
  recordId: string,
  update: DatabaseDemoFieldUpdate,
): Promise<void> {
  if (update.field === "description") {
    await database.runAsync(
      `UPDATE records
      SET
        description = ?,
        updated_at = ?
      WHERE record_id = ?;`,
      update.nextValue,
      update.updatedAt,
      recordId,
    );

    return;
  }

  await database.runAsync(
    `UPDATE records
    SET
      record_status = ?,
      updated_at = ?
    WHERE record_id = ?;`,
    update.nextValue,
    update.updatedAt,
    recordId,
  );
}

function resolveSelectedRecordId(
  records: readonly DemoRecordRow[],
  preferredSelectedRecordId: string | null,
): string | null {
  if (records.length === 0) {
    return null;
  }

  if (preferredSelectedRecordId && records.some((record) => record.recordId === preferredSelectedRecordId)) {
    return preferredSelectedRecordId;
  }

  return records[0]?.recordId ?? null;
}

function buildRecentRecordPreview(rows: DemoRecordRow[]): DatabaseDemoRecordPreview[] {
  return rows.map((row) => ({
    amountLabel: formatAmountLabel(
      row.grossAmountCents > 0 ? row.grossAmountCents : row.primaryAmountCents,
      row.currency,
    ),
    cashMovementLabel: formatAmountLabel(
      row.netCashAmountCents > 0 ? row.netCashAmountCents : row.primaryAmountCents,
      row.currency,
    ),
    classificationLabel: formatDatabaseDemoClassificationLabel(row.userClassification),
    description: row.description,
    occurredOn: row.cashOn ?? row.recognitionOn,
    recordId: row.recordId,
    recordKind: row.recordKind,
    status: row.recordStatus,
  }));
}

function buildDoubleEntryPreview(rows: DemoDoubleEntryRow[]): DatabaseDemoDoubleEntryPreview[] {
  return rows.map((row) => ({
    accountName: row.accountName ?? "Unassigned account",
    accountRole: row.accountRole,
    amountLabel: formatAmountLabel(
      row.debitAmountCents > 0 ? row.debitAmountCents : row.creditAmountCents,
      row.currency,
    ),
    direction: row.debitAmountCents > 0 ? "debit" : "credit",
    lineNo: row.lineNo,
  }));
}
