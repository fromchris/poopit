import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedItem } from "../components/FeedItem";
import { CommentSheet } from "../sheets/CommentSheet";
import { OverflowSheet } from "../sheets/OverflowSheet";
import { RemixSheet } from "../sheets/RemixSheet";
import { ReportSheet } from "../sheets/ReportSheet";
import { ShareSheet } from "../sheets/ShareSheet";
import { useStore } from "../lib/store";
import type { Playable } from "../lib/types";

type OpenSheet = null | "comments" | "share" | "remix" | "more" | "report";

export function FeedScreen() {
  const feed = useStore((s) => s.feed);
  const feedTab = useStore((s) => s.feedTab);
  const loading = useStore((s) => s.feedLoading);
  const error = useStore((s) => s.feedError);
  const nextCursor = useStore((s) => s.feedNextCursor);
  const loadFeed = useStore((s) => s.loadFeed);
  const setFeedTab = useStore((s) => s.setFeedTab);

  const insets = useSafeAreaInsets();
  const { height: winH } = Dimensions.get("window");
  const [activeIdx, setActiveIdx] = useState(0);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const listRef = useRef<FlatList<Playable>>(null);
  const current = feed[activeIdx] ?? null;

  useEffect(() => {
    if (feed.length === 0 && !loading) {
      loadFeed(true).catch(() => {});
    }
  }, [feed.length, loading, loadFeed]);

  const onViewable = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const i = viewableItems[0]!.index;
        if (typeof i === "number") setActiveIdx(i);
      }
    },
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Playable; index: number }) => (
      <FeedItem
        item={item}
        active={index === activeIdx}
        height={winH}
        onComment={() => setSheet("comments")}
        onShare={() => setSheet("share")}
        onRemix={() => setSheet("remix")}
        onMore={() => setSheet("more")}
      />
    ),
    [activeIdx, winH],
  );

  const keyExtractor = useCallback((it: Playable) => it.id, []);

  const onEndReached = useCallback(() => {
    if (nextCursor && !loading) loadFeed(false).catch(() => {});
  }, [nextCursor, loading, loadFeed]);

  if (error && feed.length === 0) {
    return (
      <View style={styles.full}>
        <Text style={styles.errTitle}>Couldn't load feed</Text>
        <Text style={styles.errBody}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => loadFeed(true)}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (feed.length === 0 && loading) {
    return (
      <View style={styles.full}>
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={feed}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        snapToInterval={winH}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        getItemLayout={(_, index) => ({
          length: winH,
          offset: winH * index,
          index,
        })}
      />
      {/* Top bar overlay */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TopTab
          label="Following"
          active={feedTab === "following"}
          onPress={() => setFeedTab("following")}
        />
        <TopTab
          label="For You"
          active={feedTab === "for-you"}
          onPress={() => setFeedTab("for-you")}
        />
      </View>

      {/* Sheets */}
      <CommentSheet
        item={current}
        open={sheet === "comments"}
        onClose={() => setSheet(null)}
      />
      <ShareSheet
        item={current}
        open={sheet === "share"}
        onClose={() => setSheet(null)}
      />
      <RemixSheet
        item={current}
        open={sheet === "remix"}
        onClose={() => setSheet(null)}
      />
      <OverflowSheet
        item={current}
        open={sheet === "more"}
        onClose={() => setSheet(null)}
        onReport={() => setSheet("report")}
      />
      <ReportSheet
        item={current}
        open={sheet === "report"}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

function TopTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.topTab}>
      <Text
        style={[
          styles.topTabLabel,
          { color: active ? "#fff" : "rgba(255,255,255,0.5)" },
        ]}
      >
        {label}
      </Text>
      {active && <View style={styles.topTabUnderline} />}
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
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingBottom: 8,
  },
  topTab: {
    alignItems: "center",
    paddingBottom: 4,
  },
  topTabLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  topTabUnderline: {
    marginTop: 2,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fff",
  },
  errTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  errBody: {
    marginTop: 8,
    fontSize: 13,
    color: "#ffffffa0",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
});
