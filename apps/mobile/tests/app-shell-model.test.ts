import { describe, expect, it } from "vitest";

import {
  coerceLocalePreference,
  coerceThemePreference,
  createAppleSession,
  parseSession,
  resolveLocale,
  resolveThemeName,
} from "../src/features/app-shell/model";

describe("app shell model", () => {
  it("falls back to system-safe theme and locale values", () => {
    expect(coerceThemePreference("night")).toBe("system");
    expect(coerceLocalePreference("fr-FR")).toBe("system");
    expect(resolveThemeName("system", "light")).toBe("light");
    expect(resolveLocale("system", "zh-Hans-CN")).toBe("zh-CN");
  });

  it("parses persisted Apple sessions and ignores invalid payloads", () => {
    const session = createAppleSession({
      email: "creator@example.com",
      familyName: "Finance",
      givenName: "Taylor",
      user: "apple-user-1",
    });

    expect(parseSession(JSON.stringify(session))).toMatchObject({
      appleUserId: "apple-user-1",
      displayName: "Taylor Finance",
      kind: "apple",
    });
    expect(parseSession("{bad json")).toBeNull();
  });
});
