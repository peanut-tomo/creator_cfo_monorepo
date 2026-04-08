import { describe, expect, it } from "vitest";

import { appCopy } from "../src/features/app-shell/copy";

describe("home and ledger copy", () => {
  it("keeps home and shell copy aligned across locales", () => {
    const english = appCopy.en;
    const chinese = appCopy["zh-CN"];

    expect(Object.keys(english.homeScreen).sort()).toEqual(Object.keys(chinese.homeScreen).sort());
    expect(Object.keys(english.meScreen).sort()).toEqual(Object.keys(chinese.meScreen).sort());
    expect(Object.keys(english.tabs).sort()).toEqual(Object.keys(chinese.tabs).sort());
  });
});
