import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomSheet } from "../components/BottomSheet";
import { api, ApiError } from "../lib/api";
import { useStore } from "../lib/store";
import type { Playable } from "../lib/types";

const REASONS = [
  { key: "spam", label: "Spam or misleading" },
  { key: "hate", label: "Hate or harassment" },
  { key: "violence", label: "Violence / graphic content" },
  { key: "adult", label: "Adult content" },
  { key: "other", label: "Something else" },
];

export function ReportSheet({
  item,
  open,
  onClose,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useStore((s) => s.toast);
  const [busy, setBusy] = useState<string | null>(null);

  if (!item) return null;

  const submit = async (reason: string) => {
    setBusy(reason);
    try {
      await api("/api/reports", {
        body: { playableId: item.id, reason },
      });
      toast("Report submitted");
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Report failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Report">
      <View style={styles.body}>
        {REASONS.map((r) => (
          <Pressable
            key={r.key}
            style={styles.row}
            disabled={!!busy}
            onPress={() => submit(r.key)}
          >
            <Text style={styles.label}>{r.label}</Text>
            {busy === r.key && <ActivityIndicator color="#ffffff88" />}
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ffffff14",
  },
  label: {
    color: "#fff",
    fontSize: 14,
  },
});
