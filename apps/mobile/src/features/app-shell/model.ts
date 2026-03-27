import type { AppThemeName } from "@creator-cfo/ui";

import type {
  AppSession,
  AppleSession,
  LocalePreference,
  ResolvedLocale,
  ThemePreference,
} from "./types";

export function resolveThemeName(
  themePreference: ThemePreference,
  systemTheme: AppThemeName | "unspecified" | null | undefined,
): AppThemeName {
  if (themePreference === "light" || themePreference === "dark") {
    return themePreference;
  }

  return systemTheme === "light" ? "light" : "dark";
}

export function resolveLocale(
  localePreference: LocalePreference,
  deviceLanguageTag: string | undefined,
): ResolvedLocale {
  if (localePreference === "en" || localePreference === "zh-CN") {
    return localePreference;
  }

  return deviceLanguageTag?.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

export function coerceThemePreference(value: string | null | undefined): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function coerceLocalePreference(value: string | null | undefined): LocalePreference {
  return value === "en" || value === "zh-CN" || value === "system" ? value : "system";
}

export function createGuestSession(): AppSession {
  return {
    kind: "guest",
    displayName: "Guest mode",
    startedAt: new Date().toISOString(),
  };
}

export function createAppleSession(input: {
  email?: string | null;
  familyName?: string | null;
  givenName?: string | null;
  user: string;
}): AppleSession {
  const displayName = [input.givenName, input.familyName].filter(Boolean).join(" ").trim();

  return {
    kind: "apple",
    appleUserId: input.user,
    email: input.email ?? null,
    displayName: displayName.length > 0 ? displayName : null,
    startedAt: new Date().toISOString(),
  };
}

export function parseSession(value: string | null | undefined): AppSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<AppSession>;

    if (parsed.kind === "guest" && typeof parsed.startedAt === "string") {
      return {
        kind: "guest",
        displayName: typeof parsed.displayName === "string" ? parsed.displayName : "Guest mode",
        startedAt: parsed.startedAt,
      };
    }

    if (
      parsed.kind === "apple" &&
      typeof parsed.appleUserId === "string" &&
      typeof parsed.startedAt === "string"
    ) {
      return {
        kind: "apple",
        appleUserId: parsed.appleUserId,
        email: typeof parsed.email === "string" || parsed.email === null ? parsed.email : null,
        displayName:
          typeof parsed.displayName === "string" || parsed.displayName === null
            ? parsed.displayName
            : null,
        startedAt: parsed.startedAt,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function getSessionDisplayName(session: AppSession | null): string {
  if (!session) {
    return "Signed out";
  }

  if (session.kind === "guest") {
    return session.displayName;
  }

  return session.displayName ?? session.email ?? "Apple ID";
}
