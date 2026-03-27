import { Pressable, StyleSheet, Text, View } from "react-native";
import { SQLiteProvider } from "expo-sqlite";
import { getLocalStorageBootstrapPlan } from "@creator-cfo/storage";
import { SectionCard, surfaceTokens } from "@creator-cfo/ui";

import { initializeLocalDatabase } from "../../storage/database";
import { buildDatabaseDemoMetrics } from "./demo-data";
import { useDatabaseDemo } from "./use-database-demo.native";

interface DatabaseHooksDemoProps {
  isBootstrapped: boolean;
}

const storagePlan = getLocalStorageBootstrapPlan();

export function DatabaseHooksDemo({ isBootstrapped }: DatabaseHooksDemoProps) {
  if (!isBootstrapped) {
    return (
      <SectionCard
        eyebrow="Hooks demo"
        title="Interact with SQLite through hooks"
        footer={<Text style={styles.footerText}>Waiting for local storage bootstrap.</Text>}
      >
        <Text style={styles.summary}>
          This demo mounts a SQLite provider and reads or writes sample finance rows through a
          custom hook once the storage bootstrap is ready.
        </Text>
      </SectionCard>
    );
  }

  return (
    <SQLiteProvider databaseName={storagePlan.databaseName} onInit={initializeLocalDatabase}>
      <DatabaseHooksDemoCard />
    </SQLiteProvider>
  );
}

function DatabaseHooksDemoCard() {
  const {
    createRecord,
    deleteRecord,
    editableFields,
    error,
    isBusy,
    isLoaded,
    refresh,
    selectField,
    selectRecord,
    selectedField,
    selectedRecordId,
    snapshot,
    updateSelectedRecord,
  } = useDatabaseDemo();
  const metrics = buildDatabaseDemoMetrics(snapshot);
  const hasRecord = snapshot.counts.recordCount > 0;
  const selectedFieldOption = editableFields.find((option) => option.value === selectedField) ?? editableFields[0];
  const selectedRecord = snapshot.recentRecords.find((record) => record.recordId === selectedRecordId) ?? null;

  return (
    <SectionCard
      eyebrow="Hooks demo"
      title="CRUD records through hooks"
      footer={
        <Text style={styles.footerText}>
          `SQLiteProvider` opens `{storagePlan.databaseName}` and `useDatabaseDemo()` wraps
          `useSQLiteContext()` for multi-record create, selected-record field updates, delete, and
          derived-view reads.
        </Text>
      }
    >
      <Text style={styles.summary}>
        This sample keeps the visible scope tight: create deterministic `records`, select which
        record is active, choose one editable field to update, and read the selected record's
        derived `record_double_entry_lines_v` rows through the same hook.
      </Text>

      <View style={styles.metricRow}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subheading}>Selected field</Text>
      <View style={styles.selectionRow}>
        {editableFields.map((field) => (
          <SelectionChip
            key={field.value}
            disabled={isBusy || !hasRecord}
            isSelected={field.value === selectedField}
            label={field.label}
            onPress={() => {
              selectField(field.value);
            }}
          />
        ))}
      </View>
      <Text style={styles.selectionHint}>
        {hasRecord
          ? selectedFieldOption?.description
          : "Create a record first, then pick which field the update action should mutate."}
      </Text>

      <View style={styles.buttonRow}>
        <DemoButton
          disabled={isBusy || !isLoaded}
          label="Create record"
          onPress={() => {
            void createRecord();
          }}
          tone="accent"
        />
        <DemoButton
          disabled={isBusy || !selectedRecordId}
          label="Update selected field"
          onPress={() => {
            void updateSelectedRecord();
          }}
          tone="neutral"
        />
        <DemoButton
          disabled={isBusy || !selectedRecordId}
          label="Delete selected record"
          onPress={() => {
            void deleteRecord();
          }}
          tone="neutral"
        />
        <DemoButton
          disabled={isBusy || !isLoaded}
          label="Refresh"
          onPress={() => {
            void refresh();
          }}
          tone="neutral"
        />
      </View>

      {selectedRecord ? (
        <Text style={styles.selectionSummary}>
          Selected record: {selectedRecord.description} ({selectedRecord.recordId}) with field{" "}
          {selectedFieldOption?.label.toLowerCase()}.
        </Text>
      ) : (
        <Text style={styles.selectionSummary}>
          No record is selected yet. Create one or more records to activate the selection flow.
        </Text>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.subheading}>Demo records</Text>
      {snapshot.recentRecords.length === 0 ? (
        <Text style={styles.emptyText}>
          Create one or more demo records to inspect record queries and derived postings.
        </Text>
      ) : (
        snapshot.recentRecords.map((record) => (
          <Pressable
            key={record.recordId}
            disabled={isBusy}
            onPress={() => {
              void selectRecord(record.recordId);
            }}
            style={({ pressed }) => [
              styles.recordRow,
              record.recordId === selectedRecordId ? styles.recordRowSelected : null,
              pressed && !isBusy ? styles.recordRowPressed : null,
            ]}
          >
            <Text style={styles.rowTitle}>
              {record.description} · gross {record.grossAmountLabel}
            </Text>
            <Text style={styles.rowSummary}>
              {record.recordKind} · {record.status} · net {record.netAmountLabel} ·{" "}
              {record.recognizedOn}
            </Text>
            <Text style={styles.recordMeta}>
              {record.recordId === selectedRecordId ? "Selected" : "Tap to select"} · {record.recordId}
            </Text>
          </Pressable>
        ))
      )}

      <Text style={styles.subheading}>Derived double-entry lines</Text>
      {snapshot.doubleEntryLines.length === 0 ? (
        <Text style={styles.emptyText}>
          {selectedRecordId
            ? "This selected record has no derived posting lines yet."
            : "Select or create a record to inspect derived posting lines."}
        </Text>
      ) : (
        snapshot.doubleEntryLines.map((line) => (
          <View key={`${line.lineNo}-${line.accountRole}`} style={styles.listRow}>
            <Text style={styles.rowTitle}>
              Line {line.lineNo} · {line.accountName}
            </Text>
            <Text style={styles.rowSummary}>
              {line.accountRole} · {line.direction} · {line.amountLabel}
            </Text>
          </View>
        ))
      )}

      <Text style={styles.summary}>{snapshot.summary}</Text>
    </SectionCard>
  );
}

