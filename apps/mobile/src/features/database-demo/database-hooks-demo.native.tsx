import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SQLiteProvider } from "expo-sqlite";
import { getLocalStorageBootstrapPlan } from "@creator-cfo/storage";
import { SectionCard, type SurfaceTokens } from "@creator-cfo/ui";

import type { AppCopy } from "../app-shell/copy";
import { initializeLocalDatabase } from "../../storage/database";
import { Form1040Section } from "../form-1040/form-1040-section";
import { FormScheduleCSection } from "../form-schedule-c/form-schedule-c-section";
import { FormScheduleSESection } from "../form-schedule-se/form-schedule-se-section";
import { buildDatabaseDemoMetrics, databaseDemoReportTabs } from "./demo-data";
import type {
  DatabaseDemoJournalEntryPreview,
  DatabaseDemoLedgerAccountPreview,
  DatabaseDemoReportTab,
  DatabaseDemoSnapshot,
  DatabaseDemoStatementSectionPreview,
} from "./demo-data";
import { useDatabaseDemo } from "./use-database-demo.native";

interface DatabaseHooksDemoProps {
  calculatedBadge: string;
  form1040Copy: AppCopy["discover"]["form1040"];
  formScheduleCCopy: AppCopy["discover"]["formScheduleC"];
  formScheduleSECopy: AppCopy["discover"]["formScheduleSE"];
  isBootstrapped: boolean;
  manualBadge: string;
  palette: SurfaceTokens;
}

const storagePlan = getLocalStorageBootstrapPlan();

function alpha(hexColor: string, alphaHex: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
    return `${hexColor}${alphaHex}`;
  }

  return hexColor;
}

export function DatabaseHooksDemo({
  calculatedBadge,
  form1040Copy,
  formScheduleCCopy,
  formScheduleSECopy,
  isBootstrapped,
  manualBadge,
  palette,
}: DatabaseHooksDemoProps) {
  if (!isBootstrapped) {
    return (
      <SectionCard
        eyebrow="Hooks demo"
        palette={palette}
        title="Interact with SQLite through hooks"
        footer={<Text style={[styles.footerText, { color: palette.inkMuted }]}>Waiting for local storage bootstrap.</Text>}
      >
        <Text style={[styles.summary, { color: palette.inkMuted }]}>
          This demo mounts a SQLite provider and reads or writes sample finance rows through a
          custom hook once the storage bootstrap is ready.
        </Text>
      </SectionCard>
    );
  }

  return (
    <SQLiteProvider databaseName={storagePlan.databaseName} onInit={initializeLocalDatabase}>
      <DatabaseHooksDemoCard
        calculatedBadge={calculatedBadge}
        form1040Copy={form1040Copy}
        formScheduleCCopy={formScheduleCCopy}
        formScheduleSECopy={formScheduleSECopy}
        manualBadge={manualBadge}
        palette={palette}
      />
    </SQLiteProvider>
  );
}

