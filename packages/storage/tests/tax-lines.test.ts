import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import {
  loadTaxLine,
  loadTaxLineTrace,
  loadTaxLines,
  structuredStoreContract,
} from "../src/index";

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

function createReadableDatabase(database: DatabaseSync) {
  return {
    async getAllAsync<Row>(source: string, ...params: Array<string | number | null>) {
      return database.prepare(source).all({}, ...params) as Row[];
    },
    async getFirstAsync<Row>(source: string, ...params: Array<string | number | null>) {
      return (database.prepare(source).get({}, ...params) as Row | undefined) ?? null;
    },
  };
}

function seedTaxLineFixture(database: DatabaseSync): void {
  database
    .prepare(
      `INSERT INTO entities (
        entity_id,
        legal_name,
        entity_type,
        base_currency,
        default_timezone,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
    )
    .run(
      "entity-main",
      "Tax Line Fixture",
      "sole_proprietorship",
      "USD",
      "America/Los_Angeles",
      "2026-01-01T00:00:00.000Z",
    );

  database
    .prepare(
      `INSERT INTO tax_year_profiles (
        entity_id,
        tax_year,
        accounting_method,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?);`,
    )
    .run(
      "entity-main",
      2026,
      "cash",
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );

  const insertRecord = database.prepare(
    `INSERT INTO records (
      record_id,
      entity_id,
      record_kind,
      posting_pattern,
      record_status,
      source_system,
      description,
      recognition_on,
      cash_on,
      currency,
      primary_amount_cents,
      gross_amount_cents,
      business_use_bps,
      tax_category_code,
      tax_line_code,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
  );

  insertRecord.run(
    "income-1",
    "entity-main",
    "income",
    "gross_to_net_income",
    "posted",
    "tax-line-test",
    "Platform payout",
    "2026-01-05",
    "2026-01-05",
    "USD",
    0,
    250_000,
    10_000,
    null,
    "line1",
    "2026-01-05T00:00:00.000Z",
    "2026-01-05T00:00:00.000Z",
  );

  insertRecord.run(
    "expense-1",
    "entity-main",
    "expense",
    "simple_expense",
    "posted",
    "tax-line-test",
    "Other expense migrated line",
    "2026-01-20",
    "2026-01-20",
    "USD",
    40_000,
    0,
    10_000,
    "schedule-c-other-expense",
    "line27a",
    "2026-01-20T00:00:00.000Z",
    "2026-01-20T00:00:00.000Z",
  );

  insertRecord.run(
    "expense-review-nonusd",
    "entity-main",
    "expense",
    "simple_expense",
    "posted",
    "tax-line-test",
    "Foreign currency expense",
    "2026-02-01",
    "2026-02-01",
    "EUR",
    10_000,
    0,
    10_000,
    null,
    "line18",
    "2026-02-01T00:00:00.000Z",
    "2026-02-01T00:00:00.000Z",
  );

  database
    .prepare(
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
    )
    .run(
      "entity-main",
      2026,
      "schedule_c.line30",
      "provided",
      5_000,
      "Home office amount",
      "2026-02-02T00:00:00.000Z",
      "2026-02-02T00:00:00.000Z",
    );

  for (const statement of structuredStoreContract.maintenanceStatements) {
    database.exec(statement);
  }
}

describe("tax line projection helpers", () => {
  it("loads filtered line rows from tax_lines_v", async () => {
    const database = createStorageDatabase();
    seedTaxLineFixture(database);
    const readableDatabase = createReadableDatabase(database);

    const rows = await loadTaxLines(readableDatabase, {
      entityId: "entity-main",
      formCodes: ["1040"],
      scheduleCodes: ["schedule_c"],
      statuses: ["direct", "derived", "review_required"],
      taxYear: 2026,
    });

    const line1 = rows.find((row) => row.lineKey === "schedule_c.line1");
    const line27b = rows.find((row) => row.lineKey === "schedule_c.line27b");
    const line31 = rows.find((row) => row.lineKey === "schedule_c.line31");

    expect(line1?.lineStatus).toBe("direct");
    expect(line1?.amountCents).toBe(250_000);
    expect(line27b?.lineStatus).toBe("direct");
    expect(line27b?.amountCents).toBe(40_000);
    expect(line31?.lineStatus).toBe("derived");
  });

  it("loads a single line and exposes contribution trace rows", async () => {
    const database = createStorageDatabase();
    seedTaxLineFixture(database);
    const readableDatabase = createReadableDatabase(database);
    const line = await loadTaxLine(readableDatabase, {
      entityId: "entity-main",
      lineKey: "schedule_c.line18",
      taxYear: 2026,
    });
    const trace = await loadTaxLineTrace(readableDatabase, {
      entityId: "entity-main",
      lineKey: "schedule_c.line18",
      taxYear: 2026,
    });

    expect(line?.lineStatus).toBe("review_required");
    expect(line?.blockingCodes).toContain("non_usd_currency");
    expect(trace).toEqual([
      expect.objectContaining({
        contributionStatus: "review_required",
        recordId: "expense-review-nonusd",
      }),
    ]);
  });
});
