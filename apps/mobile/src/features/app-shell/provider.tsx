import { getLocales } from "expo-localization";
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";
import { surfaceThemes } from "@creator-cfo/ui";

import { getAppCopy } from "./copy";
import {
  createAppleSession,
  createGuestSession,
  getSessionDisplayName,
  resolveLocale,
  resolveThemeName,
} from "./model";
import {
  loadPersistedAppState,
  persistLocalePreference,
  persistSession,
  persistThemePreference,
} from "./storage";
import type {
  AppSession,
  LocalePreference,
  PersistedAppState,
  ThemePreference,
} from "./types";

interface AppShellContextValue {
  continueAsGuest: () => Promise<void>;
  copy: ReturnType<typeof getAppCopy>;
  isHydrated: boolean;
  localePreference: LocalePreference;
  palette: (typeof surfaceThemes)[keyof typeof surfaceThemes];
  session: AppSession | null;
  sessionDisplayName: string;
  setLocalePreference: (value: LocalePreference) => Promise<void>;
  setThemePreference: (value: ThemePreference) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithApple: (input: {
    email?: string | null;
    familyName?: string | null;
    givenName?: string | null;
    user: string;
  }) => Promise<void>;
  themePreference: ThemePreference;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

const initialState: PersistedAppState = {
  localePreference: "system",
  session: null,
  themePreference: "system",
};

export function AppShellProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  const deviceLanguageTag = getLocales()[0]?.languageTag;
  const [state, setState] = useState<PersistedAppState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadPersistedAppState()
      .then((persistedState) => {
        if (isMounted) {
          setState(persistedState);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedTheme = resolveThemeName(state.themePreference, systemTheme);
  const resolvedLocale = resolveLocale(state.localePreference, deviceLanguageTag);
  const palette = surfaceThemes[resolvedTheme];
  const copy = getAppCopy(resolvedLocale);

  const setThemePreference = async (value: ThemePreference) => {
    setState((current) => ({ ...current, themePreference: value }));
    await persistThemePreference(value);
  };

  const setLocalePreference = async (value: LocalePreference) => {
    setState((current) => ({ ...current, localePreference: value }));
    await persistLocalePreference(value);
  };

  const setSession = async (session: AppSession | null) => {
    setState((current) => ({ ...current, session }));
    await persistSession(session);
  };

  const contextValue: AppShellContextValue = {
    continueAsGuest: async () => {
      await setSession(createGuestSession());
    },
    copy,
    isHydrated,
    localePreference: state.localePreference,
    palette,
    session: state.session,
    sessionDisplayName: getSessionDisplayName(state.session),
    setLocalePreference,
    setThemePreference,
    signOut: async () => {
      await setSession(null);
    },
    signInWithApple: async (input) => {
      await setSession(createAppleSession(input));
    },
    themePreference: state.themePreference,
  };

  return <AppShellContext.Provider value={contextValue}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const context = useContext(AppShellContext);

  if (!context) {
    throw new Error("useAppShell must be used inside AppShellProvider.");
  }

  return context;
}
