import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CfoAvatar } from "../../components/cfo-avatar";
import { useAppShell } from "../app-shell/provider";

const segmentedTabs = [
  { id: "summary", label: "明细汇总", active: true },
  { id: "balance", label: "资产负债", active: false },
  { id: "cashflow", label: "现金流", active: false },
];

const ledgerMetrics = [
  { id: "income", label: "Total Income", value: "$12,450.00", accent: true },
  { id: "spending", label: "Total Spending", value: "$8,120.45", accent: false },
];

const transactionRows = [
  {
    id: "subscription",
    title: "Subscription\nRevenue",
    meta: "Income • Oct 28",
    amount: "+$2,400.00",
    source: "Stripe Payout",
    type: "income",
    icon: "card-outline",
  },
  {
    id: "aws",
    title: "AWS Cloud Services",
    meta: "Spending • Invoice • Oct 25",
    amount: "-$450.20",
    source: "Auto-Pay",
    type: "spending",
    icon: "document-text-outline",
  },
  {
    id: "hardware",
    title: "Hardware\nProcurement",
    meta: "Spending • Oct 22",
    amount: "-$1,299.00",
    source: "Apple Store",
    type: "neutral",
    icon: "bag-handle-outline",
  },
  {
    id: "sponsorship",
    title: "Sponsorship:\nTechDaily",
    meta: "Income • Oct 20",
    amount: "+$5,000.00",
    source: "Direct Wire",
    type: "income",
    icon: "briefcase-outline",
  },
  {
    id: "creative",
    title: "Creative Suite Renewal",
    meta: "Spending • Invoice • Oct 18",
    amount: "-$52.99",
    source: "Adobe Inc.",
    type: "spending",
    icon: "document-text-outline",
  },
];

function LedgerRowIcon({ color, icon }: { color: string; icon: string }) {
  if (icon === "briefcase-outline") {
    return <Ionicons color={color} name="briefcase-outline" size={18} />;
  }

  if (icon === "bag-handle-outline") {
    return <Ionicons color={color} name="bag-handle-outline" size={18} />;
  }

  if (icon === "document-text-outline") {
    return <Ionicons color={color} name="document-text-outline" size={18} />;
  }

  return <Ionicons color={color} name="card-outline" size={18} />;
}

