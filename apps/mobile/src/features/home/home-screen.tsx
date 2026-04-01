import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../../components/app-icon";
import { CfoAvatar } from "../../components/cfo-avatar";
import { useAppShell } from "../app-shell/provider";

const profitBars = [
  { id: "jan", label: "JAN", height: 102, active: false },
  { id: "feb", label: "FEB", height: 141, active: false },
  { id: "mar", label: "MAR", height: 179, active: true },
  { id: "apr", label: "APR", height: 115, active: false },
  { id: "may", label: "MAY", height: 218, active: false },
  { id: "jun", label: "JUN", height: 154, active: false },
];

const reminders = [
  {
    id: "deadline",
    eyebrow: "Critical Deadline",
    title: "Tax Filing: April 15",
    summary: "Review Q1 documents before Friday.",
    backgroundColor: "rgba(255, 218, 214, 0.3)",
    eyebrowColor: "#BA1A1A",
    borderColor: "#BA1A1A",
  },
  {
    id: "refund",
    eyebrow: "Incoming Credit",
    title: "Tax Refund: TBD",
    summary: "Status: Processing by authorities.",
    backgroundColor: "rgba(195, 233, 197, 0.3)",
    eyebrowColor: "#45664A",
    borderColor: "#45664A",
  },
  {
    id: "license",
    title: "Licensing Renewal",
    summary: "Due in 24 days.",
    backgroundColor: "#F4F4F2",
  },
];

const activityRows = [
  {
    id: "twitch",
    title: "Twitch Partner\nPayout",
    type: "income",
    amount: "+$4,250.00",
    date: "May 12, 2024",
    icon: "cash-plus",
  },
  {
    id: "cloud",
    title: "Cloud Hosting -\nProduction",
    type: "spending",
    amount: "-$120.50",
    date: "May 11, 2024",
    icon: "cloud-outline",
  },
  {
    id: "adsense",
    title: "AdSense Revenue\nShare",
    type: "income",
    amount: "+$1,930.30",
    date: "May 10, 2024",
    icon: "trending-up",
  },
  {
    id: "lease",
    title: "Studio Equipment\nLease",
    type: "spending",
    amount: "-$850.00",
    date: "May 09, 2024",
    icon: "desktop-outline",
  },
  {
    id: "sponsorship",
    title: "Sponsorship:\nTechBrand",
    type: "income",
    amount: "+$12,000.00",
    date: "May 08, 2024",
    icon: "briefcase-outline",
  },
  {
    id: "newsletter",
    title: "Newsletter SaaS\nSubscription",
    type: "spending",
    amount: "-$45.00",
    date: "May 07, 2024",
    icon: "mail-outline",
  },
  {
    id: "merch",
    title: "Merchandise Sale\nCommissions",
    type: "income",
    amount: "+$640.22",
    date: "May 06, 2024",
    icon: "bag-handle-outline",
  },
  {
    id: "dinner",
    title: "Client Business Dinner",
    type: "spending",
    amount: "-$156.70",
    date: "May 05, 2024",
    icon: "restaurant-outline",
  },
  {
    id: "interest",
    title: "Interest Credit",
    type: "income",
    amount: "+$12.45",
    date: "May 04, 2024",
    icon: "leaf-outline",
  },
  {
    id: "electricity",
    title: "Studio Electricity Bill",
    type: "spending",
    amount: "-$312.00",
    date: "May 03, 2024",
    icon: "flash-outline",
  },
];

function ActivityIcon({ color, icon }: { color: string; icon: string }) {
  if (icon === "cash-plus") {
    return <MaterialCommunityIcons color={color} name="cash-plus" size={18} />;
  }

  return <Ionicons color={color} name={icon as React.ComponentProps<typeof Ionicons>["name"]} size={18} />;
}

