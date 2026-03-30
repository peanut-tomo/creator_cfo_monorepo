import { describe, expect, it } from "vitest";

import {
  buildScheduleCAggregation,
  deriveScheduleCPartVLabel,
  type ScheduleCCandidateRecord,
} from "../src/index";

function createCandidateRecord(
  overrides: Partial<ScheduleCCandidateRecord> = {},
): ScheduleCCandidateRecord {
  return {
    businessUseBps: 10_000,
    cashOn: "2026-03-15",
    categoryCode: null,
    currency: "USD",
    description: "Default record",
    grossAmountCents: 0,
    memo: null,
    primaryAmountCents: 0,
    recordId: "record-1",
    recordKind: "expense",
    recordStatus: "posted",
    subcategoryCode: null,
    taxCategoryCode: null,
    taxLineCode: "line18",
    ...overrides,
  };
}

describe("schedule c aggregation contract", () => {
  it("aggregates authoritative line1 mappings from posted cash-basis USD income records", () => {
    const result = buildScheduleCAggregation([
      createCandidateRecord({
        description: "Platform payout A",
        grossAmountCents: 120_000,
        primaryAmountCents: 0,
        recordId: "income-1",
        recordKind: "platform_payout",
        taxLineCode: "line1",
      }),
      createCandidateRecord({
        description: "Platform payout B",
        grossAmountCents: 85_000,
        primaryAmountCents: 0,
        recordId: "income-2",
        recordKind: "income",
        recordStatus: "reconciled",
        taxLineCode: "line1",
      }),
      createCandidateRecord({
        description: "Ignored draft payout",
        grossAmountCents: 999_999,
        primaryAmountCents: 0,
        recordId: "income-draft",
        recordKind: "platform_payout",
        recordStatus: "draft",
        taxLineCode: "line1",
      }),
    ]);

    expect(result.lineAmounts.line1).toMatchObject({
      amountCents: 205_000,
      currency: "USD",
      matchedRecordCount: 2,
    });
    expect(result.lineReviewNotes.line1).toBeUndefined();
  });

  it("applies business use to supported expense lines and preserves readable labels", () => {
    const result = buildScheduleCAggregation([
      createCandidateRecord({
        businessUseBps: 7_500,
        categoryCode: "office",
        description: "Desk subscription",
        primaryAmountCents: 20_000,
        recordId: "expense-1",
        subcategoryCode: "software",
        taxCategoryCode: "schedule-c-office",
        taxLineCode: "line18",
      }),
    ]);

    expect(result.lineAmounts.line18).toMatchObject({
      amountCents: 15_000,
      currency: "USD",
      matchedRecordCount: 1,
      readableCategoryLabels: ["office", "schedule-c-office", "software"],
    });
  });

  it("groups part v rows by readable label and rolls them into line27a", () => {
    const result = buildScheduleCAggregation([
      createCandidateRecord({
        description: "Studio props",
        primaryAmountCents: 8_450,
        recordId: "partv-1",
        taxLineCode: "line27a",
      }),
      createCandidateRecord({
        description: "Studio props",
        primaryAmountCents: 3_550,
        recordId: "partv-2",
        taxLineCode: "line27a",
      }),
      createCandidateRecord({
        categoryCode: "admin-tools",
        description: "",
        primaryAmountCents: 2_500,
        recordId: "partv-3",
        taxLineCode: "line27a",
      }),
    ]);

    expect(result.lineAmounts.line27a).toMatchObject({
      amountCents: 14_500,
      matchedRecordCount: 3,
    });
    expect(result.partVRows).toEqual([
      expect.objectContaining({
        amountCents: 12_000,
        label: "Studio props",
        matchedRecordCount: 2,
      }),
      expect.objectContaining({
        amountCents: 2_500,
        label: "admin-tools",
        matchedRecordCount: 1,
      }),
    ]);
  });

  it("marks a line review-required when mapped records are missing cash_on", () => {
    const result = buildScheduleCAggregation([
      createCandidateRecord({
        cashOn: null,
        primaryAmountCents: 12_000,
        recordId: "expense-missing-cash",
        taxLineCode: "line18",
      }),
    ]);

    expect(result.lineAmounts.line18).toBeUndefined();
    expect(result.lineReviewNotes.line18).toContain("missing cash-basis dates");
  });

  it("marks part v review-required when mapped records use non-USD currency", () => {
    const result = buildScheduleCAggregation([
      createCandidateRecord({
        currency: "EUR",
        description: "Foreign contractor fee",
        primaryAmountCents: 42_000,
        recordId: "partv-eur",
        taxLineCode: "line27a",
      }),
    ]);

    expect(result.lineAmounts.line27a).toBeUndefined();
    expect(result.partVRows).toEqual([]);
    expect(result.partVReviewNote).toContain("non-USD currency");
  });

  it("derives a fallback part v label from non-description metadata", () => {
    expect(
      deriveScheduleCPartVLabel({
        categoryCode: "office-misc",
        description: "   ",
        memo: null,
        subcategoryCode: null,
        taxCategoryCode: null,
      }),
    ).toBe("office-misc");
  });
});
