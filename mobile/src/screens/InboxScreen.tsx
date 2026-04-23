// Native port of app/components/InboxScreen.tsx. Consumes the store's
// notifications list (seeded by loadNotifications + kept fresh by the
// SSE subscriber wired up in App.tsx).

import { useEffect } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gradient } from "../components/Gradient";
import { parseGradient } from "../lib/theme";
import { useStore, type Notification } from "../lib/store";

const LABELS: Record<string, string> = {
  like: "liked your playable",
  comment: "commented on",
  follow: "started following you",
  remix: "remixed",
  generation_ready: "your playable is ready",
  generation_failed: "generation failed",
};

export function InboxScreen() {
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.me);
  const notifications = useStore((s) => s.notifications);
  const loadNotifications = useStore((s) => s.loadNotifications);
  const markAllRead = useStore((s) => s.markAllRead);

  useEffect(() => {
    if (!me) return;
    loadNotifications();
    // mark read after a moment so the user sees the bold state briefly
    const t = setTimeout(() => markAllRead(), 800);
    return () => clearTimeout(t);
  }, [me, loadNotifications, markAllRead]);

  if (!me) {
    return (
      <View style={[styles.full, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.emptyTitle}>Inbox</Text>
        <Text style={styles.emptyText}>Sign in to see your Inbox</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.header}>Inbox</Text>
      {notifications.length === 0 ? (
        <View style={styles.full}>
          <Text style={styles.emptyText}>Nothing new here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => <Row n={item} />}
        />
      )}
    </View>
  );
}

function Row({ n }: { n: Notification }) {
  const stops = parseGradient(n.avatarBg);
  return (
    <Pressable style={[styles.row, !n.read && styles.rowUnread]}>
      <View style={styles.avatar}>
        <Gradient colors={stops} borderRadius={20} />
        <Text style={styles.avatarEmoji}>{n.avatar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={styles.body}>
          <Text style={styles.handle}>{n.handle}</Text>{" "}
          <Text style={styles.bodyText}>
            {LABELS[n.type] ?? n.type}
            {n.target ? ` "${n.target}"` : ""}
          </Text>
        </Text>
        {n.preview ? (
          <Text numberOfLines={1} style={styles.preview}>
            {n.preview}
          </Text>
        ) : null}
        <Text style={styles.time}>{n.timeAgo}</Text>
      </View>
      {!n.read && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  full: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  emptyText: {
    marginTop: 8,
    color: "#ffffff80",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ffffff12",
  },
  rowUnread: {
    backgroundColor: "#ffffff06",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 20,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  handle: {
    color: "#fff",
    fontWeight: "700",
  },
  bodyText: {
    color: "#ffffffd0",
  },
  preview: {
    marginTop: 2,
    color: "#ffffff80",
    fontSize: 12,
  },
  time: {
    marginTop: 4,
    color: "#ffffff55",
    fontSize: 11,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ec4899",
  },
});
