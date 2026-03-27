import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildDeviceStateStorageKey } from "@creator-cfo/storage";

import { coerceLocalePreference, coerceThemePreference, parseSession } from "./model";
import type { AppSession, PersistedAppState } from "./types";

const STORAGE_KEYS = {
  localePreference: buildDeviceStateStorageKey("locale_preference"),
  session: buildDeviceStateStorageKey("auth_session"),
  themePreference: buildDeviceStateStorageKey("theme_preference"),
} as const;

export async function loadPersistedAppState(): Promise<PersistedAppState> {
  const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
  const values = Object.fromEntries(entries);

  return {
    localePreference: coerceLocalePreference(values[STORAGE_KEYS.localePreference]),
    session: parseSession(values[STORAGE_KEYS.session]),
    themePreference: coerceThemePreference(values[STORAGE_KEYS.themePreference]),
  };
}

export async function persistThemePreference(value: PersistedAppState["themePreference"]) {
  await AsyncStorage.setItem(STORAGE_KEYS.themePreference, value);
}

export async function persistLocalePreference(value: PersistedAppState["localePreference"]) {
  await AsyncStorage.setItem(STORAGE_KEYS.localePreference, value);
}

export async function persistSession(session: AppSession | null) {
  if (session) {
    await AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.session);
}