function DatabaseHooksDemoCard({
  calculatedBadge,
  form1040Copy,
  formScheduleCCopy,
  formScheduleSECopy,
  manualBadge,
  palette,
}: Pick<
  DatabaseHooksDemoProps,
  | "calculatedBadge"
  | "form1040Copy"
  | "formScheduleCCopy"
  | "formScheduleSECopy"
  | "manualBadge"
  | "palette"
>) {
  const [selectedReportTab, setSelectedReportTab] = useState<DatabaseDemoReportTab>("postings");
  const {
    createRecord,
    deleteRecord,
    editableFields,
    error,
    isBusy,
    isLoaded,
    refresh,
    receiptClassifications,
    selectClassification,
    selectField,
    selectRecord,
    selectedClassification,
    selectedField,
    selectedRecordId,
    snapshot,
    updateSelectedRecord,
  } = useDatabaseDemo();
  const metrics = buildDatabaseDemoMetrics(snapshot);
  const hasRecord = snapshot.counts.recordCount > 0;
  const selectedFieldOption =
    editableFields.find((option) => option.value === selectedField) ?? editableFields[0];
  const selectedClassificationOption =
    receiptClassifications.find((option) => option.value === selectedClassification) ??
    receiptClassifications[0];
  const selectedReportTabOption =
    databaseDemoReportTabs.find((tab) => tab.value === selectedReportTab) ?? databaseDemoReportTabs[0];
  const selectedRecord = snapshot.recentRecords.find((record) => record.recordId === selectedRecordId) ?? null;

  return (
    <SectionCard
      eyebrow="Hooks demo"
      palette={palette}
      title="CRUD records through hooks"
      footer={
        <Text style={[styles.footerText, { color: palette.inkMuted }]}>
          `SQLiteProvider` opens `{storagePlan.databaseName}` and `useDatabaseDemo()` wraps
          `useSQLiteContext()` for multi-record CRUD plus current-database accounting report tabs
          powered by `accounting_posting_lines_v`.
        </Text>
      }
    >
      <Text style={styles.summary}>
        This sample now keeps simplified receipt entry, CRUD, and reporting in one place: choose
        a high-level classification, create deterministic `records` through the shared resolver,
      <Text style={[styles.summary, { color: palette.inkMuted }]}>
        This sample now keeps simplified receipt entry, CRUD, and reporting in one place: choose
        a high-level classification, create deterministic `records` through the shared resolver,
        select which record is active, choose one editable field to update, and switch among
        postings, journal, general ledger, balance sheet, profit/loss, and tax previews built
        from the current demo database.
      </Text>

      <View style={styles.metricRow}>
        {metrics.map((metric) => (
          <View
            key={metric.label}
            style={[
              styles.metricCard,
              { backgroundColor: palette.accentSoft, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.metricValue, { color: palette.accent }]}>{metric.value}</Text>
            <Text style={[styles.metricLabel, { color: palette.inkMuted }]}>{metric.label}</Text>
          </View>
        ))}
      </View>

      {snapshot.counts.journalEntryCount > 0 ? (
        snapshot.ledgerHealth.isBalanced ? (
          <View
            style={[
              styles.healthCard,
              { backgroundColor: palette.accentSoft, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.healthTitle, { color: palette.accent }]}>Ledger balanced</Text>
            <Text style={[styles.healthText, { color: palette.inkMuted }]}>
              Debits {snapshot.ledgerHealth.debitTotalLabel} · credits{" "}
              {snapshot.ledgerHealth.creditTotalLabel}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.warningCard,
              {
                backgroundColor: alpha(palette.destructive, "14"),
                borderColor: alpha(palette.destructive, "42"),
              },
            ]}
          >
            <Text style={[styles.warningTitle, { color: palette.destructive }]}>Ledger warning</Text>
            <Text style={[styles.warningText, { color: palette.ink }]}>{snapshot.ledgerHealth.warningText}</Text>
            <Text style={[styles.warningMeta, { color: palette.inkMuted }]}>
              Debits {snapshot.ledgerHealth.debitTotalLabel} · credits{" "}
              {snapshot.ledgerHealth.creditTotalLabel}
            </Text>
          </View>
        )
      ) : null}

      <Text style={[styles.subheading, { color: palette.ink }]}>Receipt classification</Text>
      <View style={styles.selectionRow}>
        {receiptClassifications.map((classification) => (
          <SelectionChip
            key={classification.value}
            disabled={isBusy || !isLoaded}
            isSelected={classification.value === selectedClassification}
            label={classification.label}
            onPress={() => {
              selectClassification(classification.value);
            }}
          />
        ))}
      </View>
      <Text style={[styles.selectionHint, { color: palette.inkMuted }]}>
        {selectedClassificationOption?.description}
      </Text>

      <Text style={[styles.subheading, { color: palette.ink }]}>Selected field</Text>
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
            palette={palette}
          />
        ))}
      </View>
      <Text style={[styles.selectionHint, { color: palette.inkMuted }]}>
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
          palette={palette}
          tone="accent"
        />
        <DemoButton
          disabled={isBusy || !selectedRecordId}
          label="Update selected field"
          onPress={() => {
            void updateSelectedRecord();
          }}
          palette={palette}
          tone="neutral"
        />
        <DemoButton
          disabled={isBusy || !selectedRecordId}
          label="Delete selected record"
          onPress={() => {
            void deleteRecord();
          }}
          palette={palette}
          tone="neutral"
        />
        <DemoButton
          disabled={isBusy || !isLoaded}
          label="Refresh"
          onPress={() => {
            void refresh();
          }}
          palette={palette}
          tone="neutral"
        />
        <Form1040Section
          calculatedBadge={calculatedBadge}
          copy={form1040Copy}
          manualBadge={manualBadge}
          palette={palette}
          renderLauncher={(openPreview) => (
            <DemoButton
              disabled={false}
              label={form1040Copy.openPreview}
              onPress={openPreview}
              tone="neutral"
            />
          )}
        />
        <FormScheduleSESection
          calculatedBadge={calculatedBadge}
          copy={formScheduleSECopy}
          manualBadge={manualBadge}
          palette={palette}
          renderLauncher={(openPreview) => (
            <DemoButton
              disabled={false}
              label={formScheduleSECopy.openPreview}
              onPress={openPreview}
              palette={palette}
              tone="neutral"
            />
          )}
        />
        <FormScheduleCSection
          calculatedBadge={calculatedBadge}
          copy={formScheduleCCopy}
          manualBadge={manualBadge}
          palette={palette}
          renderLauncher={(openPreview) => (
            <DemoButton
              disabled={false}
              label={formScheduleCCopy.openPreview}
              onPress={openPreview}
              palette={palette}
              tone="neutral"
            />
          )}
        />
      </View>

      {selectedRecord ? (
        <Text style={[styles.selectionSummary, { color: palette.inkMuted }]}>
          Selected record: {selectedRecord.description} ({selectedRecord.recordId}) with field{" "}
          {selectedFieldOption?.label.toLowerCase()}.
        </Text>
      ) : (
        <Text style={[styles.selectionSummary, { color: palette.inkMuted }]}>
          No record is selected yet. Create one or more records to activate the selection flow.
        </Text>
      )}

      {error ? <Text style={[styles.errorText, { color: palette.destructive }]}>{error}</Text> : null}

      <Text style={[styles.subheading, { color: palette.ink }]}>Demo records</Text>
      {snapshot.recentRecords.length === 0 ? (
        <Text style={[styles.emptyText, { color: palette.inkMuted }]}>
          Pick a receipt classification and create one or more demo records to inspect simplified
          entry, derived postings, and tax-form queries.
        </Text>
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
              {
                backgroundColor: palette.paper,
                borderColor: palette.border,
              },
              record.recordId === selectedRecordId
                ? {
                    borderColor: palette.accent,
                    backgroundColor: palette.accentSoft,
                  }
                : null,
              pressed && !isBusy ? styles.recordRowPressed : null,
            ]}
          >
            <Text style={[styles.rowTitle, { color: palette.ink }]}>
              {record.description} · amount {record.amountLabel}
            </Text>
            <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>
              {record.classificationLabel} to {record.recordKind} · {record.status} · cash{" "}
              {record.cashMovementLabel} · {record.occurredOn}
            </Text>
            <Text style={[styles.recordMeta, { color: palette.inkMuted }]}>
              {record.recordId === selectedRecordId ? "Selected" : "Tap to select"} · {record.recordId}
            </Text>
          </Pressable>
        ))
      )}

      <Text style={[styles.subheading, { color: palette.ink }]}>Current database reports</Text>
      <View style={styles.selectionRow}>
        {databaseDemoReportTabs.map((tab) => (
          <SelectionChip
            key={tab.value}
            disabled={isBusy}
            isSelected={tab.value === selectedReportTab}
            label={tab.label}
            onPress={() => {
              setSelectedReportTab(tab.value);
            }}
            palette={palette}
          />
        ))}
      </View>
      <Text style={[styles.selectionHint, { color: palette.inkMuted }]}>{selectedReportTabOption?.description}</Text>

      <DatabaseDemoReportPanel
        palette={palette}
        selectedRecordId={selectedRecordId}
        selectedReportTab={selectedReportTab}
        snapshot={snapshot}
      />

      <Text style={[styles.summary, { color: palette.inkMuted }]}>{snapshot.summary}</Text>
    </SectionCard>
  );
}

