import { Pressable, StyleSheet, Text, View } from "react-native";
import { getLocalStorageBootstrapPlan } from "@creator-cfo/storage";
import { SectionCard, type SurfaceTokens } from "@creator-cfo/ui";

import type { AppCopy } from "../app-shell/copy";
import { Form1099NecSection } from "../form-1099-nec/form-1099-nec-section";
import { FormScheduleCSection } from "../form-schedule-c/form-schedule-c-section";

interface DatabaseHooksDemoProps {
  calculatedBadge: string;
  form1099NecCopy: AppCopy["discover"]["form1099Nec"];
  formScheduleCCopy: AppCopy["discover"]["formScheduleC"];
  isBootstrapped: boolean;
  manualBadge: string;
  palette: SurfaceTokens;
}

const storagePlan = getLocalStorageBootstrapPlan();

export function DatabaseHooksDemo({
  calculatedBadge,
  form1099NecCopy,
  formScheduleCCopy,
  isBootstrapped,
  manualBadge,
  palette,
}: DatabaseHooksDemoProps) {
  return (
    <SectionCard
      eyebrow="Hooks demo"
      palette={palette}
      title="Interact with SQLite through hooks"
      footer={
        <Text style={[styles.footerText, { color: palette.inkMuted }]}>
          Web preview keeps this section explanatory so the static export stays stable; the native
          app runs the same flow against `{storagePlan.databaseName}`.
        </Text>
      }
    >
      <Text style={[styles.summary, { color: palette.inkMuted }]}>
        Native demo flow:
      </Text>
      <View style={[styles.listRow, { borderTopColor: palette.divider }]}>
        <Text style={[styles.rowTitle, { color: palette.ink }]}>1. Mount `SQLiteProvider`</Text>
        <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>
          Use the shared database name and schema initialization helper before rendering hook
          consumers.
        </Text>
      </View>
      <View style={[styles.listRow, { borderTopColor: palette.divider }]}>
        <Text style={[styles.rowTitle, { color: palette.ink }]}>2. Query with a custom hook</Text>
        <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>
          `useDatabaseDemo()` wraps `useSQLiteContext()` and returns multi-record CRUD actions,
          selected-record state, selected-field state, and current-database report previews built
          from the accounting reporting view.
        </Text>
      </View>
      <View style={[styles.listRow, { borderTopColor: palette.divider }]}>
        <Text style={[styles.rowTitle, { color: palette.ink }]}>3. Switch report tabs</Text>
        <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>
          The native demo lets you create multiple demo `records`, select one record, update one
          chosen field, delete the selected record, and switch across postings, journal, general
          ledger, balance sheet, and profit/loss views for the current demo database.
        </Text>
      </View>
      <View style={[styles.listRow, { borderTopColor: palette.divider }]}>
        <Text style={[styles.rowTitle, { color: palette.ink }]}>4. Surface ledger health</Text>
        <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>
          The native card also shows a warning if the current demo ledger is unbalanced, using the
          same accounting posting surface as the report tabs.
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <Form1099NecSection
          copy={form1099NecCopy}
          manualBadge={manualBadge}
          palette={palette}
          renderLauncher={(openPreview) => (
            <Pressable
              accessibilityRole="button"
              onPress={openPreview}
              style={[
                styles.button,
                { backgroundColor: palette.paperMuted, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.buttonLabel, { color: palette.ink }]}>{form1099NecCopy.openPreview}</Text>
            </Pressable>
          )}
        />
        <FormScheduleCSection
          calculatedBadge={calculatedBadge}
          copy={formScheduleCCopy}
          manualBadge={manualBadge}
          palette={palette}
          renderLauncher={(openPreview) => (
            <Pressable
              accessibilityRole="button"
              onPress={openPreview}
              style={[
                styles.button,
                { backgroundColor: palette.paperMuted, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.buttonLabel, { color: palette.ink }]}>{formScheduleCCopy.openPreview}</Text>
            </Pressable>
          )}
        />
      </View>
      <Text style={[styles.summary, { color: palette.inkMuted }]}>
        Bootstrap state: {isBootstrapped ? "metadata ready" : "waiting for preview bootstrap"}.
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 200,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  footerText: {
    fontSize: 13,
  },
  listRow: {
    borderTopWidth: 1,
    gap: 6,
    paddingTop: 10,
  },
  rowSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
  },
});
