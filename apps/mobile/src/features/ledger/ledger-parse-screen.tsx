import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackHeaderBar } from "../../components/back-header-bar";
import { CfoAvatar } from "../../components/cfo-avatar";
import { useAppShell } from "../app-shell/provider";
import { parseCategoryOptions, parseFieldSeeds } from "./ledger-mocks";

type ParseFieldId = (typeof parseFieldSeeds)[number]["id"];

function isMultilineField(fieldId: ParseFieldId) {
  return fieldId === "summary";
}

function getKeyboardType(fieldId: ParseFieldId): "decimal-pad" | "default" {
  return fieldId === "amount" ? "decimal-pad" : "default";
}

export function LedgerParseScreen() {
  const router = useRouter();
  const { copy, palette } = useAppShell();
  const [selectedCategory, setSelectedCategory] = useState<"income" | "expense" | "spending">("expense");
  const initialFieldValues = useMemo(
    () =>
      Object.fromEntries(parseFieldSeeds.map((field) => [field.id, field.value])) as Record<ParseFieldId, string>,
    [],
  );
  const [fieldValues, setFieldValues] = useState<Record<ParseFieldId, string>>(initialFieldValues);
  const [draftValues, setDraftValues] = useState<Record<ParseFieldId, string>>(initialFieldValues);
  const [editingField, setEditingField] = useState<ParseFieldId | null>(null);
  const [pendingEdit, setPendingEdit] = useState<{ fieldId: ParseFieldId; nextValue: string } | null>(null);

  const activeFieldLabel = pendingEdit
    ? parseFieldSeeds.find((field) => field.id === pendingEdit.fieldId)?.label ?? ""
    : "";

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
          onBack={() => router.back()}
          palette={palette}
          rightAccessory={<CfoAvatar />}
          title={copy.common.appName}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroBlock}>
          <Text style={[styles.eyebrow, { color: palette.inkMuted }]}>Verification workflow</Text>
          <Text style={[styles.heroTitle, { color: palette.ink }]}>{copy.ledger.parse.title}</Text>
          <Text style={[styles.heroSummary, { color: palette.inkMuted }]}>{copy.ledger.parse.summary}</Text>
        </View>

        <View
          style={[
            styles.documentCard,
            {
              backgroundColor: palette.paper,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.documentHeader}>
            <Text numberOfLines={1} style={[styles.documentName, { color: palette.ink }]}>
              original_receipt_v4.pdf
            </Text>
            <View style={styles.documentTools}>
              <View style={[styles.toolDot, { backgroundColor: palette.paperMuted }]}>
                <Feather color={palette.inkMuted} name="search" size={14} />
              </View>
              <View style={[styles.toolDot, { backgroundColor: palette.paperMuted }]}>
                <MaterialCommunityIcons color={palette.inkMuted} name="arrow-top-right" size={14} />
              </View>
            </View>
          </View>
          <View style={[styles.previewFrame, { backgroundColor: palette.shellElevated, borderColor: palette.border }]}>
            <View style={[styles.previewPoster, { backgroundColor: palette.ink }]}>
              <Text style={[styles.previewPosterTitle, { color: palette.inkOnAccent }]}>DOCUMENT</Text>
              <Text style={[styles.previewPosterSub, { color: palette.inkOnAccent }]}>SAFE REVIEW</Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: palette.shellElevated,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.summaryHeader}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>Parsed Fields</Text>
              <Text style={[styles.summaryTitle, { color: palette.ink }]}>Review and adjust extracted data</Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            {parseFieldSeeds.map((field) => {
              const isEditing = editingField === field.id;
              const value = isEditing ? draftValues[field.id] : fieldValues[field.id];
              const multiline = isMultilineField(field.id);

              return (
                <View
                  key={field.id}
                  style={[
                    styles.summaryCell,
                    multiline ? styles.summaryCellFull : styles.summaryCellHalf,
                  ]}
                >
                  <View style={styles.summaryCellHeader}>
                    <Text style={[styles.summaryLabel, { color: palette.inkMuted }]}>{field.label}</Text>
                    {isEditing ? (
                      <View style={styles.summaryCellActions}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            setDraftValues((current) => ({ ...current, [field.id]: fieldValues[field.id] }));
                            setEditingField(null);
                          }}
                        >
                          <Text style={[styles.fieldActionLabel, { color: palette.inkMuted }]}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            const nextValue = draftValues[field.id].trim();

                            if (nextValue === fieldValues[field.id]) {
                              setEditingField(null);
                              return;
                            }

                            setPendingEdit({
                              fieldId: field.id,
                              nextValue,
                            });
                          }}
                        >
                          <Text style={[styles.fieldActionLabel, { color: palette.accent }]}>Save</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setDraftValues((current) => ({ ...current, [field.id]: fieldValues[field.id] }));
                          setEditingField(field.id);
                        }}
                      >
                        <Text style={[styles.fieldActionLabel, { color: palette.accent }]}>Edit</Text>
                      </Pressable>
                    )}
                  </View>

                  <View
                    style={[
                      styles.summaryValueBox,
                      {
                        backgroundColor: palette.paperMuted,
                        borderColor: isEditing ? palette.accent : "transparent",
                      },
                    ]}
                  >
                    <TextInput
                      editable={isEditing}
                      keyboardType={getKeyboardType(field.id)}
                      multiline={multiline}
                      onChangeText={(text) => {
                        setDraftValues((current) => ({ ...current, [field.id]: text }));
                      }}
                      placeholderTextColor={palette.inkMuted}
                      style={[
                        styles.summaryInput,
                        multiline ? styles.summaryInputMultiline : null,
                        { color: palette.ink },
                      ]}
                      value={value}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={[styles.categoryTitle, { color: palette.ink }]}>Financial Category</Text>
          {parseCategoryOptions.map((option) => {
            const selected = option.id === selectedCategory;

            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setSelectedCategory(option.id)}
                style={({ pressed }) => [
                  styles.categoryRow,
                  {
                    backgroundColor: pressed || selected ? palette.paperMuted : palette.paper,
                    borderColor: selected ? palette.accent : palette.border,
                  },
                ]}
                testID={`ledger-parse-category-${option.id}`}
              >
                <View style={[styles.categoryBadge, { backgroundColor: palette.accentSoft }]}>
                  {option.id === "income" ? (
                    <MaterialCommunityIcons color={palette.accent} name="chart-line" size={18} />
                  ) : option.id === "expense" ? (
                    <MaterialCommunityIcons color={palette.accent} name="bag-personal-outline" size={18} />
                  ) : (
                    <MaterialCommunityIcons color={palette.accent} name="wallet-outline" size={18} />
                  )}
                </View>
                <View style={styles.categoryCopy}>
                  <Text style={[styles.categoryHeading, { color: palette.ink }]}>{option.title}</Text>
                  <Text style={[styles.categoryDescription, { color: palette.inkMuted }]}>{option.description}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: selected ? palette.accent : palette.inkMuted,
                      backgroundColor: selected ? palette.accent : "transparent",
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/(tabs)/ledger")}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: pressed ? palette.heroEnd : palette.ink },
          ]}
          testID="ledger-parse-confirm-button"
        >
          <Text style={[styles.primaryButtonLabel, { color: palette.inkOnAccent }]}>Confirm & Save</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: pressed ? palette.paperMuted : palette.paper,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.secondaryButtonLabel, { color: palette.inkMuted }]}>Discard</Text>
        </Pressable>
      </ScrollView>

      <Modal animationType="fade" transparent visible={pendingEdit !== null}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: palette.paper,
                borderColor: palette.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: palette.ink }]}>是否确认编辑？</Text>
            <Text style={[styles.modalBody, { color: palette.inkMuted }]}>
              {activeFieldLabel} will be updated to:
            </Text>
            <Text style={[styles.modalValue, { color: palette.ink }]}>
              {pendingEdit?.nextValue || "Empty value"}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPendingEdit(null)}
                style={[styles.modalButtonSecondary, { borderColor: palette.border }]}
              >
                <Text style={[styles.modalButtonSecondaryLabel, { color: palette.ink }]}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (!pendingEdit) {
                    return;
                  }

                  setFieldValues((current) => ({
                    ...current,
                    [pendingEdit.fieldId]: pendingEdit.nextValue,
                  }));
                  setDraftValues((current) => ({
                    ...current,
                    [pendingEdit.fieldId]: pendingEdit.nextValue,
                  }));
                  setEditingField(null);
                  setPendingEdit(null);
                }}
                style={[styles.modalButtonPrimary, { backgroundColor: palette.accent }]}
              >
                <Text style={[styles.modalButtonPrimaryLabel, { color: palette.inkOnAccent }]}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  categoryBadge: {
    alignItems: "center",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  categoryCopy: {
    flex: 1,
    gap: 3,
  },
  categoryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  categoryHeading: {
    fontSize: 15,
    fontWeight: "700",
  },
  categoryRow: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
  },
  container: {
    gap: 18,
    padding: 20,
    paddingBottom: 34,
  },
  documentCard: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  documentHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    marginRight: 12,
  },
  documentTools: {
    flexDirection: "row",
    gap: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  fieldActionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroBlock: {
    gap: 10,
  },
  heroSummary: {
    fontSize: 17,
    lineHeight: 26,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 42,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(7, 24, 22, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalButtonPrimary: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
  },
  modalButtonPrimaryLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  modalButtonSecondary: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
  },
  modalButtonSecondaryLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    maxWidth: 360,
    padding: 20,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    width: "100%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  modalValue: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  previewFrame: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 228,
    padding: 24,
  },
  previewPoster: {
    alignItems: "center",
    borderRadius: 2,
    height: 130,
    justifyContent: "center",
    width: 100,
  },
  previewPosterSub: {
    fontSize: 10,
    letterSpacing: 1.1,
    opacity: 0.72,
  },
  previewPosterTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  radio: {
    borderRadius: 999,
    borderWidth: 1.5,
    height: 18,
    width: 18,
  },
  safeArea: {
    flex: 1,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryCard: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 18,
    padding: 18,
  },
  summaryCell: {
    gap: 8,
  },
  summaryCellActions: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCellFull: {
    width: "100%",
  },
  summaryCellHalf: {
    width: "48%",
  },
  summaryCellHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  summaryHeader: {
    gap: 4,
  },
  summaryInput: {
    fontSize: 15,
    fontWeight: "700",
    minHeight: 22,
    padding: 0,
  },
  summaryInputMultiline: {
    minHeight: 62,
    textAlignVertical: "top",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  summaryValueBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toolDot: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
});
