import { Redirect, Tabs } from "expo-router";

import { LaunchScreen } from "../../src/features/app-shell/launch-screen";
import { useAppShell } from "../../src/features/app-shell/provider";

export default function TabLayout() {
  const { copy, isHydrated, palette, session } = useAppShell();

  if (!isHydrated) {
    return <LaunchScreen />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: palette.shell,
        },
        tabBarActiveTintColor: palette.tabActive,
        tabBarInactiveTintColor: palette.tabInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          paddingBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: palette.tabBar,
          borderTopColor: palette.border,
          height: 66,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: copy.tabs.home }} />
      <Tabs.Screen name="ledger" options={{ title: copy.tabs.ledger }} />
      <Tabs.Screen name="discover" options={{ title: copy.tabs.discover }} />
      <Tabs.Screen name="profile" options={{ title: copy.tabs.profile }} />
    </Tabs>
  );
}
