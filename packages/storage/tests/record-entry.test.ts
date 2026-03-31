import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import {
  persistResolvedStandardReceiptEntry,
  resolveStandardReceiptEntry,
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

function createWritableDatabase(database: DatabaseSync) {
  return {
    async getAllAsync<Row>(source: string, ...params: Array<string | number | null>) {
      return database.prepare(source).all({}, ...params) as Row[];
    },
    async getFirstAsync<Row>(source: string, ...params: Array<string | number | null>) {
      return (database.prepare(source).get({}, ...params) as Row | undefined) ?? null;
    },
    async runAsync(source: string, ...params: Array<string | number | null>) {
      return database.prepare(source).run(...params);
    },
  };
}

function seedResolverFixture(database: DatabaseSync): void {
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
      "Resolver Demo Books",
      "sole_proprietorship",
      "USD",
      "America/Los_Angeles",
      "2026-03-01T08:00:00.000Z",
    );

  const insertAccount = database.prepare(
    `INSERT INTO accounts (
      account_id,
      entity_id,
      account_code,
      account_name,
      account_type,
      normal_balance,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
  );

  const accounts = [
    ["account-cash", "1010", "Business Checking", "asset", "debit"],
    ["account-income", "4010", "Platform Revenue", "income", "credit"],
    ["account-expense", "6100", "Office Expense", "expense", "debit"],
    ["account-equity", "3010", "Owner Equity", "equity", "credit"],
  ] as const;

  for (const [accountId, accountCode, accountName, accountType, normalBalance] of accounts) {
    insertAccount.run(
      accountId,
      "entity-main",
      accountCode,
      accountName,
      accountType,
      normalBalance,
      "2026-03-01T08:00:00.000Z",
    );
  }
}

describe("standard receipt entry resolver", () => {
  it("resolves and persists income receipts into canonical line1-backed records", async () => {
    const database = createStorageDatabase();
    seedResolverFixture(database);
    const writableDatabase = createWritableDatabase(database);
    const resolvedEntry = resolveStandardReceiptEntry(
      {
        amountCents: 12_500,
        currency: "usd",
        description: "YouTube payout 1",
        entityId: "entity-main",
        occurredOn: "2026-03-29",
        userClassification: "income",
      },
      {
        cashAccountId: "account-cash",
        createdAt: "2026-03-29T09:00:00.000Z",
        expenseAccountId: "account-expense",
        incomeAccountId: "account-income",
        ownerEquityAccountId: "account-equity",
        recordId: "record-income",
        sourceSystem: "resolver-test",
        updatedAt: "2026-03-29T09:05:00.000Z",
      },
    );

    await persistResolvedStandardReceiptEntry(writableDatabase, resolvedEntry);

    expect(resolvedEntry.record).toMatchObject({
      businessUseBps: 10_000,
      grossAmountCents: 12_500,
      netCashAmountCents: 12_500,
      postingPattern: "gross_to_net_income",
      primaryAmountCents: 0,
      recordKind: "income",
      taxLineCode: "line1",
    });

    const storedRecord = database
      .prepare(
        `SELECT
          record_kind AS recordKind,
          posting_pattern AS postingPattern,
          gross_amount_cents AS grossAmountCents,
          net_cash_amount_cents AS netCashAmountCents,
          tax_line_code AS taxLineCode
        FROM records
        WHERE record_id = ?;`,
      )
      .get("record-income") as {
      grossAmountCents: number;
      netCashAmountCents: number;
      postingPattern: string;
      recordKind: string;
      taxLineCode: string | null;
    };
    const storedClassification = database
      .prepare(
        `SELECT
          user_classification AS userClassification,
          classification_status AS classificationStatus,
          resolver_code AS resolverCode
        FROM record_entry_classifications
        WHERE record_id = ?;`,
      )
      .get("record-income") as {
      classificationStatus: string;
      resolverCode: string;
      userClassification: string;
    };
    const storedTaxYearProfile = database
      .prepare(
        `SELECT
          entity_id AS entityId,
          tax_year AS taxYear,
          accounting_method AS accountingMethod
        FROM tax_year_profiles
        WHERE entity_id = ? AND tax_year = ?;`,
      )
      .get("entity-main", 2026) as {
      accountingMethod: string;
      entityId: string;
      taxYear: number;
    };

    expect(storedRecord).toEqual({
      grossAmountCents: 12_500,
      netCashAmountCents: 12_500,
      postingPattern: "gross_to_net_income",
      recordKind: "income",
      taxLineCode: "line1",
    });
    expect(storedClassification).toEqual({
      classificationStatus: "resolved",
      resolverCode: "income_line1_default",
      userClassification: "income",
    });
    expect(storedTaxYearProfile).toEqual({
      accountingMethod: "cash",
      entityId: "entity-main",
      taxYear: 2026,
    });
  });

  it("maps generic expense receipts to safe Part V defaults with business-use support", async () => {
    const database = createStorageDatabase();
    seedResolverFixture(database);
    const writableDatabase = createWritableDatabase(database);
    const resolvedEntry = resolveStandardReceiptEntry(
      {
        amountCents: 4_200,
        businessUseBps: 7_500,
        currency: "USD",
        description: "Office receipt 1",
        entityId: "entity-main",
        occurredOn: "2026-03-28",
        userClassification: "expense",
      },
      {
        cashAccountId: "account-cash",
        createdAt: "2026-03-28T09:00:00.000Z",
        expenseAccountId: "account-expense",
        incomeAccountId: "account-income",
        ownerEquityAccountId: "account-equity",
        recordId: "record-expense",
        sourceSystem: "resolver-test",
        updatedAt: "2026-03-28T09:05:00.000Z",
      },
    );

    await persistResolvedStandardReceiptEntry(writableDatabase, resolvedEntry);

    const storedRecord = database
      .prepare(
        `SELECT
          record_kind AS recordKind,
          posting_pattern AS postingPattern,
          primary_amount_cents AS primaryAmountCents,
          business_use_bps AS businessUseBps,
          tax_category_code AS taxCategoryCode,
          tax_line_code AS taxLineCode
        FROM records
        WHERE record_id = ?;`,
      )
      .get("record-expense") as {
      businessUseBps: number;
      postingPattern: string;
      primaryAmountCents: number;
      recordKind: string;
      taxCategoryCode: string | null;
      taxLineCode: string | null;
    };

    expect(storedRecord).toEqual({
      businessUseBps: 7_500,
      postingPattern: "simple_expense",
      primaryAmountCents: 4_200,
      recordKind: "expense",
      taxCategoryCode: "schedule-c-other-expense",
      taxLineCode: "line27b",
    });
  });

  it("resolves personal spending to owner draw without a tax line", async () => {
    const database = createStorageDatabase();
    seedResolverFixture(database);
    const writableDatabase = createWritableDatabase(database);
    const resolvedEntry = resolveStandardReceiptEntry(
      {
        amountCents: 2_100,
        currency: "USD",
        description: "Owner card spend 1",
        entityId: "entity-main",
        occurredOn: "2026-03-27",
        userClassification: "personal_spending",
      },
      {
        cashAccountId: "account-cash",
        createdAt: "2026-03-27T09:00:00.000Z",
        expenseAccountId: "account-expense",
        incomeAccountId: "account-income",
        ownerEquityAccountId: "account-equity",
        recordId: "record-personal",
        sourceSystem: "resolver-test",
        updatedAt: "2026-03-27T09:05:00.000Z",
      },
    );

    await persistResolvedStandardReceiptEntry(writableDatabase, resolvedEntry);

    const storedRecord = database
      .prepare(
        `SELECT
          record_kind AS recordKind,
          posting_pattern AS postingPattern,
          business_use_bps AS businessUseBps,
          tax_line_code AS taxLineCode
        FROM records
        WHERE record_id = ?;`,
      )
      .get("record-personal") as {
      businessUseBps: number;
      postingPattern: string;
      recordKind: string;
      taxLineCode: string | null;
    };

    expect(storedRecord).toEqual({
      businessUseBps: 0,
      postingPattern: "owner_draw",
      recordKind: "owner_draw",
      taxLineCode: null,
    });
  });
});
