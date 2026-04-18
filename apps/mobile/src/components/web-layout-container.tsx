import type { ReactNode } from "react";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useResponsive } from "../hooks/use-responsive";
import { useAppShell } from "../features/app-shell/provider";

interface WebLayoutContainerProps {
  children: ReactNode;
}

export function WebLayoutContainer({ children }: WebLayoutContainerProps) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return <WebLayoutInner>{children}</WebLayoutInner>;
}

function WebLayoutInner({ children }: { children: ReactNode }) {
  const { contentMaxWidth } = useResponsive();
  const { palette } = useAppShell();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousBackground = document.body.style.backgroundColor;
    document.body.style.backgroundColor = palette.shell;

    return () => {
      document.body.style.backgroundColor = previousBackground;
    };
  }, [palette.shell]);

  return (
    <View style={[styles.outerContainer, { backgroundColor: palette.shell }]}>
      <View
        style={[
          styles.innerContainer,
          { backgroundColor: palette.shell, maxWidth: contentMaxWidth },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    width: "100%",
  },
  outerContainer: {
    alignItems: "center",
    flex: 1,
  },
});
