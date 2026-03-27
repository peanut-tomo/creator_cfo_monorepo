import * as AppleAuthentication from "expo-apple-authentication";
import { Redirect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { LaunchScreen } from "../app-shell/launch-screen";
import { useAppShell } from "../app-shell/provider";

function isCancelledAppleRequest(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ERR_REQUEST_CANCELED"
  );
}

export function LoginScreen() {
  const router = useRouter();
  const { continueAsGuest, copy, isHydrated, palette, session, signInWithApple } = useAppShell();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleMessage, setAppleMessage] = useState(copy.login.appleHint);

  useEffect(() => {
    let isMounted = true;

    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (isMounted) {
          setAppleAvailable(available);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAppleAvailable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isHydrated) {
    return <LaunchScreen />;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  const handleGuestMode = async () => {
    await continueAsGuest();
    router.replace("/(tabs)");
  };

  const handleAppleSignIn = async () => {
    if (!appleAvailable) {
      setAppleMessage(copy.login.appleUnavailable);
      return;
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      await signInWithApple({
        email: credential.email,
        familyName: credential.fullName?.familyName,
        givenName: credential.fullName?.givenName,
        user: credential.user,
      });

      router.replace("/(tabs)");
    } catch (error) {
      setAppleMessage(
        isCancelledAppleRequest(error) ? copy.login.appleCancelled : copy.login.appleUnavailable,
      );
    }
  };

  return (
    <LinearGradient
      colors={[palette.heroStart, palette.heroEnd, palette.shell]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.topBar}>
            <Text style={[styles.topBarTitle, { color: palette.inkOnAccent }]}>{copy.common.appName}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleGuestMode}
              style={[styles.skipButton, { borderColor: palette.border }]}
            >
              <Text style={[styles.skipLabel, { color: palette.inkOnAccent }]}>{copy.login.skip}</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: palette.paper,
                borderColor: palette.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <Text style={[styles.eyebrow, { color: palette.accent }]}>{copy.login.eyebrow}</Text>
            <Text style={[styles.title, { color: palette.ink }]}>{copy.login.title}</Text>
            <Text style={[styles.summary, { color: palette.inkMuted }]}>{copy.login.body}</Text>

            <View style={styles.benefits}>
              <View
                style={[
                  styles.benefitCard,
                  { backgroundColor: palette.accentSoft, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.benefitTitle, { color: palette.ink }]}>{copy.tabs.home}</Text>
                <Text style={[styles.benefitSummary, { color: palette.inkMuted }]}>
                  {copy.home.focusCards[0]?.summary}
                </Text>
              </View>
              <View
                style={[
                  styles.benefitCard,
                  { backgroundColor: palette.paperMuted, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.benefitTitle, { color: palette.ink }]}>{copy.common.theme}</Text>
                <Text style={[styles.benefitSummary, { color: palette.inkMuted }]}>
                  {copy.meScreen.themeDescription}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              {appleAvailable ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonStyle={
                    palette.appleButtonStyle === "black"
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                      : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  }
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  cornerRadius={18}
                  onPress={handleAppleSignIn}
                  style={styles.appleButton}
                />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleAppleSignIn}
                  style={[
                    styles.fallbackAppleButton,
                    {
                      backgroundColor: palette.paperMuted,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text style={[styles.fallbackAppleLabel, { color: palette.ink }]}>
                    {copy.login.appleButton}
                  </Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={handleGuestMode}
                style={[styles.guestButton, { backgroundColor: palette.accent }]}
              >
                <Text style={[styles.guestLabel, { color: palette.inkOnAccent }]}>
                  {copy.login.skip}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.caption, { color: palette.inkMuted }]}>{appleMessage}</Text>
            <Text style={[styles.caption, { color: palette.inkMuted }]}>{copy.login.caption}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  appleButton: {
    height: 52,
    width: "100%",
  },
  benefitCard: {
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 120,
    padding: 16,
  },
  benefitSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  benefitTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  benefits: {
    flexDirection: "row",
    gap: 12,
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
  },
  container: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  fallbackAppleButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 20,
  },
  fallbackAppleLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  gradient: {
    flex: 1,
  },
  guestButton: {
    alignItems: "center",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 20,
  },
  guestLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  heroCard: {
    borderRadius: 32,
    borderWidth: 1,
    gap: 18,
    padding: 22,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  safeArea: {
    flex: 1,
  },
  skipButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  skipLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
});
