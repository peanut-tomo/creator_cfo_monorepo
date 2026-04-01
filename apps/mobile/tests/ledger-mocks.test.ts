import { describe, expect, it } from "vitest";

import {
  getLedgerCardsForFilter,
  ledgerFilters,
  parseCategoryOptions,
  parseFieldSeeds,
} from "../src/features/ledger/ledger-mocks";

describe("ledger ui mocks", () => {
  it("keeps the ledger tab filters and cards wired for the upload/parse flow", () => {
    expect(ledgerFilters.map((filter) => filter.id)).toEqual(["income", "expenses", "spending"]);
    expect(getLedgerCardsForFilter("income")).toHaveLength(5);
    expect(getLedgerCardsForFilter("expenses")).toHaveLength(2);
    expect(getLedgerCardsForFilter("spending")).toHaveLength(1);
  });

  it("keeps the parse categories aligned with the spending terminology", () => {
    expect(parseCategoryOptions.map((option) => option.id)).toEqual(["income", "expense", "spending"]);
    expect(parseCategoryOptions.map((option) => option.title)).toContain("Spending");
  });

  it("defines editable parse fields including fund flow and summary", () => {
    expect(parseFieldSeeds.map((field) => field.id)).toEqual([
      "vendor",
      "amount",
      "date",
      "fundFlow",
      "summary",
    ]);
  });
});
