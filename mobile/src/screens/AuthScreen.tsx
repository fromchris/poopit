// Native port of app/components/AuthScreen.tsx. Sign-in / sign-up /
// guest flow, over the same /api/auth/* endpoints the web uses.

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError } from "../lib/api";
import { useT } from "../lib/i18n";
import { useStore } from "../lib/store";
import { XIcon } from "../components/Icons";

export function AuthScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const signIn = useStore((s) => s.signIn);
  const signUp = useStore((s) => s.signUp);
  const signInAsGuest = useStore((s) => s.signInAsGuest);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!handle.trim() || !password) {
      setErr("Handle and password required");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signin") {
        await signIn(handle.trim(), password);
      } else {
        await signUp(handle.trim(), password);
      }
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const tryGuest = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await signInAsGuest();
      Alert.alert(
        t("auth.recoveryTitle"),
        t("auth.recoveryBody", { code: r.recoveryCode }),
        [{ text: t("auth.gotIt"), onPress: onClose }],
      );
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Guest sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Pressable onPress={onClose} hitSlop={12}>
            <XIcon size={24} />
          </Pressable>
        </View>

        <Text style={styles.h1}>
          {mode === "signin" ? t("auth.welcomeBack") : t("auth.makeAccount")}
        </Text>
        <Text style={styles.sub}>
          {mode === "signin"
            ? t("auth.welcomeHint")
            : t("auth.makeAccountHint")}
        </Text>

        <TextInput
          value={handle}
          onChangeText={setHandle}
          placeholder={t("auth.handle")}
          placeholderTextColor="#ffffff55"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t("auth.password")}
          placeholderTextColor="#ffffff55"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Pressable
          onPress={submit}
          disabled={busy}
          style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
        >
          {busy ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>
            {mode === "signin" ? t("auth.new") : t("auth.haveAccount")}
          </Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>{t("auth.or")}</Text>
          <View style={styles.line} />
        </View>

        <Pressable
          onPress={tryGuest}
          disabled={busy}
          style={[styles.ghostBtn, busy && { opacity: 0.6 }]}
        >
          <Text style={styles.ghostBtnText}>{t("auth.tryGuest")}</Text>
        </Pressable>
        <Text style={styles.hint}>{t("auth.demoHint")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  scroll: {
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  h1: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 6,
    fontSize: 14,
    color: "#ffffff90",
  },
  input: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffffff1a",
    backgroundColor: "#ffffff0c",
    color: "#fff",
    fontSize: 15,
  },
  err: {
    marginTop: 10,
    color: "#fb7185",
    fontSize: 13,
  },
  primaryBtn: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
  },
  linkBtn: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 6,
  },
  linkText: {
    color: "#ffffffb0",
    fontSize: 13,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ffffff20",
  },
  orText: {
    color: "#ffffff70",
    fontSize: 12,
  },
  ghostBtn: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffffff22",
  },
  ghostBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  hint: {
    marginTop: 10,
    textAlign: "center",
    color: "#ffffff55",
    fontSize: 11,
  },
});
