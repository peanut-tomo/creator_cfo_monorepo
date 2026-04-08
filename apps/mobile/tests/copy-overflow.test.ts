import { describe, expect, it } from "vitest";

import { appCopy } from "../src/features/app-shell/copy";

describe("copy overflow guards", () => {
  it("keeps localized shell labels within reasonable lengths", () => {
    const zh = appCopy["zh-CN"];

    expect(zh.homeScreen.monthlyProfit.length).toBeLessThanOrEqual(8);
    expect(zh.homeScreen.recentActivityTitle.length).toBeLessThanOrEqual(8);
    expect(zh.tabs.ledger.length).toBeLessThanOrEqual(4);
    expect(zh.tabs.profile.length).toBeLessThanOrEqual(4);
    expect(zh.meScreen.databaseImportAction.length).toBeLessThanOrEqual(8);
  });
});
