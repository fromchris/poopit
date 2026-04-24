import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  PanResponder,
  Pressable,
  RefreshControl,
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
import { useT } from "../lib/i18n";
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
  const jumpId = useStore((s) => s.feedJumpToId);
  const clearJumpTo = useStore((s) => s.clearJumpTo);
  const [refreshing, setRefreshing] = useState(false);

  const insets = useSafeAreaInsets();
  const { height: winH } = Dimensions.get("window");
  const [activeIdx, setActiveIdx] = useState(0);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const listRef = useRef<FlatList<Playable>>(null);
  const current = feed[activeIdx] ?? null;
  const t = useT();

  // FlatList never handles touches on the playable card itself —
  // it's permanently scrollEnabled=false. A dedicated bottom strip
  // absorbs vertical flicks to page between cards.

  // PanResponder lives on the absolute-positioned nav strip below.
  // onStartShouldSetPanResponder is false so buttons (like/comment/share)
  // underneath still receive taps. onMoveShould... claims only on a
  // clear vertical flick, then scrolls one card.
  const navResponder = useMemo(
    () =>
      PanResponder.create({
        // The strip no longer overlaps any Pressables, so claim eagerly
        // — taps inside this zone still fire (onPanResponderRelease
        // sees zero dy and does nothing).
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          if (g.dy < -30 && activeIdx + 1 < feed.length) {
            listRef.current?.scrollToIndex({
              index: activeIdx + 1,
              animated: true,
            });
          } else if (g.dy > 30 && activeIdx - 1 >= 0) {
            listRef.current?.scrollToIndex({
              index: activeIdx - 1,
              animated: true,
            });
          }
        },
      }),
    [activeIdx, feed.length],
  );

  // Pre-fetch next page when user is close to the end, since
  // onEndReached won't fire (scrollEnabled=false).
  useEffect(() => {
    if (nextCursor && !loading && activeIdx >= feed.length - 3) {
      loadFeed(false).catch(() => {});
    }
  }, [activeIdx, feed.length, nextCursor, loading, loadFeed]);

  // Consume jumpTo: scroll the feed to the requested playable.
  useEffect(() => {
    if (!jumpId) return;
    const idx = feed.findIndex((p) => p.id === jumpId);
    if (idx >= 0) {
      listRef.current?.scrollToIndex({ index: idx, animated: false });
      setActiveIdx(idx);
      clearJumpTo();
    }
  }, [jumpId, feed, clearJumpTo]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFeed(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed]);

  const isErrorState = !!error && feed.length === 0;
  const isLoadingState = feed.length === 0 && loading;
  const isEmptyState = feed.length === 0 && !loading && !error;

  return (
    <View style={styles.root}>
      {/* Body: feed OR error/loading/empty — always rendered inside
          the same root so the TopBar + nav strip stay reachable. */}
      {isErrorState ? (
        <View style={styles.full}>
          <Text style={styles.errTitle}>{t("feed.error.title")}</Text>
          <Text style={styles.errBody}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadFeed(true)}>
            <Text style={styles.retryText}>{t("feed.retry")}</Text>
          </Pressable>
        </View>
      ) : isLoadingState ? (
        <View style={styles.full}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      ) : isEmptyState ? (
        <View style={styles.full}>
          <Text style={styles.emptyText}>
            {feedTab === "following"
              ? t("feed.emptyFollowing")
              : t("feed.emptyForYou")}
          </Text>
        </View>
      ) : (
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
          scrollEnabled={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          initialNumToRender={1}
          windowSize={3}
          maxToRenderPerBatch={2}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={["#ec4899"]}
            />
          }
          getItemLayout={(_, index) => ({
            length: winH,
            offset: winH * index,
            index,
          })}
        />
      )}

      {/* Nav overlay — always claims on a vertical flick. No-op when
          the feed is empty (scrollToIndex on 0 items is safe). */}
      {!isErrorState && !isLoadingState && !isEmptyState && (
        <>
          <View
            style={styles.navStrip}
            {...navResponder.panHandlers}
          />
          <View pointerEvents="none" style={styles.navHint}>
            <View style={styles.navHintPill} />
          </View>
        </>
      )}

      {/* Top bar always visible so the user can always switch tabs. */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TopTab
          label={t("top.following")}
          active={feedTab === "following"}
          onPress={() => setFeedTab("following")}
        />
        <TopTab
          label={t("top.forYou")}
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
  navStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    // The empty gap between the caption row and BottomTabs (pb-88 in
    // FeedItem, minus 8px for the handle). 80px tall — tall enough to
    // flick, doesn't overlap any buttons so tap vs pan doesn't race.
    bottom: 80,
    height: 80,
    backgroundColor: "transparent",
  },
  navHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 150,
    alignItems: "center",
  },
  navHintPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffffff50",
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
  emptyText: {
    color: "#ffffff90",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
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
