import { describe, expect, it } from "vitest";

import {
  buildLedgerPeriodId,
  getDefaultLedgerPeriodId,
  loadLedgerSnapshot,
  ledgerPostableStatuses,
  resolveLedgerPeriodOption,
} from "../src/features/ledger/ledger-reporting";
import type { ReadableStorageDatabase } from "@creator-cfo/storage";

interface FakeLedgerRecordRow {
  amountCents: number;
  businessUseBps: number;
  createdAt: string;
  currency: string;
  description: string;
  entityId: string;
  memo: string | null;
  occurredOn: string;
  recordId: string;
  recordKind: "expense" | "income" | "personal_spending";
  recordStatus: string;
  sourceLabel: string;
  targetLabel: string;
  taxLineCode: string | null;
}

describe("ledger reporting", () => {
  it("loads business-only reporting rows for the selected range and excludes personal spending", async () => {
    const database = createFakeLedgerDatabase([
      {
        amountCents: 120_000,
        businessUseBps: 10_000,
        createdAt: "2026-04-02T10:00:00Z",
        currency: "USD",
        description: "Brand sponsorship",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-04-02",
        recordId: "record-income-april",
        recordKind: "income",
        recordStatus: "posted",
        sourceLabel: "TechDaily",
        targetLabel: "Creator CFO",
        taxLineCode: "line1",
      },
      {
        amountCents: 25_000,
        businessUseBps: 10_000,
        createdAt: "2026-04-01T12:00:00Z",
        currency: "USD",
        description: "Editing subscription",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-04-01",
        recordId: "record-expense-april",
        recordKind: "expense",
        recordStatus: "reconciled",
        sourceLabel: "Creator CFO",
        targetLabel: "Adobe",
        taxLineCode: "line27a",
      },
      {
        amountCents: 6_000,
        businessUseBps: 10_000,
        createdAt: "2026-04-01T13:00:00Z",
        currency: "USD",
        description: "Personal lunch",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-04-01",
        recordId: "record-personal-april",
        recordKind: "personal_spending",
        recordStatus: "posted",
        sourceLabel: "Creator CFO",
        targetLabel: "Cafe",
        taxLineCode: null,
      },
      {
        amountCents: 80_000,
        businessUseBps: 10_000,
        createdAt: "2026-03-20T12:00:00Z",
        currency: "USD",
        description: "March consulting",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-03-20",
        recordId: "record-income-march",
        recordKind: "income",
        recordStatus: "posted",
        sourceLabel: "Launch Labs",
        targetLabel: "Creator CFO",
        taxLineCode: "line1",
      },
      {
        amountCents: 9_900,
        businessUseBps: 10_000,
        createdAt: "2026-04-03T12:00:00Z",
        currency: "USD",
        description: "Draft expense",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-04-03",
        recordId: "record-draft-april",
        recordKind: "expense",
        recordStatus: "draft",
        sourceLabel: "Creator CFO",
        targetLabel: "Vendor",
        taxLineCode: "line27a",
      },
    ]);

    const snapshot = await loadLedgerSnapshot(database, {
      now: "2026-04-03",
      preferredPeriodId: buildLedgerPeriodId(2026, "m04"),
    });

    expect(ledgerPostableStatuses).toEqual(["posted", "reconciled"]);
    expect(snapshot.selectedPeriod.id).toBe("2026:m04");
    expect(snapshot.generalLedger.entries).toHaveLength(2);
    expect(snapshot.generalLedger.recordCountLabel).toBe("2 records");
    expect(snapshot.generalLedger.entries.map((entry) => entry.title)).toEqual([
      "Brand sponsorship",
      "Editing subscription",
    ]);
    expect(snapshot.profitAndLoss.metricCards.map((card) => card.value)).toEqual([
      "$1,200.00",
      "$250.00",
    ]);
    expect(snapshot.profitAndLoss.netIncomeLabel).toBe("$950.00");
    expect(snapshot.profitAndLoss.expenseRows[0]?.label).toBe("Adobe");
    expect(snapshot.balanceSheet.metricCards.map((card) => card.value)).toEqual([
      "$950.00",
      "$0.00",
    ]);
    expect(snapshot.selectedScope).toBe("business");
  });

  it("loads personal spending separately when the ledger scope switches to personal", async () => {
    const database = createFakeLedgerDatabase([
      {
        amountCents: 120_000,
        businessUseBps: 10_000,
        createdAt: "2026-04-02T10:00:00Z",
        currency: "USD",
        description: "Brand sponsorship",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-04-02",
        recordId: "record-income-april",
        recordKind: "income",
        recordStatus: "posted",
        sourceLabel: "TechDaily",
        targetLabel: "Creator CFO",
        taxLineCode: "line1",
      },
      {
        amountCents: 6_000,
        businessUseBps: 2_500,
        createdAt: "2026-04-01T13:00:00Z",
        currency: "USD",
        description: "Personal lunch",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-04-01",
        recordId: "record-personal-april",
        recordKind: "personal_spending",
        recordStatus: "posted",
        sourceLabel: "Creator CFO",
        targetLabel: "Cafe",
        taxLineCode: null,
      },
    ]);

    const snapshot = await loadLedgerSnapshot(database, {
      now: "2026-04-03",
      preferredPeriodId: buildLedgerPeriodId(2026, "m04"),
      scopeId: "personal",
    });

    expect(snapshot.selectedScope).toBe("personal");
    expect(snapshot.generalLedger.entries).toHaveLength(1);
    expect(snapshot.generalLedger.entries[0]?.title).toBe("Personal lunch");
    expect(snapshot.generalLedger.entries[0]?.kindLabel).toBe("Personal");
    expect(snapshot.generalLedger.metricCards.map((card) => card.value)).toEqual([
      "$60.00",
      "1",
    ]);
    expect(snapshot.profitAndLoss.metricCards.map((card) => card.value)).toEqual([
      "$0.00",
      "$60.00",
    ]);
    expect(snapshot.balanceSheet.metricCards.map((card) => card.value)).toEqual([
      "$0.00",
      "$0.00",
    ]);
  });

  it("supports year, quarter, and month selection while respecting business-use adjustments", async () => {
    const database = createFakeLedgerDatabase([
      {
        amountCents: 100_000,
        businessUseBps: 10_000,
        createdAt: "2026-04-02T10:00:00Z",
        currency: "USD",
        description: "Course launch",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-04-02",
        recordId: "record-income-april",
        recordKind: "income",
        recordStatus: "posted",
        sourceLabel: "Students",
        targetLabel: "Creator CFO",
        taxLineCode: "line1",
      },
      {
        amountCents: 40_000,
        businessUseBps: 5_000,
        createdAt: "2026-03-18T10:00:00Z",
        currency: "USD",
        description: "Shared equipment",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-03-18",
        recordId: "record-expense-march",
        recordKind: "expense",
        recordStatus: "posted",
        sourceLabel: "Creator CFO",
        targetLabel: "Camera Shop",
        taxLineCode: "line27a",
      },
    ]);

    const snapshot = await loadLedgerSnapshot(database, {
      now: "2026-04-03",
      preferredPeriodId: buildLedgerPeriodId(2026, "full-year"),
    });

    expect(snapshot.selectedPeriod.id).toBe("2026:full-year");
    expect(snapshot.generalLedger.entries).toHaveLength(2);
    expect(snapshot.profitAndLoss.metricCards.map((card) => card.value)).toEqual([
      "$1,000.00",
      "$200.00",
    ]);
    expect(snapshot.profitAndLoss.netIncomeLabel).toBe("$800.00");
    expect(snapshot.yearOptions[0]?.id).toBe("2026");
    expect(snapshot.yearOptions[snapshot.yearOptions.length - 1]?.id).toBe("2018");
    expect(snapshot.segmentOptions.map((option) => option.id)).toEqual([
      "full-year",
      "q1",
      "q2",
      "q3",
      "q4",
      "m01",
      "m02",
      "m03",
      "m04",
      "m05",
      "m06",
      "m07",
      "m08",
      "m09",
      "m10",
      "m11",
      "m12",
    ]);
  });

  it("derives a funding gap on the balance sheet when expenses exceed income", async () => {
    const database = createFakeLedgerDatabase([
      {
        amountCents: 15_000,
        businessUseBps: 10_000,
        createdAt: "2026-07-03T10:00:00Z",
        currency: "USD",
        description: "Camera rental",
        entityId: "entity-main",
        memo: null,
        occurredOn: "2026-07-03",
        recordId: "record-expense-july",
        recordKind: "expense",
        recordStatus: "posted",
        sourceLabel: "Creator CFO",
        targetLabel: "Studio Supply",
        taxLineCode: "line27a",
      },
    ]);

    const snapshot = await loadLedgerSnapshot(database, {
      now: "2026-07-10",
      preferredPeriodId: buildLedgerPeriodId(2026, "m07"),
    });

    expect(snapshot.balanceSheet.metricCards.map((card) => card.value)).toEqual([
      "$0.00",
      "$150.00",
    ]);
    expect(snapshot.balanceSheet.liabilityRows[0]?.label).toBe("Owner funding gap (derived)");
    expect(snapshot.balanceSheet.equityRows[0]?.amount).toBe("-$150.00");
  });

  it("resolves valid period ids and falls back cleanly for invalid ones", () => {
    const selected = resolveLedgerPeriodOption("2024:q3", [
      { id: "2025", label: "2025", year: 2025 },
      { id: "2024", label: "2024", year: 2024 },
    ]);
    const missing = resolveLedgerPeriodOption("2017:full-year", [
      { id: "2024", label: "2024", year: 2024 },
    ]);

    expect(selected?.id).toBe("2024:q3");
    expect(selected?.startDate).toBe("2024-07-01");
    expect(selected?.endDate).toBe("2024-09-30");
    expect(missing).toBeNull();
    expect(getDefaultLedgerPeriodId("2026-11-19")).toBe("2026:m11");
  });
});

