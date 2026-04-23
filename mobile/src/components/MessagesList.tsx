// Conversations list for the Inbox → Messages tab.

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gradient } from "./Gradient";
import { api } from "../lib/api";
import { parseGradient } from "../lib/theme";

type Conversation = {
  id: string;
  peer: { handle: string; avatar: string; avatarBg: string } | null;
  lastMessage: { body: string; fromMe: boolean; timeAgo: string } | null;
  unread: number;
  lastMessageAt: string;
};

export function MessagesList({
  onOpen,
}: {
  onOpen: (convId: string, peerHandle: string) => void;
}) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api<{ items: Conversation[] }>("/api/conversations")
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading && items.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#ec4899" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          No messages yet. Tap "Message" on anyone's profile to start.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      renderItem={({ item: c }) => (
        <Pressable
          onPress={() => c.peer && onOpen(c.id, c.peer.handle)}
          style={styles.row}
        >
          <View style={styles.avatar}>
            <Gradient
              colors={parseGradient(c.peer?.avatarBg ?? "from-zinc-700 to-zinc-900")}
              borderRadius={24}
            />
            <Text style={styles.avatarEmoji}>{c.peer?.avatar ?? "👤"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.rowHeader}>
              <Text numberOfLines={1} style={styles.handle}>
                {c.peer?.handle ?? "(deleted)"}
              </Text>
              <Text style={styles.time}>{c.lastMessage?.timeAgo}</Text>
            </View>
            <Text numberOfLines={1} style={styles.preview}>
              {c.lastMessage
                ? (c.lastMessage.fromMe ? "You: " : "") + c.lastMessage.body
                : "(no messages yet)"}
            </Text>
          </View>
          {c.unread > 0 && <View style={styles.dot} />}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  empty: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#ffffff80",
    fontSize: 13,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ffffff10",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 22,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  handle: {
    flex: 1,
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  time: {
    color: "#ffffff55",
    fontSize: 10,
  },
  preview: {
    marginTop: 2,
    color: "#ffffff80",
    fontSize: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ec4899",
  },
});
