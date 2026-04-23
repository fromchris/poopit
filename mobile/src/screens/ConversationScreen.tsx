// Full-screen conversation modal: load history, subscribe to SSE,
// send messages.

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import EventSource from "react-native-sse";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, backendUrl } from "../lib/api";
import { parseGradient } from "../lib/theme";
import { useStore } from "../lib/store";
import { Gradient } from "../components/Gradient";
import { XIcon } from "../components/Icons";

type Message = {
  id: string;
  body: string;
  fromMe: boolean;
  sender: { handle: string; avatar: string; avatarBg: string };
  timeAgo: string;
  createdAt: string;
};

export function ConversationScreen({
  conversationId,
  peerHandle,
  onClose,
}: {
  conversationId: string;
  peerHandle: string | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const toast = useStore((s) => s.toast);
  const [items, setItems] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    setItems([]);
    setLoading(true);
    api<{ items: Message[] }>(
      `/api/conversations/${conversationId}/messages?limit=80`,
    )
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    const base = backendUrl();
    if (!base) return;
    const es = new EventSource(
      `${base}/api/conversations/${conversationId}/stream`,
      { withCredentials: true },
    );
    es.addEventListener("message", (evt) => {
      try {
        const m = JSON.parse(
          (evt as { data?: string }).data ?? "null",
        ) as Message | null;
        if (!m) return;
        setItems((arr) =>
          arr.some((x) => x.id === m.id) ? arr : [...arr, m],
        );
      } catch {}
    });
    return () => {
      try {
        es.close();
      } catch {}
    };
  }, [conversationId]);

  useEffect(() => {
    // Scroll to the latest message whenever a new one arrives.
    if (items.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [items.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const r = await api<{ message: Message }>(
        `/api/conversations/${conversationId}/messages`,
        { body: { body } },
      );
      setItems((arr) => [...arr, r.message]);
      setText("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <XIcon size={18} />
        </Pressable>
        <Text style={styles.peer}>{peerHandle}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color="#ec4899" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Say hi to {peerHandle} 👋</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
          renderItem={({ item: m }) => <Bubble m={m} />}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      <View
        style={[
          styles.inputRow,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message"
          placeholderTextColor="#ffffff55"
          style={styles.input}
          editable={!sending}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable
          onPress={send}
          disabled={!text.trim() || sending}
          style={[
            styles.sendBtn,
            (!text.trim() || sending) && { opacity: 0.4 },
          ]}
        >
          <Text style={styles.sendText}>
            {sending ? "…" : "Send"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ m }: { m: Message }) {
  const stops = parseGradient(m.sender.avatarBg);
  return (
    <View
      style={[
        styles.msgRow,
        { justifyContent: m.fromMe ? "flex-end" : "flex-start" },
      ]}
    >
      {!m.fromMe && (
        <View style={styles.msgAvatar}>
          <Gradient colors={stops} borderRadius={14} />
          <Text style={styles.msgAvatarEmoji}>{m.sender.avatar}</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          m.fromMe ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            m.fromMe && { color: "#fff" },
          ]}
        >
          {m.body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ffffff14",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff14",
    alignItems: "center",
    justifyContent: "center",
  },
  peer: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#ffffff80",
    fontSize: 13,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 6,
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  msgAvatarEmoji: {
    fontSize: 14,
  },
  bubble: {
    maxWidth: "72%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: "#ec4899",
  },
  bubbleTheirs: {
    backgroundColor: "#ffffff14",
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 18,
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ffffff14",
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff0c",
    color: "#fff",
    fontSize: 14,
  },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ec4899",
  },
  sendText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
});