function createFakeLedgerDatabase(
  rows: readonly FakeLedgerRecordRow[],
): ReadableStorageDatabase {
  return {
    async getAllAsync<Row>(source: string, ...params: unknown[]) {
      if (!source.includes("FROM records")) {
        throw new Error(`Unexpected query: ${source}`);
      }

      const [entityId, startDate, endDate] = params as [string, string, string];
      const allowedKinds = getAllowedKindsFromQuery(source);
      const filtered = rows
        .filter((row) => row.entityId === entityId)
        .filter((row) => allowedKinds.includes(row.recordKind))
        .filter((row) => ledgerPostableStatuses.includes(row.recordStatus as (typeof ledgerPostableStatuses)[number]))
        .filter((row) => row.occurredOn >= startDate && row.occurredOn <= endDate)
        .sort((left, right) =>
          right.occurredOn.localeCompare(left.occurredOn) ||
          right.createdAt.localeCompare(left.createdAt) ||
          right.recordId.localeCompare(left.recordId),
        )
        .map((row) => ({
          amountCents: row.amountCents,
          businessUseBps: row.businessUseBps,
          createdAt: row.createdAt,
          currency: row.currency,
          description: row.description,
          memo: row.memo,
          occurredOn: row.occurredOn,
          recordId: row.recordId,
          recordKind: row.recordKind,
          sourceLabel: row.sourceLabel,
          targetLabel: row.targetLabel,
          taxLineCode: row.taxLineCode,
        }));

      return filtered as Row[];
    },
    async getFirstAsync<Row>(source: string, ...params: unknown[]) {
      if (!source.includes("MIN(occurred_on)")) {
        throw new Error(`Unexpected query: ${source}`);
      }

      const [entityId] = params as [string];
      const allowedKinds = getAllowedKindsFromQuery(source);
      const filtered = rows
        .filter((row) => row.entityId === entityId)
        .filter((row) => allowedKinds.includes(row.recordKind))
        .filter((row) => ledgerPostableStatuses.includes(row.recordStatus as (typeof ledgerPostableStatuses)[number]));

      if (!filtered.length) {
        return {
          maxOccurredOn: null,
          minOccurredOn: null,
        } as Row;
      }

      const occurredOnValues = filtered.map((row) => row.occurredOn).sort();

      return {
        maxOccurredOn: occurredOnValues[occurredOnValues.length - 1] ?? null,
        minOccurredOn: occurredOnValues[0] ?? null,
      } as Row;
    },
  };
}

function getAllowedKindsFromQuery(source: string): FakeLedgerRecordRow["recordKind"][] {
  if (source.includes("('personal_spending')")) {
    return ["personal_spending"];
  }

  return ["income", "expense"];
}
