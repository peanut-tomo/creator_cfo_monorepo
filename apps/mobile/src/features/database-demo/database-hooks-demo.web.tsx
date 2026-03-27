import { StyleSheet, Text, View } from "react-native";
import { getLocalStorageBootstrapPlan } from "@creator-cfo/storage";
import { SectionCard } from "@creator-cfo/ui";

interface DatabaseHooksDemoProps {
  isBootstrapped: boolean;
}

const storagePlan = getLocalStorageBootstrapPlan();

export function DatabaseHooksDemo({ isBootstrapped }: DatabaseHooksDemoProps) {
  return (
    <SectionCard
      eyebrow="Hooks demo"
      title="Interact with SQLite through hooks"
      footer={
        <Text style={styles.footerText}>
          Web preview keeps this section explanatory so the static export stays stable; the native
          app runs the same flow against `{storagePlan.databaseName}`.
        </Text>
      }
    >
      <Text style={styles.summary}>
        Native demo flow:
      </Text>
      <View style={styles.listRow}>
        <Text style={styles.rowTitle}>1. Mount `SQLiteProvider`</Text>
        <Text style={styles.rowSummary}>
          Use the shared database name and schema initialization helper before rendering hook
          consumers.
        </Text>
      </View>
      <View style={styles.listRow}>
        <Text style={styles.rowTitle}>2. Query with a custom hook</Text>
        <Text style={styles.rowSummary}>
          `useDatabaseDemo()` wraps `useSQLiteContext()` and returns multi-record CRUD actions,
          selected-record state, selected-field state, and a read of the derived double-entry
          view.
        </Text>
      </View>
      <View style={styles.listRow}>
        <Text style={styles.rowTitle}>3. Read derived rows back</Text>
        <Text style={styles.rowSummary}>
          The native demo lets you create multiple demo `records`, select one record, update one
          chosen field, delete the selected record, and read the selected record's
          `record_double_entry_lines_v` rows back into the UI.
        </Text>
      </View>
      <Text style={styles.summary}>
        Bootstrap state: {isBootstrapped ? "metadata ready" : "waiting for preview bootstrap"}.
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  footerText: {
    color: "#61717d",
    fontSize: 13,
  },
  listRow: {
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(20, 33, 61, 0.08)",
  },
  rowSummary: {
    color: "#61717d",
    fontSize: 14,
    lineHeight: 20,
  },
  rowTitle: {
    color: "#14213d",
    fontSize: 16,
    fontWeight: "700",
  },
  summary: {
    color: "#465560",
    fontSize: 15,
    lineHeight: 22,
  },
});
