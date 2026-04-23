// Native port of app/components/ProfileScreen.tsx — profile header +
// three tabs (Created / Liked / Remixed) rendered as a grid. Fetches
// the signed-in user's profile on mount.

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gradient } from "../components/Gradient";
import { api, ApiError } from "../lib/api";
import { formatCount } from "../lib/format";
import { parseGradient } from "../lib/theme";
import { useStore } from "../lib/store";
import type { Playable } from "../lib/types";

type Tab = "created" | "liked" | "remixed";

type UserProfile = {
  handle: string;
  avatar: string;
  avatarBg: string;
  bio: string;
  isFollowing: boolean;
  stats: {
    playables: number;
    followers: number;
    following: number;
    likes: number;
  };
  created: Playable[];
};

export function ProfileScreen({
  onOpenAuth,
  onOpenPlayable,
  onSignOut,
}: {
  onOpenAuth: () => void;
  onOpenPlayable: (p: Playable) => void;
  onSignOut: () => void;
}) {
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.me);
  const signOut = useStore((s) => s.signOut);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("created");
  const [liked, setLiked] = useState<Playable[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const r = await api<{ user: UserProfile }>(
        `/api/users/${encodeURIComponent(me.handle)}`,
      );
      setProfile(r.user);
    } catch (err) {
      if (err instanceof ApiError) console.warn(err.message);
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!me || tab !== "liked") return;
    api<{ items: Playable[] }>("/api/me/liked")
      .then((r) => setLiked(r.items))
      .catch(() => {});
  }, [me, tab]);

  if (!me) {
    return (
      <View style={[styles.full, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.emptyTitle}>Me</Text>
        <Text style={styles.emptyText}>
          Sign in to see your profile
        </Text>
        <Pressable onPress={onOpenAuth} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Sign in or create account</Text>
        </Pressable>
      </View>
    );
  }

  const data =
    tab === "created"
      ? (profile?.created ?? [])
      : tab === "liked"
        ? liked
        : []; // remixed — backend shape varies; keep empty for now

  const avatarStops = parseGradient(profile?.avatarBg);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 4, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 120, gap: 4 }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Gradient colors={avatarStops} borderRadius={36} />
                <Text style={styles.avatarEmoji}>
                  {profile?.avatar ?? me.avatar}
                </Text>
              </View>
              <Text style={styles.handle}>
                {profile?.handle ?? me.handle}
              </Text>
              {profile?.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : null}

              {/* Stats */}
              <View style={styles.statsRow}>
                <Stat n={profile?.stats.playables ?? 0} label="playables" />
                <Stat n={profile?.stats.followers ?? 0} label="followers" />
                <Stat n={profile?.stats.following ?? 0} label="following" />
                <Stat n={profile?.stats.likes ?? 0} label="likes" />
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <Pressable onPress={signOut} style={styles.ghostBtn}>
                  <Text style={styles.ghostText}>Sign out</Text>
                </Pressable>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TabBtn
                label="Created"
                active={tab === "created"}
                onPress={() => setTab("created")}
              />
              <TabBtn
                label="Liked"
                active={tab === "liked"}
                onPress={() => setTab("liked")}
              />
              <TabBtn
                label="Remixed"
                active={tab === "remixed"}
                onPress={() => setTab("remixed")}
              />
            </View>

            {loading && (
              <ActivityIndicator
                color="#ec4899"
                style={{ paddingVertical: 20 }}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {tab === "created"
                  ? "Make your first playable from the Create tab."
                  : tab === "liked"
                    ? "Tap ❤️ on a playable to save it here."
                    : "Your remixes will appear here."}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.thumb}
            onPress={() => onOpenPlayable(item)}
          >
            <Gradient colors={parseGradient(item.theme)} borderRadius={10} />
            <View style={styles.thumbBody}>
              <Text style={styles.thumbEmoji}>{item.author.avatar}</Text>
              <Text style={styles.thumbPlays}>
                ▶ {formatCount(item.stats.plays)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{formatCount(n)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text
        style={[
          styles.tabText,
          { color: active ? "#fff" : "#ffffff80" },
        ]}
      >
        {label}
      </Text>
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
    padding: 24,
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
    textAlign: "center",
  },
  primaryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  primaryText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "800",
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 34,
  },
  handle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  bio: {
    marginTop: 4,
    fontSize: 13,
    color: "#ffffffc0",
    textAlign: "center",
  },
  statsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 24,
  },
  stat: {
    alignItems: "center",
  },
  statNum: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 2,
    color: "#ffffff80",
    fontSize: 11,
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  ghostBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffffff22",
  },
  ghostText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ffffff14",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#fff",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  empty: {
    paddingHorizontal: 32,
    paddingVertical: 40,
    alignItems: "center",
  },
  thumb: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  thumbBody: {
    position: "absolute",
    left: 6,
    right: 6,
    bottom: 6,
  },
  thumbEmoji: {
    fontSize: 18,
  },
  thumbPlays: {
    fontSize: 10,
    color: "#ffffffc0",
    fontWeight: "600",
    marginTop: 2,
  },
});