export function LedgerScreen() {
  const router = useRouter();
  const { copy, palette } = useAppShell();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={styles.safeArea}
      testID="ledger-screen"
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <CfoAvatar size={32} />
            <Text style={[styles.brand, { color: palette.ink }]}>{copy.common.appName}</Text>
          </View>
          <View style={styles.headerDot} />
        </View>

        <View style={styles.filterRow}>
          <View style={styles.periodBlock}>
            <Text style={styles.periodEyebrow}>Accounting Period</Text>
            <Pressable accessibilityRole="button" style={styles.periodButton}>
              <Text style={styles.periodValue}>Oct 2023</Text>
              <Ionicons color="#002045" name="chevron-down" size={14} />
            </Pressable>
          </View>

          <View style={styles.utilityActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/ledger/upload")}
              style={({ pressed }) => [styles.utilityButton, pressed ? styles.utilityButtonPressed : null]}
              testID="ledger-upload-button"
            >
              <Ionicons color="#002045" name="cloud-upload-outline" size={18} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/ledger/parse")}
              style={({ pressed }) => [styles.utilityButton, pressed ? styles.utilityButtonPressed : null]}
            >
              <MaterialCommunityIcons color="#002045" name="tune-variant" size={18} />
            </Pressable>
          </View>
        </View>

        <View style={styles.segmentedControl}>
          {segmentedTabs.map((tab) => (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              style={[styles.segmentedItem, tab.active ? styles.segmentedItemActive : null]}
            >
              <Text style={[styles.segmentedLabel, { color: tab.active ? "#002045" : "rgba(0, 32, 69, 0.5)" }]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.metricGrid}>
          {ledgerMetrics.map((metric) => (
            <View key={metric.id} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              {metric.accent ? <View style={styles.metricAccentBar} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>
          <Text style={styles.transactionsCount}>32 Records Found</Text>
        </View>

        <View style={styles.transactionList}>
          {transactionRows.map((row, index) => {
            const isIncome = row.type === "income";
            const isSpending = row.type === "spending";
            const iconBackground = isIncome
              ? "rgba(195, 233, 197, 0.3)"
              : isSpending
                ? "rgba(255, 218, 214, 0.2)"
                : "#E8E8E6";
            const iconColor = isIncome ? "#45664A" : isSpending ? "#BA1A1A" : "#002045";
            const amountColor = isIncome ? "#45664A" : "#002045";

            return (
              <Pressable
                key={row.id}
                accessibilityRole="button"
                onPress={() => router.push("/ledger/parse")}
                style={({ pressed }) => [styles.transactionCard, pressed ? styles.transactionCardPressed : null]}
                testID={index === 0 ? "ledger-parse-button" : undefined}
              >
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIconWrap, { backgroundColor: iconBackground }]}>
                    <LedgerRowIcon color={iconColor} icon={row.icon} />
                  </View>
                  <View style={styles.transactionCopy}>
                    <Text style={styles.transactionTitle}>{row.title}</Text>
                    <Text style={styles.transactionMeta}>{row.meta}</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionAmount, { color: amountColor }]}>{row.amount}</Text>
                  <Text style={styles.transactionSource}>{row.source}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.endCap}>
          <View style={styles.endCapBar} />
          <Text style={styles.endCapLabel}>End of records for October</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontSize: 20,
    fontWeight: "800",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  container: {
    backgroundColor: "#F9F9F7",
    gap: 16,
    paddingBottom: 140,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  endCap: {
    alignItems: "center",
    gap: 16,
    paddingTop: 8,
  },
  endCapBar: {
    backgroundColor: "rgba(26, 54, 93, 0.1)",
    borderRadius: 999,
    height: 32,
    width: 4,
  },
  endCapLabel: {
    color: "rgba(0, 32, 69, 0.3)",
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 2,
    lineHeight: 15,
    textAlign: "center",
    textTransform: "uppercase",
  },
  filterRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerDot: {
    backgroundColor: "#002045",
    borderRadius: 999,
    height: 10,
    opacity: 0.2,
    width: 10,
  },
  metricAccentBar: {
    backgroundColor: "#45664A",
    borderBottomRightRadius: 999,
    borderTopRightRadius: 999,
    bottom: 24,
    left: 0,
    position: "absolute",
    top: 24,
    width: 4,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    flex: 1,
    gap: 8,
    minHeight: 103,
    overflow: "hidden",
    padding: 24,
    position: "relative",
  },
  metricGrid: {
    flexDirection: "row",
    gap: 16,
  },
  metricLabel: {
    color: "rgba(0, 32, 69, 0.6)",
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.5,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#002045",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
  },
  periodBlock: {
    gap: 4,
  },
  periodButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  periodEyebrow: {
    color: "rgba(0, 32, 69, 0.6)",
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  periodValue: {
    color: "#002045",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.9,
    lineHeight: 40,
  },
  safeArea: {
    backgroundColor: "#F9F9F7",
    flex: 1,
  },
  segmentedControl: {
    backgroundColor: "#F4F4F2",
    borderRadius: 999,
    flexDirection: "row",
    gap: 2,
    padding: 6,
  },
  segmentedItem: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  segmentedItemActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },
  segmentedLabel: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "right",
  },
  transactionCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  transactionCardPressed: {
    opacity: 0.88,
  },
  transactionCopy: {
    flex: 1,
    gap: 2,
  },
  transactionIconWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  transactionLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 16,
  },
  transactionList: {
    gap: 16,
  },
  transactionMeta: {
    color: "rgba(0, 32, 69, 0.4)",
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: -0.275,
    lineHeight: 17,
    textTransform: "uppercase",
  },
  transactionRight: {
    gap: 2,
    minWidth: 100,
  },
  transactionSource: {
    color: "rgba(0, 32, 69, 0.4)",
    fontSize: 10,
    fontWeight: "400",
    lineHeight: 15,
    textAlign: "right",
  },
  transactionTitle: {
    color: "#002045",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  transactionsCount: {
    color: "rgba(0, 32, 69, 0.4)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.1,
    lineHeight: 17,
    textTransform: "uppercase",
  },
  transactionsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  transactionsTitle: {
    color: "#002045",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  utilityActions: {
    flexDirection: "row",
    gap: 8,
  },
  utilityButton: {
    alignItems: "center",
    backgroundColor: "#E8E8E6",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  utilityButtonPressed: {
    opacity: 0.85,
  },
});
