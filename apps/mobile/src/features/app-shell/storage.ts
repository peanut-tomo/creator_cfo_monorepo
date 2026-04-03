import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildDeviceStateStorageKey } from "@creator-cfo/storage";

import { coerceLocalePreference, coerceThemePreference, parseSession } from "./model";
import type { AppSession, ParseApiSettings, PersistedAppState } from "./types";

const STORAGE_KEYS = {
  localePreference: buildDeviceStateStorageKey("locale_preference"),
  openAiApiKey: buildDeviceStateStorageKey("openai_api_key"),
  parseApiBaseUrl: buildDeviceStateStorageKey("vercel_api_base_url"),
  session: buildDeviceStateStorageKey("auth_session"),
  themePreference: buildDeviceStateStorageKey("theme_preference"),
} as const;

export async function loadPersistedAppState(): Promise<PersistedAppState> {
  const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
  const values = Object.fromEntries(entries);

  return {
    localePreference: coerceLocalePreference(values[STORAGE_KEYS.localePreference]),
    openAiApiKey: (values[STORAGE_KEYS.openAiApiKey] ?? "").trim(),
    parseApiBaseUrl: (values[STORAGE_KEYS.parseApiBaseUrl] ?? "").trim(),
    session: parseSession(values[STORAGE_KEYS.session]),
    themePreference: coerceThemePreference(values[STORAGE_KEYS.themePreference]),
  };
}

export async function loadParseApiSettings(): Promise<ParseApiSettings> {
  const state = await loadPersistedAppState();

  return {
    openAiApiKey: state.openAiApiKey,
    parseApiBaseUrl: state.parseApiBaseUrl,
  };
}

export async function persistThemePreference(value: PersistedAppState["themePreference"]) {
  await AsyncStorage.setItem(STORAGE_KEYS.themePreference, value);
}

export async function persistLocalePreference(value: PersistedAppState["localePreference"]) {
  await AsyncStorage.setItem(STORAGE_KEYS.localePreference, value);
}

export async function persistOpenAiApiKey(value: string) {
  const normalized = value.trim();

  if (normalized) {
    await AsyncStorage.setItem(STORAGE_KEYS.openAiApiKey, normalized);
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.openAiApiKey);
}

export async function persistParseApiBaseUrl(value: string) {
  const normalized = value.trim().replace(/\/+$/g, "");

  if (normalized) {
    await AsyncStorage.setItem(STORAGE_KEYS.parseApiBaseUrl, normalized);
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.parseApiBaseUrl);
}

export async function persistSession(session: AppSession | null) {
  if (session) {
    await AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.session);
}
