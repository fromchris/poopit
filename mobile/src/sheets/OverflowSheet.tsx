import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomSheet } from "../components/BottomSheet";
import { FlagIcon, HideIcon, TrashIcon } from "../components/Icons";
import { api, ApiError } from "../lib/api";
import { useStore } from "../lib/store";
import type { Playable } from "../lib/types";

export function OverflowSheet({
  item,
  open,
  onClose,
  onReport,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
  onReport: () => void;
}) {
  const me = useStore((s) => s.me);
  const hidePlayable = useStore((s) => s.hidePlayable);
  const removePlayable = useStore((s) => s.removePlayable);
  const toast = useStore((s) => s.toast);

  if (!item) return null;
  const isOwn = !!me && item.author.handle === me.handle;

  const handleHide = () => {
    hidePlayable(item.id);
    toast("Hidden from your feed");
    onClose();
  };

  const handleDelete = () => {
    Alert.alert("Delete playable?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/api/playables/${item.id}`, { method: "DELETE" });
            removePlayable(item.id);
            toast("Deleted");
          } catch (err) {
            toast(err instanceof ApiError ? err.message : "Delete failed");
          } finally {
            onClose();
          }
        },
      },
    ]);
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <View style={styles.body}>
        <Row
          icon={<HideIcon size={22} color="#fff" />}
          label="Not interested"
          onPress={handleHide}
        />
        <Row
          icon={<FlagIcon size={22} color="#fff" />}
          label="Report"
          onPress={() => {
            onClose();
            onReport();
          }}
        />
        {isOwn && (
          <Row
            icon={<TrashIcon size={22} color="#fb7185" />}
            label="Delete"
            onPress={handleDelete}
            danger
          />
        )}
      </View>
    </BottomSheet>
  );
}

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.label, danger && { color: "#fb7185" }]}>
        {label}
      </Text>
    </Pressable>
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
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ffffff14",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff12",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
