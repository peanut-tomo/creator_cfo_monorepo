import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
  persistResolvedStandardReceiptEntry,
  resolveStandardReceiptEntry,
} from "@creator-cfo/storage";

import {
  buildDatabaseDemoFieldUpdate,
  buildDatabaseDemoReportState,
  buildDatabaseDemoSummary,
  createDatabaseDemoFixture,
  createDatabaseDemoStandardReceiptDraft,
  createDatabaseDemoRecordLikePattern,
  createEmptyDatabaseDemoSnapshot,
  databaseDemoEditableFields,
  databaseDemoReceiptClassificationOptions,
  databaseDemoSourceSystem,
  formatDatabaseDemoClassificationLabel,
  formatAmountLabel,
  getNextDatabaseDemoRecordSequence,
} from "./demo-data";
import type {
  DatabaseDemoAccountingRow,
  DatabaseDemoDoubleEntryPreview,
  DatabaseDemoEditableField,
  DatabaseDemoEditableFieldOption,
  DatabaseDemoReceiptClassification,
  DatabaseDemoReceiptClassificationOption,
  DatabaseDemoRecordPreview,
  DatabaseDemoSnapshot,
} from "./demo-data";
import { createWritableStorageDatabase } from "../../storage/storage-adapter";

type DemoDatabase = ReturnType<typeof useSQLiteContext>;

interface DemoRecordIdRow {
  recordId: string;
}

interface DemoRecordRow {
  currency: string;
  cashOn: string | null;
  description: string;
  grossAmountCents: number;
  primaryAmountCents: number;
  netCashAmountCents: number;
  recognitionOn: string;
  recordId: string;
  recordKind: string;
  recordStatus: string;
  userClassification: DatabaseDemoReceiptClassification | null;
}

