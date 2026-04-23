// Native port of app/components/FeedItem.tsx. Layout mirrors the web's
// final Loopit-style stacked design:
//   rounded playable card on top, action row + caption row below it on
//   the page's black bg.

import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parseGradient } from "../lib/theme";
import { formatCount } from "../lib/format";
import { useStore } from "../lib/store";
import type { Playable } from "../lib/types";
import { PlayableRenderer } from "../playables";
import { Gradient } from "./Gradient";
import {
  CommentIcon,
  DotsIcon,
  HeartIcon,
  PlusIcon,
  RemixIcon,
  ShareIcon,
} from "./Icons";

type Props = {
  item: Playable;
  active: boolean;
  height: number;
  onComment: () => void;
  onShare: () => void;
  onRemix: () => void;
  onMore: () => void;
};

export function FeedItem({
  item,
  active,
  height,
  onComment,
  onShare,
  onRemix,
  onMore,
}: Props) {
  const insets = useSafeAreaInsets();
  const toggleLike = useStore((s) => s.toggleLike);
  const toggleFollow = useStore((s) => s.toggleFollow);

  const themeStops = useMemo(() => parseGradient(item.theme), [item.theme]);
  const avatarStops = useMemo(
    () => parseGradient(item.author.avatarBg),
    [item.author.avatarBg],
  );

  const liked = !!item.liked;
  const followed = !!item.author.isFollowing;
  const isRemix =
    item.tags.includes("remix") || /^Remix:/i.test(item.title);
  const caption = item.description || item.title;

  return (
    <View
      style={[
        styles.section,
        {
          height,
          paddingTop: insets.top + 56,
          paddingBottom: 88,
        },
      ]}
    >
      {/* rounded playable card */}
      <View style={styles.card}>
        <Gradient colors={themeStops} borderRadius={20} />
        <View style={styles.cardInner}>
          <PlayableRenderer
            kind={item.kind}
            active={active}
            src={item.src}
          />
        </View>
      </View>

      {/* action row */}
      <View style={styles.actionRow}>
        <View style={styles.actionGroup}>
          <ActionBtn
            label={formatCount(item.stats.likes)}
            active={liked}
            onPress={() => toggleLike(item.id)}
          >
            <HeartIcon
              size={24}
              filled={liked}
              color={liked ? "#f43f5e" : "#fff"}
            />
          </ActionBtn>
          <ActionBtn label={formatCount(item.stats.comments)} onPress={onComment}>
            <CommentIcon size={24} />
          </ActionBtn>
          <ActionBtn
            label={formatCount(item.stats.remixes)}
            accent
            onPress={onRemix}
          >
            <RemixIcon size={24} />
          </ActionBtn>
        </View>
        <View style={styles.actionGroupRight}>
          <Pressable style={styles.iconBtn} onPress={onShare}>
            <ShareIcon size={24} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onMore}>
            <DotsIcon size={20} />
          </Pressable>
        </View>
      </View>

      {/* caption row */}
      <View style={styles.captionRow}>
        <Pressable
          onPress={() => toggleFollow(item.author.handle)}
          style={styles.avatarWrap}
        >
          <View style={styles.avatar}>
            <Gradient colors={avatarStops} borderRadius={18} />
            <Text style={styles.avatarEmoji}>{item.author.avatar}</Text>
          </View>
          {!followed && (
            <View style={styles.followBadge}>
              <PlusIcon size={10} />
            </View>
          )}
        </Pressable>
        <View style={styles.captionText}>
          <Text numberOfLines={1} style={styles.captionLine}>
            <Text style={styles.captionHandle}>{item.author.handle}: </Text>
            <Text style={styles.captionBody}>{caption}</Text>
          </Text>
          {item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 4).map((t) => (
                <Text key={t} style={styles.tag}>
                  #{t}
                </Text>
              ))}
            </View>
          )}
        </View>
        {isRemix && (
          <View style={styles.remixPill}>
            <RemixIcon size={12} />
            <Text style={styles.remixPillText}>
              Remix · {formatCount(item.stats.remixes)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ActionBtn({
  children,
  label,
  onPress,
  active,
  accent,
}: {
  children: React.ReactNode;
  label?: string;
  onPress: () => void;
  active?: boolean;
  accent?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      {children}
      {label !== undefined && (
        <Text
          style={[
            styles.actionLabel,
            active && { color: "#fb7185" },
            !active && accent && { color: "#fbcfe8" },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    backgroundColor: "#000",
    paddingHorizontal: 12,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  cardInner: {
    flex: 1,
    position: "relative",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 8,
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionGroupRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffffcc",
    fontVariant: ["tabular-nums"],
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  captionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
    marginTop: 8,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffffcc",
  },
  avatarEmoji: {
    fontSize: 18,
    zIndex: 1,
  },
  followBadge: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  captionText: {
    flex: 1,
    minWidth: 0,
  },
  captionLine: {
    fontSize: 13,
    lineHeight: 16,
  },
  captionHandle: {
    color: "#fff",
    fontWeight: "700",
  },
  captionBody: {
    color: "#ffffffd8",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
    marginTop: 2,
  },
  tag: {
    fontSize: 11,
    color: "#ffffff90",
  },
  remixPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ffffff1a",
  },
  remixPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffffe6",
  },
});
