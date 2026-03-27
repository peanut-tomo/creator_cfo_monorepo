import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { SectionCard, StatPill } from "@creator-cfo/ui";

import { buildHomeSections } from "./sections";
import { bootstrapLocalStorage } from "../../storage/bootstrap";
import type { BootstrapStatus } from "../../storage/status";
import { useAppShell } from "../app-shell/provider";

export function HomeScreen() {
  const { copy, palette, session, sessionDisplayName } = useAppShell();
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({
    databaseName: "booting",
    fileCollectionCount: 0,
    fileVaultRoot: "booting",
    platformCount: 0,
    status: "idle",
    structuredTableCount: 0,
    summary: "Preparing local SQLite and file-vault contracts...",
  });
  const sections = buildHomeSections(copy, session);

  useEffect(() => {
    let isMounted = true;

    bootstrapLocalStorage()
      .then((status) => {
        if (isMounted) {
          setBootstrapStatus(status);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setBootstrapStatus({
            databaseName: "unavailable",
            fileCollectionCount: 0,
            fileVaultRoot: "unavailable",
            platformCount: sections.platforms.length,
            status: "error",
            structuredTableCount: 0,
            summary:
              error instanceof Error
                ? error.message
                : "Local bootstrap failed with an unknown error.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sections.platforms.length]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.shell }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={[
            styles.hero,
            {
              backgroundColor: palette.heroEnd,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <Text style={[styles.eyebrow, { color: palette.accent }]}>{sections.sessionTitle}</Text>
          <Text style={[styles.title, { color: palette.inkOnAccent }]}>{copy.home.focusTitle}</Text>
          <Text style={[styles.summary, { color: palette.inkOnAccent }]}>
            {sessionDisplayName}. {copy.login.body}
          </Text>

          <View style={styles.pills}>
            <StatPill
              label="Product modules"
              palette={palette}
              value={sections.modules.length.toString()}
            />
            <StatPill
              label="Supported platforms"
              palette={palette}
              value={sections.platforms.length.toString()}
            />
            <StatPill
              palette={palette}
              label={bootstrapStatus.status === "ready" ? "Tables ready" : "Bootstrap state"}
              value={
                bootstrapStatus.status === "ready"
                  ? bootstrapStatus.structuredTableCount.toString()
                  : bootstrapStatus.status
              }
            />
          </View>
        </View>

        <View style={styles.sectionStack}>
          <SectionCard
            eyebrow={copy.tabs.home}
            footer={<Text style={[styles.footerText, { color: palette.inkMuted }]}>{copy.home.moduleFooter}</Text>}
            palette={palette}
            title={copy.home.moduleTitle}
          >
            <View style={styles.focusGrid}>
              {sections.focusCards.map((card) => (
                <View
                  key={card.title}
                  style={[
                    styles.focusCard,
                    {
                      backgroundColor: palette.accentSoft,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text style={[styles.focusTitle, { color: palette.ink }]}>{card.title}</Text>
                  <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>{card.summary}</Text>
                </View>
              ))}
            </View>

            {sections.modules.map((module) => (
              <View key={module.slug} style={[styles.listRow, { borderTopColor: palette.divider }]}>
                <Text style={[styles.rowTitle, { color: palette.ink }]}>{module.title}</Text>
                <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>{module.summary}</Text>
              </View>
            ))}
          </SectionCard>

          <SectionCard
            eyebrow="Persistence"
            footer={<Text style={[styles.footerText, { color: palette.inkMuted }]}>{bootstrapStatus.summary}</Text>}
            palette={palette}
            title={copy.home.storageTitle}
          >
            {sections.storageCards.map((card) => (
              <View key={card.title} style={styles.storageMetric}>
                <Text style={[styles.storageTitle, { color: palette.accent }]}>{card.title}</Text>
                <Text style={[styles.storageValue, { color: palette.ink }]}>{card.value}</Text>
                <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>{card.label}</Text>
              </View>
            ))}

            <Text style={[styles.subheading, { color: palette.ink }]}>{copy.home.collectionsTitle}</Text>
            {sections.storageCollections.map((collection) => (
              <View
                key={collection.slug}
                style={[styles.listRow, { borderTopColor: palette.divider }]}
              >
                <Text style={[styles.rowTitle, { color: palette.ink }]}>{collection.title}</Text>
                <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>{collection.summary}</Text>
              </View>
            ))}
          </SectionCard>

          <SectionCard
            eyebrow="Workflow"
            footer={<Text style={[styles.footerText, { color: palette.inkMuted }]}>{copy.home.workflowFooter}</Text>}
            palette={palette}
            title={copy.home.workflowTitle}
          >
            {sections.workflowPrinciples.map((principle) => (
              <View
                key={principle.title}
                style={[styles.listRow, { borderTopColor: palette.divider }]}
              >
                <Text style={[styles.rowTitle, { color: palette.ink }]}>{principle.title}</Text>
                <Text style={[styles.rowSummary, { color: palette.inkMuted }]}>{principle.summary}</Text>
              </View>
            ))}
          </SectionCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    padding: 20,
    paddingBottom: 36,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  footerText: {
    fontSize: 13,
  },
  focusCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  focusGrid: {
    gap: 10,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  hero: {
    borderRadius: 30,
    borderWidth: 1,
    gap: 14,
    padding: 22,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  listRow: {
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 8,
  },
  rowSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  safeArea: {
    flex: 1,
  },
  sectionStack: {
    gap: 16,
  },
  storageMetric: {
    gap: 4,
    paddingVertical: 6,
  },
  storageTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  storageValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  subheading: {
    paddingTop: 8,
    fontSize: 15,
    fontWeight: "700",
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 38,
  },
});