interface DemoEditableRecordRow {
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

interface LoadSnapshotResult {
  selectedRecordId: string | null;
  snapshot: DatabaseDemoSnapshot;
}

export interface UseDatabaseDemoResult {
  createRecord: () => Promise<void>;
  deleteRecord: () => Promise<void>;
  editableFields: readonly DatabaseDemoEditableFieldOption[];
  error: string | null;
  isBusy: boolean;
  isLoaded: boolean;
  refresh: () => Promise<void>;
  receiptClassifications: readonly DatabaseDemoReceiptClassificationOption[];
  selectClassification: (classification: DatabaseDemoReceiptClassification) => void;
  selectField: (field: DatabaseDemoEditableField) => void;
  selectRecord: (recordId: string) => Promise<void>;
  selectedClassification: DatabaseDemoReceiptClassification;
  selectedField: DatabaseDemoEditableField;
  selectedRecordId: string | null;
  snapshot: DatabaseDemoSnapshot;
  updateSelectedRecord: () => Promise<void>;
}

export function useDatabaseDemo(): UseDatabaseDemoResult {
  const database = useSQLiteContext();
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedClassification, setSelectedClassification] =
    useState<DatabaseDemoReceiptClassification>(
      databaseDemoReceiptClassificationOptions[0]?.value ?? "income",
    );
  const [selectedField, setSelectedField] = useState<DatabaseDemoEditableField>(
    databaseDemoEditableFields[0]?.value ?? "description",
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<DatabaseDemoSnapshot>(createEmptyDatabaseDemoSnapshot);

  useEffect(() => {
    let isMounted = true;

    loadSnapshot(database, null)
      .then((result) => {
        if (isMounted) {
          setSnapshot(result.snapshot);
          setSelectedRecordId(result.selectedRecordId);
          setIsLoaded(true);
        }
      })
      .catch((nextError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(nextError));
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [database]);

  async function runAction(action: () => Promise<string | null>): Promise<void> {
    setIsBusy(true);
    setError(null);

    try {
      const preferredSelectedRecordId = await action();
      const result = await loadSnapshot(database, preferredSelectedRecordId);
      setSnapshot(result.snapshot);
      setSelectedRecordId(result.selectedRecordId);
    } catch (nextError: unknown) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsBusy(false);
      setIsLoaded(true);
    }
  }

  async function refresh(): Promise<void> {
    await runAction(async () => selectedRecordId);
  }

  async function createRecord(): Promise<void> {
    await runAction(async () => {
      let createdRecordId: string | null = null;

      await database.withTransactionAsync(async () => {
        await ensureFixture(database);
        const existingRecordIds = await getDatabaseDemoRecordIds(database);
        const nextSequence = getNextDatabaseDemoRecordSequence(existingRecordIds);
        const draft = createDatabaseDemoStandardReceiptDraft(nextSequence, selectedClassification);
        const resolvedEntry = resolveStandardReceiptEntry(draft.input, draft.persistenceContext);
        const writableStorageDatabase = createWritableStorageDatabase(database);

        await persistResolvedStandardReceiptEntry(writableStorageDatabase, resolvedEntry);
        createdRecordId = resolvedEntry.record.recordId;
      });

      return createdRecordId;
    });
  }

  async function updateSelectedRecord(): Promise<void> {
    await runAction(async () => {
      if (!selectedRecordId) {
        return null;
      }

      await database.withTransactionAsync(async () => {
        const existingRecord = await database.getFirstAsync<DemoEditableRecordRow>(
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
          selectedRecordId,
          databaseDemoSourceSystem,
        );

        if (!existingRecord) {
          return;
        }

        const update = buildDatabaseDemoFieldUpdate(existingRecord, selectedField);
        await updateRecordField(database, existingRecord.recordId, update.field, update.nextValue, update.updatedAt);
      });

      return selectedRecordId;
    });
  }

  async function deleteRecord(): Promise<void> {
    await runAction(async () => {
      if (!selectedRecordId) {
        return null;
      }

      await database.runAsync("DELETE FROM records WHERE record_id = ?;", selectedRecordId);
      return null;
    });
  }

  async function selectRecord(recordId: string): Promise<void> {
    setIsBusy(true);
    setError(null);

    try {
      const result = await loadSnapshot(database, recordId);
      setSnapshot(result.snapshot);
      setSelectedRecordId(result.selectedRecordId);
    } catch (nextError: unknown) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsBusy(false);
      setIsLoaded(true);
    }
  }

  return {
    createRecord,
    deleteRecord,
    editableFields: databaseDemoEditableFields,
    error,
    isBusy,
    isLoaded,
    refresh,
    receiptClassifications: databaseDemoReceiptClassificationOptions,
    selectClassification: setSelectedClassification,
    selectField: setSelectedField,
    selectRecord,
    selectedClassification,
    selectedField,
    selectedRecordId,
    snapshot,
    updateSelectedRecord,
  };
}

async function loadSnapshot(
  database: DemoDatabase,
  preferredSelectedRecordId: string | null,
): Promise<LoadSnapshotResult> {
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

async function getDatabaseDemoRecordIds(database: DemoDatabase): Promise<string[]> {
  const rows = await database.getAllAsync<DemoRecordIdRow>(
    `SELECT record_id AS recordId
    FROM records
    WHERE source_system = ? AND record_id LIKE ?;`,
    databaseDemoSourceSystem,
    createDatabaseDemoRecordLikePattern(),
  );

  return rows.map((row) => row.recordId);
}

async function ensureFixture(database: DemoDatabase): Promise<void> {
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

async function updateRecordField(
  database: DemoDatabase,
  recordId: string,
  field: DatabaseDemoEditableField,
  nextValue: string,
  updatedAt: string,
): Promise<void> {
  if (field === "description") {
    await database.runAsync(
      `UPDATE records
      SET
        description = ?,
        updated_at = ?
      WHERE record_id = ?;`,
      nextValue,
      updatedAt,
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
    nextValue,
    updatedAt,
    recordId,
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown database demo error.";
}
