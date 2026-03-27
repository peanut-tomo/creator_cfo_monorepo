import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppShellProvider, useAppShell } from "../src/features/app-shell/provider";

function RootNavigator() {
  const { palette } = useAppShell();

  return (
    <>
      <StatusBar style={palette.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: palette.shell,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppShellProvider>
      <RootNavigator />
    </AppShellProvider>
  );
}
