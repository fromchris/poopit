import * as Clipboard from "expo-clipboard";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "../components/BottomSheet";
import { LinkIcon, ShareIcon } from "../components/Icons";
import { backendUrl } from "../lib/api";
import { useStore } from "../lib/store";
import type { Playable } from "../lib/types";

export function ShareSheet({
  item,
  open,
  onClose,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useStore((s) => s.toast);
  if (!item) return null;

  const url = `${backendUrl()}/p/${item.id}`;

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    toast("Link copied");
    onClose();
  };

  const shareNative = async () => {
    try {
      await Share.share({ message: `${item.title}\n${url}`, url });
    } catch {}
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Share">
      <View style={styles.body}>
        <Row icon={<LinkIcon size={22} />} label="Copy link" onPress={copy} />
        <Row
          icon={<ShareIcon size={22} />}
          label="Share to…"
          onPress={shareNative}
        />
      </View>
    </BottomSheet>
  );
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
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