interface DemoButtonProps {
  disabled: boolean;
  label: string;
  onPress: () => void;
  palette: SurfaceTokens;
  tone: "accent" | "neutral";
}

function DemoButton({ disabled, label, onPress, palette, tone }: DemoButtonProps) {
  const accentLabelColor = palette.name === "dark" ? palette.shell : palette.inkOnAccent;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "accent"
          ? { backgroundColor: palette.accent, borderColor: palette.accent }
          : { backgroundColor: palette.paperMuted, borderColor: palette.border },
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text style={[styles.buttonLabel, { color: tone === "accent" ? accentLabelColor : palette.ink }]}>
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
  palette: SurfaceTokens;
}

function SelectionChip({ disabled, isSelected, label, onPress, palette }: SelectionChipProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionChip,
        {
          borderColor: isSelected ? palette.accent : palette.border,
          backgroundColor: isSelected ? palette.accentSoft : palette.paper,
        },
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text
        style={[
          styles.selectionChipLabel,
          { color: isSelected ? palette.accent : palette.ink },
          isSelected ? styles.selectionChipSelectedLabel : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface DatabaseDemoReportPanelProps {
  palette: SurfaceTokens;
  selectedRecordId: string | null;
  selectedReportTab: DatabaseDemoReportTab;
  snapshot: DatabaseDemoSnapshot;
}

function DatabaseDemoReportPanel({
  palette,
  selectedRecordId,
  selectedReportTab,
  snapshot,
}: DatabaseDemoReportPanelProps) {
  if (selectedReportTab === "postings") {
    if (snapshot.selectedPostingLines.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: palette.inkMuted }]}>
          {selectedRecordId
            ? "This selected record has no derived posting lines yet."
            : "Select or create a record to inspect derived posting lines."}
        </Text>
      );
    }

    return (
      <>
        {snapshot.selectedPostingLines.map((line) => (
          <View
            key={`${line.lineNo}-${line.accountRole}`}
            style={[styles.listRow, { borderTopColor: palette.divider }]}
          >
            <Text style={[styles.rowTitle, { color: palette.ink }]}>
              Line {line.lineNo} · {line.accountName}
            </Text>
            <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>
              {line.accountRole} · {line.direction} · {line.amountLabel}
            </Text>
          </View>
        ))}
      </>
    );
  }

  if (selectedReportTab === "journal") {
    if (snapshot.journalEntries.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: palette.inkMuted }]}>
          Create one or more postable demo records to inspect journal entries.
        </Text>
      );
    }

    return (
      <>
        {snapshot.journalEntries.map((entry) => (
          <JournalEntryCard
            key={entry.recordId}
            entry={entry}
            palette={palette}
          />
        ))}
      </>
    );
  }

  if (selectedReportTab === "generalLedger") {
    if (snapshot.ledgerAccounts.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: palette.inkMuted }]}>
          Create one or more postable demo records to inspect general-ledger balances and activity.
        </Text>
      );
    }

    return (
      <>
        {snapshot.ledgerAccounts.map((account) => (
          <LedgerAccountCard
            key={`${account.accountCode}-${account.accountName}`}
            account={account}
            palette={palette}
          />
        ))}
      </>
    );
  }

  if (selectedReportTab === "balanceSheet") {
    if (snapshot.balanceSheetSections.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: palette.inkMuted }]}>
          Create one or more postable demo records to inspect the balance sheet.
        </Text>
      );
    }

    return (
      <>
        {snapshot.balanceSheetSections.map((section) => (
          <StatementSectionCard
            key={section.title}
            palette={palette}
            section={section}
          />
        ))}
      </>
    );
  }

  if (snapshot.profitAndLossSections.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: palette.inkMuted }]}>
        Create one or more postable demo records to inspect profit and loss output.
      </Text>
    );
  }

  return (
    <>
      {snapshot.profitAndLossSections.map((section) => (
        <StatementSectionCard
          key={section.title}
          palette={palette}
          section={section}
        />
      ))}
    </>
  );
}

