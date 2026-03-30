import { describe, expect, it } from "vitest";

import { buildScheduleCAggregation, buildSupportedScheduleCNetProfitPreview } from "../src/index";

import type { ScheduleCCandidateRecord } from "../src/index";

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

describe("schedule se support preview contract", () => {
  it("derives a partial Schedule C net-profit preview from supported line mappings", () => {
    const aggregation = buildScheduleCAggregation([
      createCandidateRecord({
        description: "Platform payout",
        grossAmountCents: 500_000,
        primaryAmountCents: 0,
        recordId: "income-1",
        recordKind: "platform_payout",
        taxLineCode: "line1",
      }),
      createCandidateRecord({
        description: "Office tools",
        primaryAmountCents: 40_000,
        recordId: "expense-1",
        taxLineCode: "line18",
      }),
      createCandidateRecord({
        description: "Studio props",
        primaryAmountCents: 10_000,
        recordId: "expense-2",
        taxLineCode: "line27a",
      }),
    ]);
    const preview = buildSupportedScheduleCNetProfitPreview(aggregation);

    expect(preview).toMatchObject({
      currency: "USD",
      deductibleExpensesCents: 50_000,
      grossReceiptsCents: 500_000,
      netProfitCents: 450_000,
    });
    expect(preview.sourceNote).toContain("line1");
    expect(preview.sourceNote).toContain("line18");
    expect(preview.sourceNote).toContain("line27a");
  });

  it("blocks the downstream preview when a mapped Schedule C line is review-required", () => {
    const aggregation = buildScheduleCAggregation([
      createCandidateRecord({
        cashOn: null,
        primaryAmountCents: 12_000,
        recordId: "expense-review",
        taxLineCode: "line18",
      }),
    ]);
    const preview = buildSupportedScheduleCNetProfitPreview(aggregation);

    expect(preview.netProfitCents).toBeNull();
    expect(preview.sourceNote).toContain("still need review");
  });
});