interface DemoButtonProps {
  disabled: boolean;
  label: string;
  onPress: () => void;
  tone: "accent" | "neutral";
}

function DemoButton({ disabled, label, onPress, tone }: DemoButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "accent" ? styles.buttonAccent : styles.buttonNeutral,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text style={tone === "accent" ? styles.buttonAccentLabel : styles.buttonNeutralLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

interface SelectionChipProps {
  disabled: boolean;
  isSelected: boolean;
  label: string;
  onPress: () => void;
}

function SelectionChip({ disabled, isSelected, label, onPress }: SelectionChipProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionChip,
        isSelected ? styles.selectionChipSelected : null,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text style={isSelected ? styles.selectionChipSelectedLabel : styles.selectionChipLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  buttonAccent: {
    backgroundColor: surfaceTokens.accent,
    borderColor: surfaceTokens.accent,
  },
  buttonAccentLabel: {
    color: "#f8fffd",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonNeutral: {
    backgroundColor: "#f8f2e7",
    borderColor: surfaceTokens.border,
  },
  buttonNeutralLabel: {
    color: surfaceTokens.ink,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emptyText: {
    color: "#61717d",
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: "#a61b1b",
    fontSize: 14,
    fontWeight: "600",
  },
  footerText: {
    color: "#61717d",
    fontSize: 13,
  },
  listRow: {
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(20, 33, 61, 0.08)",
  },
  metricCard: {
    flex: 1,
    minWidth: 88,
    gap: 4,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#f2fbf8",
  },
  metricLabel: {
    color: "#61717d",
    fontSize: 13,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricValue: {
    color: surfaceTokens.accent,
    fontSize: 24,
    fontWeight: "700",
  },
  recordMeta: {
    color: "#61717d",
    fontSize: 13,
    fontWeight: "600",
  },
  recordRow: {
    gap: 4,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(20, 33, 61, 0.08)",
    backgroundColor: "#fffaf2",
  },
  recordRowPressed: {
    transform: [{ scale: 0.99 }],
  },
  recordRowSelected: {
    borderColor: surfaceTokens.accent,
    backgroundColor: "#eefaf6",
  },
  rowSummary: {
    color: "#61717d",
    fontSize: 14,
    lineHeight: 20,
  },
  rowTitle: {
    color: surfaceTokens.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  selectionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: surfaceTokens.border,
    backgroundColor: "#fffaf2",
  },
  selectionChipLabel: {
    color: surfaceTokens.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  selectionChipSelected: {
    borderColor: surfaceTokens.accent,
    backgroundColor: "#eefaf6",
  },
  selectionChipSelectedLabel: {
    color: surfaceTokens.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  selectionHint: {
    color: "#61717d",
    fontSize: 14,
    lineHeight: 20,
  },
  selectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  selectionSummary: {
    color: "#465560",
    fontSize: 14,
    lineHeight: 20,
  },
  subheading: {
    paddingTop: 6,
    color: surfaceTokens.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  summary: {
    color: "#465560",
    fontSize: 15,
    lineHeight: 22,
  },
});
