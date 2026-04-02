export type ThemePreference = "system" | "light" | "dark";
export type LocalePreference = "system" | "en" | "zh-CN";
export type ResolvedLocale = "en" | "zh-CN";

export interface GuestSession {
  kind: "guest";
  displayName: string;
  startedAt: string;
}

export interface AppleSession {
  kind: "apple";
  appleUserId: string;
  email: string | null;
  displayName: string | null;
  startedAt: string;
}

export type AppSession = GuestSession | AppleSession;

export interface ParseApiSettings {
  openAiApiKey: string;
  parseApiBaseUrl: string;
}

export interface PersistedAppState {
  localePreference: LocalePreference;
  openAiApiKey: string;
  parseApiBaseUrl: string;
  session: AppSession | null;
  themePreference: ThemePreference;
}
