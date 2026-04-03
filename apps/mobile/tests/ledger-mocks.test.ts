import { describe, expect, it } from "vitest";

import {
  parseCategoryOptions,
  parseFieldSeeds,
} from "../src/features/ledger/ledger-mocks";

describe("ledger ui mocks", () => {
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
