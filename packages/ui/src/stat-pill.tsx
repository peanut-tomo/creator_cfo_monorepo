import { StyleSheet, Text, View } from "react-native";

import { surfaceTokens, type SurfaceTokens } from "./tokens";

interface StatPillProps {
  label: string;
  value: string;
  palette?: SurfaceTokens;
}

export function StatPill({ label, palette = surfaceTokens, value }: StatPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: palette.accentSoft }]}>
      <Text style={[styles.value, { color: palette.accent }]}>{value}</Text>
      <Text style={[styles.label, { color: palette.inkMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#5b6472",
    fontSize: 12,
  },
  pill: {
    minWidth: 132,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#dff8f4",
  },
  value: {
    color: "#0f766e",
    fontSize: 20,
    fontWeight: "700",
  },
});
