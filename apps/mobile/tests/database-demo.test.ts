import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import {
  loadTaxLines,
  structuredStoreContract,
  type StorageSqlValue,
} from "@creator-cfo/storage";

import {
  createDatabaseDemoRecord,
  ensureDatabaseDemoFixture,
  listDatabaseDemoRecordIds,
  loadDatabaseDemoEditableRecord,
  loadDatabaseDemoSnapshot,
  updateDatabaseDemoRecordField,
} from "../src/features/database-demo/database-demo-data-access";
import {
  buildDatabaseDemoFieldUpdate,
  databaseDemoIds,
  createDatabaseDemoRecordId,
} from "../src/features/database-demo/demo-data";

function createStorageDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");

  for (const pragma of structuredStoreContract.pragmas) {
    database.exec(pragma);
  }

  for (const statement of structuredStoreContract.schemaStatements) {
    database.exec(statement);
  }

  for (const statement of structuredStoreContract.maintenanceStatements) {
    database.exec(statement);
  }

  return database;
}

function runMaintenance(database: DatabaseSync): void {
  for (const statement of structuredStoreContract.maintenanceStatements) {
    database.exec(statement);
  }
}

function createWritableDatabase(database: DatabaseSync) {
  return {
    async getAllAsync<Row>(source: string, ...params: StorageSqlValue[]) {
      return database.prepare(source).all({}, ...params) as Row[];
    },
    async getFirstAsync<Row>(source: string, ...params: StorageSqlValue[]) {
      return (database.prepare(source).get({}, ...params) as Row | undefined) ?? null;
    },
    async runAsync(source: string, ...params: StorageSqlValue[]) {
      return database.prepare(source).run(...params);
    },
  };
}

async function createPopulatedDemoDatabase() {
  const database = createStorageDatabase();
  const writableDatabase = createWritableDatabase(database);

  await ensureDatabaseDemoFixture(writableDatabase);
  const incomeRecordId = await createDatabaseDemoRecord(writableDatabase, "income");
  const expenseRecordId = await createDatabaseDemoRecord(writableDatabase, "expense");
  await writableDatabase.runAsync(
    `INSERT INTO tax_line_inputs (
      entity_id,
      tax_year,
      line_key,
      input_status,
      amount_cents,
      note,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    databaseDemoIds.entityId,
    2026,
    "schedule_c.line30",
    "provided",
    0,
    "No home office deduction for the demo test database.",
    "2026-03-30T00:00:00.000Z",
    "2026-03-30T00:00:00.000Z",
  );
  runMaintenance(database);

  return { database, expenseRecordId, incomeRecordId, writableDatabase };
}

describe("database demo storage coverage", () => {
  it("boots a test database and produces balanced ledger outputs", async () => {
    const { incomeRecordId, expenseRecordId, writableDatabase } =
      await createPopulatedDemoDatabase();

    expect((await listDatabaseDemoRecordIds(writableDatabase)).sort()).toEqual(
      [incomeRecordId, expenseRecordId].sort(),
    );

    const result = await loadDatabaseDemoSnapshot(writableDatabase, incomeRecordId);

    expect(result.selectedRecordId).toBe(incomeRecordId);
    expect(result.snapshot.counts).toEqual({
      journalEntryCount: 2,
      ledgerAccountCount: 3,
      recordCount: 2,
      selectedLineCount: 2,
    });
    expect(result.snapshot.ledgerHealth.isBalanced).toBe(true);
    expect(result.snapshot.ledgerHealth.warningText).toBeNull();
    expect(result.snapshot.summary).toContain("2 demo records are present");
    expect(result.snapshot.summary).toContain(incomeRecordId);
    expect(result.snapshot.selectedPostingLines).toEqual([
      {
        accountName: "Business Checking",
        accountRole: "cash",
        amountLabel: "USD 125.00",
        direction: "debit",
        lineNo: 10,
      },
      {
        accountName: "Platform Revenue",
        accountRole: "primary",
        amountLabel: "USD 125.00",
        direction: "credit",
        lineNo: 90,
      },
    ]);
    expect(result.snapshot.balanceSheetSections).toEqual([
      {
        lines: [{ amountLabel: "USD 76.50", label: "1010 · Business Checking" }],
        title: "Assets",
        totalLabel: "USD 76.50",
      },
      {
        lines: [{ amountLabel: "USD 76.50", label: "Current earnings" }],
        title: "Equity",
        totalLabel: "USD 76.50",
      },
    ]);
    expect(result.snapshot.profitAndLossSections).toEqual([
      {
        lines: [{ amountLabel: "USD 125.00", label: "4010 · Platform Revenue" }],
        title: "Income",
        totalLabel: "USD 125.00",
      },
      {
        lines: [{ amountLabel: "USD 48.50", label: "6100 · Office Expense" }],
        title: "Expenses",
        totalLabel: "USD 48.50",
      },
      {
        lines: [{ amountLabel: "USD 76.50", label: "Current period result" }],
        title: "Net income",
        totalLabel: "USD 76.50",
      },
    ]);
  });

  it("updates demo records and exposes tax form-filling lines from the test database", async () => {
    const { database, expenseRecordId, writableDatabase } = await createPopulatedDemoDatabase();
    const editableRecord = await loadDatabaseDemoEditableRecord(writableDatabase, expenseRecordId);

    expect(editableRecord).not.toBeNull();

    const descriptionUpdate = buildDatabaseDemoFieldUpdate(editableRecord!, "description");
    await updateDatabaseDemoRecordField(writableDatabase, expenseRecordId, descriptionUpdate);

    const reviewedRecord = await loadDatabaseDemoEditableRecord(writableDatabase, expenseRecordId);

    expect(reviewedRecord?.description).toBe("Office receipt 2 reviewed");

    const statusUpdate = buildDatabaseDemoFieldUpdate(reviewedRecord!, "recordStatus");
    await updateDatabaseDemoRecordField(writableDatabase, expenseRecordId, statusUpdate);
    runMaintenance(database);

    const snapshot = await loadDatabaseDemoSnapshot(writableDatabase, expenseRecordId);
    const selectedRecord = snapshot.snapshot.recentRecords.find(
      (record) => record.recordId === createDatabaseDemoRecordId(2),
    );
    const taxLines = await loadTaxLines(writableDatabase, {
      entityId: databaseDemoIds.entityId,
      scheduleCodes: ["schedule_c", "schedule_se"],
      statuses: ["direct", "derived"],
      taxYear: 2026,
    });

    expect(selectedRecord).toMatchObject({
      description: "Office receipt 2 reviewed",
      status: "reconciled",
    });
    expect(taxLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amountCents: 12_500,
          lineKey: "schedule_c.line1",
          lineStatus: "direct",
        }),
        expect.objectContaining({
          amountCents: 4_850,
          lineKey: "schedule_c.line27b",
          lineStatus: "direct",
        }),
        expect.objectContaining({
          amountCents: 7_650,
          lineKey: "schedule_c.line31",
          lineStatus: "derived",
        }),
        expect.objectContaining({
          amountCents: 7_650,
          lineKey: "schedule_se.line2",
          lineStatus: "derived",
        }),
      ]),
    );
  });
});