interface JournalEntryCardProps {
  entry: DatabaseDemoJournalEntryPreview;
  palette: SurfaceTokens;
}

function JournalEntryCard({ entry, palette }: JournalEntryCardProps) {
  return (
    <View style={[styles.reportCard, { backgroundColor: palette.paper, borderColor: palette.border }]}>
      <Text style={[styles.rowTitle, { color: palette.ink }]}>
        {entry.postingOn} · {entry.description}
      </Text>
      <Text style={[styles.reportMeta, { color: palette.inkMuted }]}>
        {entry.recordId} · dr {entry.debitTotalLabel} · cr {entry.creditTotalLabel}
      </Text>
      {entry.lines.map((line) => (
        <View
          key={`${entry.recordId}-${line.lineNo}-${line.accountRole}`}
          style={[styles.nestedRow, { borderTopColor: palette.divider }]}
        >
          <Text style={[styles.nestedRowTitle, { color: palette.ink }]}>
            Line {line.lineNo} · {line.accountLabel}
          </Text>
          <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>
            {line.accountRole} · {line.direction} · {line.amountLabel}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface LedgerAccountCardProps {
  account: DatabaseDemoLedgerAccountPreview;
  palette: SurfaceTokens;
}

function LedgerAccountCard({ account, palette }: LedgerAccountCardProps) {
  return (
    <View style={[styles.reportCard, { backgroundColor: palette.paper, borderColor: palette.border }]}>
      <Text style={[styles.rowTitle, { color: palette.ink }]}>
        {account.accountCode} · {account.accountName}
      </Text>
      <Text style={[styles.reportMeta, { color: palette.inkMuted }]}>
        {account.accountType} · {account.normalBalance} normal · balance {account.balanceDirection}{" "}
        {account.balanceLabel}
      </Text>
      <Text style={[styles.reportMeta, { color: palette.inkMuted }]}>
        Total debits {account.debitTotalLabel} · total credits {account.creditTotalLabel}
      </Text>
      {account.activityLines.map((line) => (
        <View
          key={`${account.accountCode}-${line.recordId}-${line.postingOn}-${line.summary}`}
          style={[styles.nestedRow, { borderTopColor: palette.divider }]}
        >
          <Text style={[styles.nestedRowTitle, { color: palette.ink }]}>
            {line.postingOn} · {line.recordId}
          </Text>
          <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>
            {line.summary} · {line.direction} · {line.amountLabel}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface StatementSectionCardProps {
  palette: SurfaceTokens;
  section: DatabaseDemoStatementSectionPreview;
}

function StatementSectionCard({ palette, section }: StatementSectionCardProps) {
  return (
    <View style={[styles.reportCard, { backgroundColor: palette.paper, borderColor: palette.border }]}>
      <View style={styles.statementHeader}>
        <Text style={[styles.rowTitle, { color: palette.ink }]}>{section.title}</Text>
        <Text style={[styles.statementTotal, { color: palette.accent }]}>{section.totalLabel}</Text>
      </View>
      {section.lines.map((line) => (
        <View
          key={`${section.title}-${line.label}`}
          style={[styles.statementRow, { borderTopColor: palette.divider }]}
        >
          <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>{line.label}</Text>
          <Text style={[styles.statementLineAmount, { color: palette.ink }]}>{line.amountLabel}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
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
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerText: {
    fontSize: 13,
  },
  healthCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  healthText: {
    fontSize: 14,
    lineHeight: 20,
  },
  healthTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  listRow: {
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 10,
  },
  metricCard: {
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 88,
    padding: 12,
  },
  metricLabel: {
    fontSize: 13,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  nestedRow: {
    borderTopWidth: 1,
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
  },
  nestedRowTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  recordMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
  recordRow: {
    borderWidth: 1,
    borderRadius: 18,
    gap: 4,
    padding: 12,
  },
  recordRowPressed: {
    transform: [{ scale: 0.99 }],
  },
  reportCard: {
    borderWidth: 1,
    borderRadius: 18,
    gap: 6,
    padding: 12,
  },
  reportMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  selectionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectionChipLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectionChipSelectedLabel: {
    fontWeight: "700",
  },
  selectionHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  selectionSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  statementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  statementLineAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  statementRow: {
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
  },
  statementTotal: {
    fontSize: 15,
    fontWeight: "700",
  },
  subheading: {
    fontSize: 15,
    fontWeight: "700",
    paddingTop: 6,
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
  },
  warningCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  warningMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
});
