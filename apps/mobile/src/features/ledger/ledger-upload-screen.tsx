import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackHeaderBar } from "../../components/back-header-bar";
import { CfoAvatar } from "../../components/cfo-avatar";
import { useAppShell } from "../app-shell/provider";

export function LedgerUploadScreen() {
  const router = useRouter();
  const { copy, palette } = useAppShell();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: palette.shell }]}
      testID="ledger-upload-screen"
    >
      <View
        style={[
          styles.appBar,
          {
            backgroundColor: palette.shell,
            borderBottomColor: palette.divider,
          },
        ]}
      >
        <BackHeaderBar
          onBack={() => router.back()}
          palette={palette}
          rightAccessory={<CfoAvatar />}
          title={copy.common.appName}
        />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroBlock}>
          <Text style={[styles.eyebrow, { color: palette.inkMuted }]}>Upload center</Text>
          <Text style={[styles.heroTitle, { color: palette.ink }]}>{copy.ledger.upload.title}</Text>
          <Text style={[styles.heroSummary, { color: palette.inkMuted }]}>{copy.ledger.upload.summary}</Text>
        </View>

        <View
          style={[
            styles.dropCard,
            {
              backgroundColor: palette.shellElevated,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <View style={[styles.uploadGlyph, { backgroundColor: palette.accentSoft }]}>
            <Feather color={palette.accent} name="upload-cloud" size={26} />
          </View>
          <Text style={[styles.dropTitle, { color: palette.ink }]}>Drop files or Browse</Text>
          <Text style={[styles.dropSummary, { color: palette.inkMuted }]}>
            Support for PDF, JPG, PNG, and HEIC is mocked in this UI-only phase.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/ledger/parse")}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: pressed ? palette.heroEnd : palette.ink,
                shadowColor: palette.shadow,
              },
            ]}
            testID="ledger-upload-select-button"
          >
            <View style={styles.primaryButtonContent}>
              <MaterialCommunityIcons color={palette.inkOnAccent} name="file-upload-outline" size={18} />
              <Text style={[styles.primaryButtonLabel, { color: palette.inkOnAccent }]}>Select Files</Text>
            </View>
          </Pressable>
          <Text style={[styles.hint, { color: palette.inkMuted }]}>{copy.ledger.upload.hint}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/ledger/parse")}
          style={({ pressed }) => [
            styles.footerButton,
            {
              backgroundColor: pressed ? palette.heroEnd : palette.ink,
            },
          ]}
          testID="ledger-upload-continue-button"
        >
          <Text style={[styles.footerButtonLabel, { color: palette.inkOnAccent }]}>
            {copy.ledger.upload.continue}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  container: {
    gap: 18,
    padding: 20,
    paddingBottom: 34,
  },
  dropCard: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 26,
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  dropSummary: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  dropTitle: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
    textAlign: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  footerButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    marginTop: 4,
  },
  footerButtonLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  heroBlock: {
    gap: 10,
  },
  heroSummary: {
    fontSize: 18,
    lineHeight: 28,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.1,
    lineHeight: 46,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    minWidth: 150,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  primaryButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  safeArea: {
    flex: 1,
  },
  uploadGlyph: {
    alignItems: "center",
    borderRadius: 999,
    height: 78,
    justifyContent: "center",
    width: 78,
  },
});
