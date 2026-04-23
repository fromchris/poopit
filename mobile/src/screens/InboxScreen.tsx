// Inbox with outer tabs (Notifications / Messages) + notification
// subtabs (all / likes / comments / follows). Native port of
// app/components/InboxScreen.tsx.

import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gradient } from "../components/Gradient";
import { MessagesList } from "../components/MessagesList";
import { parseGradient } from "../lib/theme";
import { useStore, type Notification } from "../lib/store";
import { useT } from "../lib/i18n";
import { ConversationScreen } from "./ConversationScreen";

type OuterTab = "notifications" | "messages";
type SubTab = "all" | "like" | "comment" | "follow";

export function InboxScreen() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const me = useStore((s) => s.me);
  const notifications = useStore((s) => s.notifications);
  const loadNotifications = useStore((s) => s.loadNotifications);
  const markAllRead = useStore((s) => s.markAllRead);

  const SUBTABS: { id: SubTab; label: string }[] = [
    { id: "all", label: t("inbox.tab.all") },
    { id: "like", label: t("inbox.tab.likes") },
    { id: "comment", label: t("inbox.tab.comments") },
    { id: "follow", label: t("inbox.tab.follows") },
  ];

  const [outer, setOuter] = useState<OuterTab>("notifications");
  const [inner, setInner] = useState<SubTab>("all");
  const [conv, setConv] = useState<{ id: string; peer: string } | null>(null);

  useEffect(() => {
    if (!me) return;
    loadNotifications();
    const t = setTimeout(() => markAllRead(), 1500);
    return () => clearTimeout(t);
  }, [me, loadNotifications, markAllRead]);

  if (!me) {
    return (
      <View style={[styles.full, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.emptyTitle}>{t("inbox.title")}</Text>
        <Text style={styles.emptyText}>{t("inbox.signIn")}</Text>
      </View>
    );
  }

  const filtered = notifications.filter((n) =>
    inner === "all" ? true : n.type === inner,
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.header}>{t("inbox.title")}</Text>
      <View style={styles.outerTabs}>
        <OuterBtn
          active={outer === "notifications"}
          label={t("inbox.notifications")}
          onPress={() => setOuter("notifications")}
        />
        <OuterBtn
          active={outer === "messages"}
          label={t("inbox.messages")}
          onPress={() => setOuter("messages")}
        />
      </View>

      {outer === "notifications" ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subtabs}
          >
            {SUBTABS.map((s) => (
              <Pressable
                key={s.id}
                style={[
                  styles.chip,
                  inner === s.id && styles.chipActive,
                ]}
                onPress={() => setInner(s.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    inner === s.id && styles.chipTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {filtered.length === 0 ? (
            <View style={styles.full}>
              <Text style={styles.emptyText}>{t("inbox.empty")}</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(n) => n.id}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => <Row n={item} t={t} />}
            />
          )}
        </>
      ) : (
        <MessagesList
          onOpen={(id, handle) => setConv({ id, peer: handle })}
        />
      )}

      <Modal
        visible={conv !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setConv(null)}
      >
        {conv && (
          <ConversationScreen
            conversationId={conv.id}
            peerHandle={conv.peer}
            onClose={() => setConv(null)}
          />
        )}
      </Modal>
    </View>
  );
}

function OuterBtn({
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
      style={[styles.outerBtn, active && styles.outerBtnActive]}
    >
      <Text
        style={[
          styles.outerText,
          active && { color: "#000" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Row({
  n,
  t,
}: {
  n: Notification;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const stops = parseGradient(n.avatarBg);
  const labelKey = `inbox.action.${n.type}`;
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
            {t(labelKey)}
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
    paddingTop: 4,
    paddingBottom: 10,
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  outerTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  outerBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff14",
  },
  outerBtnActive: {
    backgroundColor: "#fff",
  },
  outerText: {
    color: "#ffffffd0",
    fontSize: 13,
    fontWeight: "700",
  },
  subtabs: {
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ffffff14",
  },
  chipActive: {
    backgroundColor: "#fff",
  },
  chipText: {
    color: "#ffffffc0",
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#000",
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
