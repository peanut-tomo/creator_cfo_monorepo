import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import {
  buildTaxYearDateRange,
  loadEntityLegalName,
  loadScheduleCAggregation,
  loadScheduleCCandidateRecords,
  loadScheduleSEPreview,
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

function seedTaxQueryFixture(
  database: DatabaseSync,
  options?: {
    accountingMethod?: "accrual" | "cash";
    includeReviewRow?: boolean;
  },
): void {
  const accountingMethod = options?.accountingMethod ?? "cash";
  const includeReviewRow = options?.includeReviewRow ?? false;

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
      "Scoped Tax Demo Books",
      "sole_proprietorship",
      "USD",
      "America/Los_Angeles",
      "2025-01-01T08:00:00.000Z",
    );
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
      "entity-other",
      "Other Books",
      "sole_proprietorship",
      "USD",
      "America/New_York",
      "2025-01-02T08:00:00.000Z",
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
      accountingMethod,
      "2026-01-01T08:00:00.000Z",
      "2026-01-01T08:00:00.000Z",
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
      tax_line_code,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
  );

  insertRecord.run(
    "income-2025",
    "entity-main",
    "income",
    "gross_to_net_income",
    "posted",
    "tax-query-test",
    "December payout",
    "2025-12-31",
    "2025-12-31",
    "USD",
    0,
    100_000,
    10_000,
    "line1",
    "2025-12-31T09:00:00.000Z",
    "2025-12-31T09:05:00.000Z",
  );
  insertRecord.run(
    "income-2026",
    "entity-main",
    "income",
    "gross_to_net_income",
    "posted",
    "tax-query-test",
    "January payout",
    "2026-01-15",
    "2026-01-15",
    "USD",
    0,
    250_000,
    10_000,
    "line1",
    "2026-01-15T09:00:00.000Z",
    "2026-01-15T09:05:00.000Z",
  );
  insertRecord.run(
    "expense-2026-partv",
    "entity-main",
    "expense",
    "simple_expense",
    "posted",
    "tax-query-test",
    "Studio props",
    "2026-03-05",
    "2026-03-05",
    "USD",
    45_000,
    0,
    10_000,
    "line27a",
    "2026-03-05T09:00:00.000Z",
    "2026-03-05T09:05:00.000Z",
  );
  insertRecord.run(
    "income-other-entity",
    "entity-other",
    "income",
    "gross_to_net_income",
    "posted",
    "tax-query-test",
    "Other entity payout",
    "2026-02-01",
    "2026-02-01",
    "USD",
    0,
    999_999,
    10_000,
    "line1",
    "2026-02-01T09:00:00.000Z",
    "2026-02-01T09:05:00.000Z",
  );

  if (includeReviewRow) {
    insertRecord.run(
      "expense-2026-review",
      "entity-main",
      "expense",
      "simple_expense",
      "posted",
      "tax-query-test",
      "Missing cash date",
      "2026-02-01",
      null,
      "USD",
      5_000,
      0,
      10_000,
      "line18",
      "2026-02-01T09:00:00.000Z",
      "2026-02-01T09:05:00.000Z",
    );
  }
}

describe("tax query helpers", () => {
  it("builds stable calendar-year ranges and loads the scoped legal name", async () => {
    const database = createStorageDatabase();
    seedTaxQueryFixture(database);
    const readableDatabase = createReadableDatabase(database);

    expect(buildTaxYearDateRange(2026)).toEqual({
      endExclusiveOn: "2027-01-01",
      startOn: "2026-01-01",
    });
    await expect(loadEntityLegalName(readableDatabase, "entity-main")).resolves.toBe(
      "Scoped Tax Demo Books",
    );
  });

  it("filters Schedule C candidates by entity and tax year", async () => {
    const database = createStorageDatabase();
    seedTaxQueryFixture(database, { includeReviewRow: true });
    const readableDatabase = createReadableDatabase(database);
    const candidates = await loadScheduleCCandidateRecords(readableDatabase, {
      entityId: "entity-main",
      taxYear: 2026,
    });

    expect(candidates.map((candidate) => candidate.recordId)).toEqual([
      "income-2026",
      "expense-2026-review",
      "expense-2026-partv",
    ]);
  });

  it("derives Schedule C aggregation and Schedule SE preview from one shared scope", async () => {
    const database = createStorageDatabase();
    seedTaxQueryFixture(database);
    const readableDatabase = createReadableDatabase(database);
    const aggregation = await loadScheduleCAggregation(readableDatabase, {
      entityId: "entity-main",
      taxYear: 2026,
    });
    const preview = await loadScheduleSEPreview(readableDatabase, {
      entityId: "entity-main",
      taxYear: 2026,
    });

    expect(aggregation.lineAmounts.line1?.amountCents).toBe(250_000);
    expect(aggregation.lineAmounts.line27a?.amountCents).toBe(45_000);
    expect(preview).toMatchObject({
      currency: "USD",
      deductibleExpensesCents: 45_000,
      grossReceiptsCents: 250_000,
      netProfitCents: 205_000,
    });
  });

  it("rejects unsupported accounting methods from tax_year_profiles", async () => {
    const database = createStorageDatabase();
    seedTaxQueryFixture(database, { accountingMethod: "accrual" });
    const readableDatabase = createReadableDatabase(database);

    await expect(
      loadScheduleCCandidateRecords(readableDatabase, {
        entityId: "entity-main",
        taxYear: 2026,
      }),
    ).rejects.toThrow(/Only cash accounting_method is supported/);
  });
});
