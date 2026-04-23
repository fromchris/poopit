// Settings sheet: account, playback prefs (reduced motion, data saver),
// language picker (en / zh), privacy links, sign out.

import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { BottomSheet } from "../components/BottomSheet";
import { useStore } from "../lib/store";
import { useLocale, useT } from "../lib/i18n";
import { usePrefs } from "../lib/prefs";

export function SettingsSheet({
  open,
  onClose,
  onOpenEditProfile,
}: {
  open: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
}) {
  const t = useT();
  const me = useStore((s) => s.me);
  const signOut = useStore((s) => s.signOut);

  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);

  const reducedMotion = usePrefs((s) => s.reducedMotion);
  const dataSaver = usePrefs((s) => s.dataSaver);
  const setReducedMotion = usePrefs((s) => s.setReducedMotion);
  const setDataSaver = usePrefs((s) => s.setDataSaver);

  if (!me) return null;

  const confirmSignOut = () => {
    Alert.alert(
      t("settings.signOutConfirm.title"),
      t("settings.signOutConfirm.body"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.signOut"),
          style: "destructive",
          onPress: () => {
            signOut();
            onClose();
          },
        },
      ],
    );
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t("settings.title")}>
      <View style={styles.body}>
        <Section title={t("settings.account")}>
          <Row
            label={t("profile.edit")}
            onPress={() => {
              onClose();
              onOpenEditProfile();
            }}
          />
          <Row
            label={t("settings.signedInAs", { handle: me.handle })}
            muted
          />
        </Section>

        <Section title={t("settings.playback")}>
          <ToggleRow
            label={t("settings.reducedMotion")}
            value={reducedMotion}
            onChange={setReducedMotion}
          />
          <ToggleRow
            label={t("settings.dataSaver")}
            value={dataSaver}
            onChange={setDataSaver}
          />
        </Section>

        <Section title={t("settings.language")}>
          <View style={styles.langRow}>
            <LangChip
              active={locale === "en"}
              label="English"
              onPress={() => setLocale("en")}
            />
            <LangChip
              active={locale === "zh"}
              label="中文"
              onPress={() => setLocale("zh")}
            />
          </View>
        </Section>

        <Section title={t("settings.privacy")}>
          <Row label={t("settings.privacyPolicy")} muted />
          <Row label={t("settings.terms")} muted />
          <Row label={t("settings.help")} muted />
          <Row label={t("settings.export")} muted />
        </Section>

        <Section title="">
          <Row
            label={t("settings.signOut")}
            danger
            onPress={confirmSignOut}
          />
        </Section>

        <Text style={styles.version}>{t("settings.version")}</Text>
      </View>
    </BottomSheet>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

function Row({
  label,
  onPress,
  danger,
  muted,
}: {
  label: string;
  onPress?: () => void;
  danger?: boolean;
  muted?: boolean;
}) {
  const content = (
    <Text
      style={[
        styles.rowText,
        danger && { color: "#fb7185" },
        muted && { color: "#ffffffa0" },
      ]}
    >
      {label}
    </Text>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.row}
    >
      {content}
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#3f3f46", true: "#ec4899" }}
        thumbColor="#fff"
        ios_backgroundColor="#3f3f46"
      />
    </View>
  );
}

function LangChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.langChip, active && styles.langChipActive]}
    >
      <Text
        style={[
          styles.langChipText,
          active && { color: "#000" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#ffffff80",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ffffff10",
  },
  rowText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    flex: 1,
  },
  langRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  langChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff14",
  },
  langChipActive: {
    backgroundColor: "#fff",
  },
  langChipText: {
    color: "#ffffffd0",
    fontSize: 13,
    fontWeight: "700",
  },
  version: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 11,
    color: "#ffffff55",
  },
});
