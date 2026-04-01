import { describe, expect, it } from "vitest";

import { getAppCopy } from "../src/features/app-shell/copy";
import { buildTabScreenSpecs } from "../src/features/navigation/tab-config";

describe("tab screen specs", () => {
  it("keeps three routes with localized labels and icon bindings", () => {
    const englishSpecs = buildTabScreenSpecs(getAppCopy("en"));
    const chineseSpecs = buildTabScreenSpecs(getAppCopy("zh-CN"));

    expect(englishSpecs.map((screen) => screen.name)).toEqual(["index", "ledger", "profile"]);
    expect(englishSpecs.map((screen) => screen.icon)).toEqual(["home", "ledger", "profile"]);
    expect(chineseSpecs.map((screen) => screen.title)).toEqual(["首页", "记账", "设置"]);
  });
});
