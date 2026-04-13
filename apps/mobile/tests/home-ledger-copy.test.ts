import { describe, expect, it } from "vitest";

import { appCopy } from "../src/features/app-shell/copy";

describe("home and ledger copy", () => {
  it("keeps home and shell copy aligned across locales", () => {
    const english = appCopy.en;
    const chinese = appCopy["zh-CN"];

    expect(Object.keys(english.discover).sort()).toEqual(
      Object.keys(chinese.discover).sort(),
    );
    expect(Object.keys(english.homeScreen).sort()).toEqual(
      Object.keys(chinese.homeScreen).sort(),
    );
    expect(Object.keys(english.ledger.parse).sort()).toEqual(
      Object.keys(chinese.ledger.parse).sort(),
    );
    expect(Object.keys(english.ledger.upload).sort()).toEqual(
      Object.keys(chinese.ledger.upload).sort(),
    );
    expect(Object.keys(english.ledgerScreen).sort()).toEqual(
      Object.keys(chinese.ledgerScreen).sort(),
    );
    expect(Object.keys(english.ledgerScreen.badge).sort()).toEqual(
      Object.keys(chinese.ledgerScreen.badge).sort(),
    );
    expect(Object.keys(english.ledgerScreen.footer).sort()).toEqual(
      Object.keys(chinese.ledgerScreen.footer).sort(),
    );
    expect(Object.keys(english.ledgerScreen.modal).sort()).toEqual(
      Object.keys(chinese.ledgerScreen.modal).sort(),
    );
    expect(Object.keys(english.ledgerScreen.range).sort()).toEqual(
      Object.keys(chinese.ledgerScreen.range).sort(),
    );
    expect(Object.keys(english.ledgerScreen.scopes).sort()).toEqual(
      Object.keys(chinese.ledgerScreen.scopes).sort(),
    );
    expect(Object.keys(english.ledgerScreen.sections).sort()).toEqual(
      Object.keys(chinese.ledgerScreen.sections).sort(),
    );
    expect(Object.keys(english.login).sort()).toEqual(
      Object.keys(chinese.login).sort(),
    );
    expect(Object.keys(english.meScreen).sort()).toEqual(
      Object.keys(chinese.meScreen).sort(),
    );
    expect(Object.keys(english.tabs).sort()).toEqual(
      Object.keys(chinese.tabs).sort(),
    );
  });
});
