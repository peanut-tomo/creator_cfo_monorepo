import { describe, expect, it } from "vitest";

import { formatDiscoverPublishedDate } from "../src/features/discover/discover-localization";

describe("discover localization", () => {
  it("formats published dates with the app locale", () => {
    expect(formatDiscoverPublishedDate("2026-03-27T08:00:00.000Z", "en")).toBe(
      "3/27/2026",
    );
    expect(
      formatDiscoverPublishedDate("2026-03-27T08:00:00.000Z", "zh-CN"),
    ).toBe("2026/3/27");
  });
});
