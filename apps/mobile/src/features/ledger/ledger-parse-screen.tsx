import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackHeaderBar } from "../../components/back-header-bar";
import { CfoAvatar } from "../../components/cfo-avatar";
import { useResponsive } from "../../hooks/use-responsive";
import { useAppShell } from "../app-shell/provider";
import { getButtonColors, getFeedbackColors, withAlpha } from "../app-shell/theme-utils";
import {
  formatLedgerParseCandidateState,
  formatLedgerParseProposalType,
  formatLedgerParseWorkflowState,
} from "./ledger-parse-localization";
import type { LedgerCategory } from "./ledger-domain";
import { usePlannerWorkflow } from "./use-planner-workflow";

export function LedgerParseScreen() {
  const router = useRouter();
  const { isExpanded, isMedium } = useResponsive();
  const isWide = isExpanded || isMedium;
  const { copy, palette, profileInfo, resolvedLocale } = useAppShell();
  const parseCopy = copy.ledger.parse;
  const primaryButton = getButtonColors(palette, "primary");
  const errorColors = getFeedbackColors(palette, "error");
  const successColors = getFeedbackColors(palette, "success");
  const warningColors = getFeedbackColors(palette, "warning");
  const params = useLocalSearchParams<{
    fileName?: string;
    rawJson?: string;
    rawText?: string;
    model?: string;
    parseError?: string;
    mimeType?: string;
    parserKind?: string;
  }>();

  const fileName = params.fileName ?? parseCopy.unknownFile;
  const rawJson = params.rawJson ?? "";
  const rawText = params.rawText ?? "";
  const model = params.model ?? "";
  const parseError = params.parseError ?? "";
  const mimeType = params.mimeType?.trim() || null;
  const parserKind = params.parserKind || undefined;

  const hasData = rawJson || rawText;
  const formattedJson = formatJson(rawJson);
  const providerLabel =
    parserKind === "gemini" ? "Gemini" : parserKind === "infer" ? "Infer API" : "OpenAI";

  const parsedRawJson = rawJson ? tryParse(rawJson) : null;

  const {
    approveProposal,
    error: plannerError,
    isApproving,
    isPlanning,
    plannerResult,
    rejectProposal,
    review,
    startPlanner,
    updateField,
  } = usePlannerWorkflow({
    fileName,
    mimeType,
    model,
    parserKind,
    profileInfo,
    rawJson: parsedRawJson,
    rawText,
  });

  const canStartPlanner =
    hasData && !parseError && parsedRawJson !== null && !plannerResult;
  const isPreparingReview = canStartPlanner || (isPlanning && !plannerResult);
  const canRetryPlanner =
    !plannerResult &&
    !isPlanning &&
    !parseError &&
    parsedRawJson !== null &&
    Boolean(plannerError);
  const allApproved = plannerResult?.batchState === "approved";
  const categoryOptions: Array<{
    label: string;
    value: LedgerCategory;
  }> = [
    { label: parseCopy.categoryBusinessIncome, value: "income" },
    {
      label: parseCopy.categoryNonBusinessIncome,
      value: "non_business_income",
    },
    { label: parseCopy.categoryExpense, value: "expense" },
    { label: parseCopy.categoryPersonalSpending, value: "spending" },
  ];

  useEffect(() => {
    if (!canStartPlanner || isPlanning || plannerError) {
      return;
    }

    void startPlanner();
  }, [canStartPlanner, isPlanning, plannerError, startPlanner]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: palette.shell }]}
      testID="ledger-parse-screen"
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
          onBack={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/ledger");
            }
          }}
          palette={palette}
          rightAccessory={<CfoAvatar />}
          title={copy.common.appName}
        />
      </View>

      <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]}>
        {/* ---- Top strip: hero + file info (always full width) ---- */}
        <View
          style={[
            styles.heroBlock,
            { backgroundColor: palette.paper, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.eyebrow, { color: palette.inkMuted }]}>
            {parseCopy.heroEyebrow}
          </Text>
          <Text style={[styles.heroTitle, { color: palette.ink }]}>
            {`${providerLabel} ${parseCopy.heroTitleSuffix}`}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: palette.paper, borderColor: palette.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Feather color={palette.inkMuted} name="file-text" size={16} />
            <Text
              numberOfLines={1}
              style={[styles.fileName, { color: palette.ink }]}
            >
              {fileName}
            </Text>
          </View>
          {model ? (
            <Text style={[styles.meta, { color: palette.inkMuted }]}>
              {parseCopy.modelLabel}: {model}
            </Text>
          ) : null}
        </View>

        {parseError ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: errorColors.background,
                borderColor: errorColors.border,
              },
            ]}
          >
            <Text style={[styles.errorTitle, { color: errorColors.text }]}>
              {parseCopy.errorTitle}
            </Text>
            <Text selectable style={[styles.errorText, { color: errorColors.text }]}>
              {parseError}
            </Text>
          </View>
        ) : null}

        {/* ---- Main body: two-column on PC, single-column on mobile ---- */}
        <View style={isExpanded ? styles.twoColumn : undefined}>
          {/* Left column: JSON preview */}
          <View style={isExpanded ? styles.columnLeft : undefined}>
            {hasData ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: palette.paper, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                  {parseCopy.parsedJsonTitle}
                </Text>
                <View
                  style={[
                    styles.jsonBox,
                    isExpanded && styles.jsonBoxWide,
                    {
                      backgroundColor: palette.shellElevated,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text
                    selectable
                    style={[styles.jsonText, { color: palette.ink }]}
                  >
                    {formattedJson || rawText || parseCopy.noData}
                  </Text>
                </View>
              </View>
            ) : !parseError ? (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: palette.paper, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.emptyTitle, { color: palette.ink }]}>
                  {parseCopy.emptyTitle}
                </Text>
                <Text style={[styles.emptySub, { color: palette.inkMuted }]}>
                  {parseCopy.emptySummary}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Right column: planner actions + edit + proposals */}
          <View style={[isExpanded ? styles.columnRight : undefined, { gap: 14 }]}>
            {isPreparingReview ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: palette.paper, borderColor: palette.border },
                ]}
                testID="planner-preparing-card"
              >
                <View style={styles.loadingHeader}>
                  <ActivityIndicator color={palette.accent} size="small" />
                  <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                    {parseCopy.preparingReviewTitle}
                  </Text>
                </View>
                <Text style={[styles.summaryText, { color: palette.inkMuted }]}>
                  {parseCopy.preparingReviewSummary}
                </Text>
                <Text style={[styles.loadingCaption, { color: palette.inkMuted }]}>
                  {parseCopy.mapping}
                </Text>
              </View>
            ) : null}

            {plannerError ? (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: errorColors.background,
                    borderColor: errorColors.border,
                  },
                ]}
              >
                <Text style={[styles.errorTitle, { color: errorColors.text }]}>
                  {parseCopy.plannerErrorTitle}
                </Text>
                <Text selectable style={[styles.errorText, { color: errorColors.text }]}>
                  {plannerError}
                </Text>
                {canRetryPlanner ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={startPlanner}
                    style={({ pressed }) => [
                      styles.retryButton,
                      {
                        backgroundColor: pressed
                          ? withAlpha(palette.destructive, 0.82)
                          : palette.destructive,
                      },
                    ]}
                  >
                    <Text style={styles.actionButtonLabel}>{parseCopy.retry}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {plannerResult?.plannerSummary ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: palette.paper, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                  {parseCopy.plannerSummaryTitle}
                </Text>
                <Text style={[styles.summaryText, { color: palette.inkMuted }]}>
                  {plannerResult.plannerSummary.summary}
                </Text>
                {plannerResult.plannerSummary.warnings.length > 0 ? (
                  <View style={styles.warningList}>
                    {plannerResult.plannerSummary.warnings.map((warning, index) => (
                      <Text
                        key={index}
                        style={[styles.warningText, { color: warningColors.text }]}
                      >
                        {warning}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <View style={styles.statsRow}>
                  <StatPill
                    label={parseCopy.statReadTasks}
                    palette={palette}
                    value={plannerResult.plannerSummary.readTasks.length}
                  />
                  <StatPill
                    label={parseCopy.statCandidates}
                    palette={palette}
                    value={plannerResult.candidateRecords.length}
                  />
                  <StatPill
                    label={parseCopy.statProposals}
                    palette={palette}
                    value={plannerResult.writeProposals.length}
                  />
                </View>
              </View>
            ) : null}

            {plannerResult && !allApproved ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: palette.paper, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                  {parseCopy.editRecordTitle}
                </Text>
                {plannerResult.candidateRecords[0] ? (
                  <View style={styles.statePillRow}>
                    <View
                      style={[
                        styles.statePill,
                        {
                          backgroundColor: stateColor(
                            plannerResult.candidateRecords[0].state,
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.statePillText}>
                        {formatLedgerParseCandidateState(
                          plannerResult.candidateRecords[0].state,
                          resolvedLocale,
                        )}
                      </Text>
                    </View>
                  </View>
                ) : null}
                <CategorySelector
                  label={parseCopy.categoryLabel}
                  options={categoryOptions}
                  palette={palette}
                  selectedValue={review.category}
                  onSelect={(value) => updateField("category", value)}
                />
                <EditField
                  fieldId="amount"
                  label={parseCopy.fieldAmount}
                  onChangeText={(value) => updateField("amount", value)}
                  palette={palette}
                  value={review.amount}
                />
                <EditField
                  fieldId="date"
                  label={parseCopy.fieldDate}
                  onChangeText={(value) => updateField("date", value)}
                  palette={palette}
                  value={review.date}
                />
                <EditField
                  fieldId="source"
                  label={parseCopy.fieldSource}
                  onChangeText={(value) => updateField("source", value)}
                  palette={palette}
                  value={review.source}
                />
                <EditField
                  fieldId="target"
                  label={parseCopy.fieldTarget}
                  onChangeText={(value) => updateField("target", value)}
                  palette={palette}
                  value={review.target}
                />
                <EditField
                  fieldId="description"
                  label={parseCopy.fieldDescription}
                  onChangeText={(value) => updateField("description", value)}
                  palette={palette}
                  value={review.description}
                />
              </View>
            ) : null}

            {plannerResult &&
            plannerResult.writeProposals.length > 0 &&
            !allApproved ? (
              <View style={styles.proposalsSection}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: palette.ink, marginBottom: 12 },
                  ]}
                >
                  {parseCopy.writeProposalsTitle}
                </Text>
                {plannerResult.writeProposals.map((proposal) => (
                  <View
                    key={proposal.writeProposalId}
                    style={[
                      styles.proposalCard,
                      {
                        backgroundColor: palette.paper,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <View style={styles.proposalHeader}>
                      <Text style={[styles.proposalType, { color: palette.ink }]}>
                        {formatLedgerParseProposalType(
                          proposal.proposalType,
                          resolvedLocale,
                        )}
                      </Text>
                      <View
                        style={[
                          styles.statePill,
                          { backgroundColor: proposalStateColor(proposal.state) },
                        ]}
                      >
                        <Text style={styles.statePillText}>
                          {formatLedgerParseWorkflowState(
                            proposal.state,
                            resolvedLocale,
                          )}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.proposalRationale,
                        { color: palette.inkMuted },
                      ]}
                    >
                      {proposal.rationale}
                    </Text>
                    {proposal.state === "pending_approval" ? (
                      <View style={styles.proposalActions}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={isApproving}
                          onPress={() => approveProposal(proposal.writeProposalId)}
                          style={({ pressed }) => [
                            styles.approveButton,
                            {
                              backgroundColor: pressed
                                ? withAlpha(palette.success, 0.82)
                                : palette.success,
                              opacity: isApproving ? 0.7 : 1,
                            },
                          ]}
                          testID={`approve-${proposal.writeProposalId}`}
                        >
                          <Text style={styles.actionButtonLabel}>
                            {parseCopy.approve}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          disabled={isApproving}
                          onPress={() => rejectProposal(proposal.writeProposalId)}
                          style={({ pressed }) => [
                            styles.rejectButton,
                            {
                              backgroundColor: pressed
                                ? withAlpha(palette.destructive, 0.82)
                                : palette.destructive,
                              opacity: isApproving ? 0.7 : 1,
                            },
                          ]}
                          testID={`reject-${proposal.writeProposalId}`}
                        >
                          <Text style={styles.actionButtonLabel}>
                            {parseCopy.reject}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {allApproved ? (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: successColors.background,
                    borderColor: successColors.border,
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: successColors.text }]}>
                  {parseCopy.recordSavedTitle}
                </Text>
                <Text style={[styles.summaryText, { color: successColors.text }]}>
                  {parseCopy.recordSavedSummary}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ---- Bottom: back button (always full width) ---- */}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/ledger");
            }
          }}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: pressed
                ? primaryButton.pressedBackground
                : primaryButton.background,
            },
          ]}
        >
          <Text
            style={[styles.backButtonLabel, { color: primaryButton.text }]}
          >
            {parseCopy.backToUpload}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function EditField(props: {
  fieldId: string;
  label: string;
  onChangeText: (value: string) => void;
  palette: Record<string, string>;
  value: string;
}) {
  return (
    <View style={styles.editFieldContainer}>
      <Text style={[styles.editFieldLabel, { color: props.palette.inkMuted }]}>
        {props.label}
      </Text>
      <TextInput
        onChangeText={props.onChangeText}
        style={[
          styles.editFieldInput,
          {
            backgroundColor: props.palette.shellElevated,
            borderColor: props.palette.border,
            color: props.palette.ink,
          },
        ]}
        testID={`edit-${props.fieldId}`}
        value={props.value}
      />
    </View>
  );
}

function CategorySelector(props: {
  label: string;
  onSelect: (value: LedgerCategory) => void;
  options: Array<{ label: string; value: LedgerCategory }>;
  palette: Record<string, string>;
  selectedValue: LedgerCategory;
}) {
  return (
    <View style={styles.editFieldContainer}>
      <Text style={[styles.editFieldLabel, { color: props.palette.inkMuted }]}>
        {props.label}
      </Text>
      <View style={styles.categoryList}>
        {props.options.map((option) => {
          const selected = option.value === props.selectedValue;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => props.onSelect(option.value)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selected
                    ? props.palette.accentSoft
                    : props.palette.shellElevated,
                  borderColor: selected
                    ? props.palette.accent
                    : props.palette.border,
                },
              ]}
              testID={`category-${option.value}`}
            >
              <Text
                style={[
                  styles.categoryChipLabel,
                  {
                    color: selected ? props.palette.accent : props.palette.ink,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StatPill(props: {
  label: string;
  palette: Record<string, string>;
  value: number;
}) {
  return (
    <View
      style={[
        styles.statPillContainer,
        { backgroundColor: props.palette.shellElevated },
      ]}
    >
      <Text style={[styles.statPillValue, { color: props.palette.ink }]}>
        {props.value}
      </Text>
      <Text style={[styles.statPillLabel, { color: props.palette.inkMuted }]}>
        {props.label}
      </Text>
    </View>
  );
}

function stateColor(state: string): string {
  switch (state) {
    case "validated":
      return "#C8E6C9";
    case "needs_review":
      return "#FFF3E0";
    case "duplicate":
      return "#FFCDD2";
    case "persisted_final":
      return "#C8E6C9";
    default:
      return "#E0E0E0";
  }
}

function proposalStateColor(state: string): string {
  switch (state) {
    case "pending_approval":
      return "#FFF3E0";
    case "executed":
      return "#C8E6C9";
    case "rejected":
      return "#FFCDD2";
    case "blocked":
      return "#E0E0E0";
    default:
      return "#E0E0E0";
  }
}

function formatJson(raw: string): string {
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function tryParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  actionButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  appBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    paddingHorizontal: 18,
  },
  approveButton: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  backButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    marginTop: 8,
  },
  backButtonLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  container: {
    gap: 14,
    padding: 18,
    paddingBottom: 36,
  },
  containerWide: {
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 20,
  },
  columnLeft: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
  },
  categoryChip: {
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryChipLabel: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  editFieldContainer: {
    gap: 4,
  },
  editFieldInput: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 14,
    height: 44,
    paddingHorizontal: 14,
  },
  editFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  fileName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  heroBlock: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  jsonBox: {
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 200,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  jsonBoxWide: {
    minHeight: 420,
  },
  jsonText: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
  loadingCaption: {
    fontSize: 12,
    fontWeight: "600",
  },
  loadingHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
  },
  primaryButtonLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  proposalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  proposalCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
    padding: 14,
  },
  proposalDetailLine: {
    fontSize: 12,
    lineHeight: 17,
  },
  proposalDetailList: {
    gap: 4,
  },
  proposalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  proposalRationale: {
    fontSize: 13,
    lineHeight: 18,
  },
  proposalSummary: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  proposalType: {
    fontSize: 15,
    fontWeight: "700",
  },
  proposalsSection: {
    gap: 0,
  },
  rejectButton: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 14,
  },
  safeArea: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  statePill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statePillRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  statePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statPillContainer: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  statPillValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningList: {
    gap: 4,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