export function HomeScreen() {
  const router = useRouter();
  const { copy, palette } = useAppShell();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <CfoAvatar />
            <Text style={[styles.brand, { color: palette.ink }]}>{copy.common.appName}</Text>
          </View>
          <Pressable
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.notificationButton,
              { backgroundColor: pressed ? "#ECECE8" : "#F4F4F2" },
            ]}
          >
            <Ionicons color="#002045" name="notifications-outline" size={18} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={[styles.heroTitle, { color: "rgba(0, 32, 69, 0.6)" }]}>Monthly Profit</Text>
          <Text style={[styles.heroAmount, { color: "#002045" }]}>$142,850.42</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/ledger/parse")}
            style={({ pressed }) => [
              styles.heroAction,
              {
                backgroundColor: pressed ? "#173761" : "#002045",
                borderColor: "transparent",
              },
            ]}
          >
            <View style={styles.heroActionContent}>
              <AppIcon color="#FFFFFF" name="add" size={11} />
              <Text style={styles.heroActionLabel}>New Records</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.mainStack}>
          <View style={styles.profitCard}>
            <View style={styles.profitHeader}>
              <Text style={styles.profitTitle}>Monthly{"\n"}Profit</Text>
            </View>

            <View style={styles.chartShell}>
              <View style={styles.chartAxis}>
                <Text style={styles.axisLabel}>$50k</Text>
                <Text style={styles.axisLabel}>$25k</Text>
                <Text style={styles.axisLabel}>$0k</Text>
              </View>
              <View style={styles.barRow}>
                {profitBars.map((bar) => (
                  <View key={bar.id} style={styles.barColumn}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: bar.active ? "#002045" : "#F4F4F2",
                          height: bar.height,
                        },
                      ]}
                    />
                    <Text style={[styles.barLabel, { color: bar.active ? "#002045" : "#74777F" }]}>{bar.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.remindersSection}>
            <Text style={styles.sectionHeading}>Reminders</Text>
            <View style={styles.remindersList}>
              {reminders.map((reminder) => (
                <View
                  key={reminder.id}
                  style={[
                    styles.reminderCard,
                    {
                      backgroundColor: reminder.backgroundColor,
                      borderLeftColor: reminder.borderColor ?? "transparent",
                      borderLeftWidth: reminder.borderColor ? 4 : 0,
                      borderRadius: reminder.borderColor ? 0 : 32,
                      borderBottomLeftRadius: reminder.borderColor ? 0 : 32,
                      borderTopLeftRadius: reminder.borderColor ? 0 : 32,
                      paddingLeft: reminder.borderColor ? 24 : 24,
                    },
                  ]}
                >
                  {reminder.eyebrow ? (
                    <Text style={[styles.reminderEyebrow, { color: reminder.eyebrowColor }]}>{reminder.eyebrow}</Text>
                  ) : null}
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderSummary}>{reminder.summary}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <View style={styles.activityHeaderCopy}>
              <Text style={styles.activityTitle}>Recent Activity</Text>
              <Text style={styles.activitySubtitle}>Your ledger status across all platforms</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/ledger")}>
              <Text style={styles.seeAllLink}>See All</Text>
            </Pressable>
          </View>

          <View style={styles.activityCard}>
            {activityRows.map((item, index) => {
              const income = item.type === "income";
              const accent = income ? "#45664A" : "#BA1A1A";

              return (
                <View key={item.id} style={[styles.activityRow, index > 0 ? styles.activityRowBorder : null]}>
                  <View style={styles.activityLeft}>
                    <View
                      style={[
                        styles.activityIconWrap,
                        { backgroundColor: income ? "#C3E9C5" : "rgba(255, 218, 214, 0.3)" },
                      ]}
                    >
                      <ActivityIcon color={accent} icon={item.icon} />
                    </View>
                    <View style={styles.activityCopy}>
                      <Text style={styles.activityItemTitle}>{item.title}</Text>
                      <Text style={[styles.activityItemType, { color: accent }]}>
                        {income ? "Income" : "Spending"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityAmount}>{item.amount}</Text>
                    <Text style={styles.activityDate}>{item.date}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activityAmount: {
    color: "#002045",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "right",
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(196, 198, 207, 0.1)",
    borderRadius: 32,
    borderWidth: 1,
    overflow: "hidden",
  },
  activityCopy: {
    flex: 1,
    gap: 3,
  },
  activityDate: {
    color: "#74777F",
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 15,
    textAlign: "right",
  },
  activityHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  activityIconWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  activityItemTitle: {
    color: "#002045",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  activityItemType: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  activityLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 16,
  },
  activityRight: {
    gap: 2,
    minWidth: 100,
  },
  activityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  activityRowBorder: {
    borderTopColor: "#EEEEEC",
    borderTopWidth: 1,
  },
  activitySection: {
    gap: 32,
  },
  activitySubtitle: {
    color: "#43474E",
    fontSize: 14,
    lineHeight: 20,
  },
  activityTitle: {
    color: "#002045",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
  },
  axisLabel: {
    color: "#74777F",
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 15,
  },
  bar: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    maxWidth: 40,
    width: "100%",
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    justifyContent: "flex-end",
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 15,
  },
  barRow: {
    flexDirection: "row",
    gap: 8,
    height: 256,
    paddingLeft: 18,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  chartAxis: {
    bottom: 0,
    justifyContent: "space-between",
    left: 0,
    paddingVertical: 8,
    position: "absolute",
    top: 0,
  },
  chartShell: {
    minHeight: 256,
    paddingLeft: 6,
    position: "relative",
  },
  container: {
    backgroundColor: "#F9F9F7",
    gap: 48,
    paddingBottom: 128,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heroAction: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    marginTop: 40,
  },
  heroActionContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  heroActionLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  heroCard: {
    gap: 0,
  },
  heroTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  heroAmount: {
    fontSize: 50,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 52,
  },
  mainStack: {
    gap: 32,
  },
  notificationButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    position: "relative",
    width: 36,
  },
  notificationDot: {
    backgroundColor: "#C46D5E",
    borderRadius: 999,
    height: 8,
    position: "absolute",
    right: 8,
    top: 7,
    width: 8,
  },
  profitCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(196, 198, 207, 0.1)",
    borderRadius: 32,
    borderWidth: 1,
    gap: 40,
    padding: 33,
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },
  profitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profitTitle: {
    color: "#002045",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  reminderCard: {
    borderBottomRightRadius: 32,
    borderTopRightRadius: 32,
    gap: 4,
    paddingRight: 24,
    paddingVertical: 24,
  },
  reminderEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  reminderSummary: {
    color: "#43474E",
    fontSize: 14,
    lineHeight: 20,
  },
  reminderTitle: {
    color: "#002045",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  remindersList: {
    gap: 16,
  },
  remindersSection: {
    gap: 24,
  },
  safeArea: {
    backgroundColor: "#F9F9F7",
    flex: 1,
  },
  sectionHeading: {
    color: "#002045",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  seeAllLink: {
    borderBottomColor: "rgba(0, 32, 69, 0.1)",
    borderBottomWidth: 2,
    color: "#002045",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    paddingBottom: 6,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
