import { describe, expect, it } from "vitest";

import {
  buildLedgerPeriodIdForSegment,
  buildLedgerPeriodIdForYear,
} from "../src/features/ledger/ledger-screen-state";

describe("useLedgerScreen helpers", () => {
  it("builds the next period id when the user changes only the segment", () => {
    expect(buildLedgerPeriodIdForSegment(2026, "full-year")).toBe("2026:full-year");
    expect(buildLedgerPeriodIdForSegment(2026, "q2")).toBe("2026:q2");
    expect(buildLedgerPeriodIdForSegment(2026, "m08")).toBe("2026:m08");
  });

  it("builds the next period id when the user changes only the year", () => {
    expect(buildLedgerPeriodIdForYear("2024", "q3")).toBe("2024:q3");
    expect(buildLedgerPeriodIdForYear("2021", "m02")).toBe("2021:m02");
  });

  it("rejects invalid years instead of mutating hook state to a broken period id", () => {
    expect(buildLedgerPeriodIdForYear("abc", "m04")).toBeNull();
    expect(buildLedgerPeriodIdForYear("20.5", "full-year")).toBeNull();
  });
});
