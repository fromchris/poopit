// Settings sheet: toggles + account section + sign-out. Port of the
// web's SettingsSheet minus the reduced-motion / data-saver knobs
// (they're client-side preferences we haven't ported yet) and the
// language picker (i18n dicts aren't wired on RN yet).

import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomSheet } from "../components/BottomSheet";
import { useStore } from "../lib/store";

export function SettingsSheet({
  open,
  onClose,
  onOpenEditProfile,
}: {
  open: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
}) {
  const me = useStore((s) => s.me);
  const signOut = useStore((s) => s.signOut);

  if (!me) return null;

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "You can always sign back in.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          signOut();
          onClose();
        },
      },
    ]);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      <View style={styles.body}>
        <Section title="Account">
          <Row
            label="Edit profile"
            onPress={() => {
              onClose();
              onOpenEditProfile();
            }}
          />
          <Row
            label={`Signed in as ${me.handle}`}
            muted
            onPress={() => {}}
          />
        </Section>

        <Section title="Privacy & support">
          <Row label="Privacy policy" onPress={() => {}} muted />
          <Row label="Terms of service" onPress={() => {}} muted />
          <Row label="Help & feedback" onPress={() => {}} muted />
          <Row label="Export my data" onPress={() => {}} muted />
        </Section>

        <Section title="">
          <Row
            label="Sign out"
            danger
            onPress={confirmSignOut}
          />
        </Section>

        <Text style={styles.version}>Loopit mobile · v0.1</Text>
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
  onPress: () => void;
  danger?: boolean;
  muted?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text
        style={[
          styles.rowText,
          danger && { color: "#fb7185" },
          muted && { color: "#ffffffa0" },
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
    marginTop: 12,
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ffffff10",
  },
  rowText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  version: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 11,
    color: "#ffffff55",
  },
});
