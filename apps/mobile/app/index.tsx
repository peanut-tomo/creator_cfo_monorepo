import { Redirect } from "expo-router";

import { LaunchScreen } from "../src/features/app-shell/launch-screen";
import { useAppShell } from "../src/features/app-shell/provider";

export default function IndexScreen() {
  const { isHydrated, session } = useAppShell();

  if (!isHydrated) {
    return <LaunchScreen />;
  }

  return <Redirect href={session ? "/(tabs)" : "/login"} />;
}
