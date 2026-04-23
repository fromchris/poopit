// Followers / Following list sheet, opened by tapping the stat on
// the profile header.

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomSheet } from "../components/BottomSheet";
import { Gradient } from "../components/Gradient";
import { api } from "../lib/api";
import { parseGradient } from "../lib/theme";
import { useStore } from "../lib/store";

type Entry = {
  handle: string;
  avatar: string;
  avatarBg: string;
  bio: string;
  isFollowing: boolean;
};

export function FollowListSheet({
  open,
  onClose,
  handle,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  handle: string | null;
  mode: "followers" | "following";
}) {
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const toggleFollowStore = useStore((s) => s.toggleFollow);

  useEffect(() => {
    if (!open || !handle) return;
    setLoading(true);
    api<{ items: Entry[] }>(
      `/api/users/${encodeURIComponent(handle)}/followers?mode=${mode}`,
    )
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open, handle, mode]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={mode === "followers" ? "Followers" : "Following"}
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#ec4899" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(e) => e.handle}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
          renderItem={({ item: e }) => (
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Gradient colors={parseGradient(e.avatarBg)} borderRadius={20} />
                <Text style={styles.avatarEmoji}>{e.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.handle}>{e.handle}</Text>
                {e.bio ? (
                  <Text numberOfLines={1} style={styles.bio}>
                    {e.bio}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => {
                  setItems((list) =>
                    list.map((x) =>
                      x.handle === e.handle
                        ? { ...x, isFollowing: !x.isFollowing }
                        : x,
                    ),
                  );
                  toggleFollowStore(e.handle);
                }}
                style={[
                  styles.btn,
                  e.isFollowing && styles.btnFollowing,
                ]}
              >
                <Text
                  style={[
                    styles.btnText,
                    e.isFollowing && { color: "#fff" },
                  ]}
                >
                  {e.isFollowing ? "Following" : "Follow"}
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#ffffff80",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
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
  handle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  bio: {
    color: "#ffffff80",
    fontSize: 11,
    marginTop: 2,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  btnFollowing: {
    backgroundColor: "#ffffff22",
  },
  btnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },
});
