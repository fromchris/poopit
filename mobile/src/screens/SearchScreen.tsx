// Native port of app/components/SearchScreen.tsx. Simple search over
// /api/search with trending chips seeded from the feed.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gradient } from "../components/Gradient";
import { SearchIcon } from "../components/Icons";
import { api } from "../lib/api";
import { formatCount } from "../lib/format";
import { parseGradient } from "../lib/theme";
import { useStore } from "../lib/store";
import type { Playable } from "../lib/types";

const TRENDING = [
  "lofi",
  "rhythm",
  "cat",
  "remix",
  "drama",
  "rain",
  "emoji",
];

export function SearchScreen({
  onOpenPlayable,
}: {
  onOpenPlayable: (p: Playable) => void;
}) {
  const insets = useSafeAreaInsets();
  const feed = useStore((s) => s.feed);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Playable[] | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (query: string) => {
    const clean = query.trim();
    if (!clean) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ items: Playable[] }>(
        `/api/search?q=${encodeURIComponent(clean)}`,
      );
      setResults(r.items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(q), 260);
    return () => clearTimeout(t);
  }, [q, runSearch]);

  const trendingChips = useMemo(() => {
    // Seed trending with what's in the feed + our static list.
    const fromFeed = Array.from(
      new Set(feed.flatMap((p) => p.tags).slice(0, 10)),
    );
    return Array.from(new Set([...fromFeed, ...TRENDING])).slice(0, 10);
  }, [feed]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.searchBar}>
        <SearchIcon size={16} color="#ffffffb0" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search playables, creators, tags"
          placeholderTextColor="#ffffff70"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => runSearch(q)}
        />
      </View>

      {results === null ? (
        <View style={styles.trendingWrap}>
          <Text style={styles.trendingHeader}>Trending</Text>
          <View style={styles.chips}>
            {trendingChips.map((t) => (
              <Pressable
                key={t}
                style={styles.chip}
                onPress={() => setQ(t)}
              >
                <Text style={styles.chipText}>#{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#ec4899" />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.loading}>
          <Text style={styles.emptyText}>No matches.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 120, gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => onOpenPlayable(item)}
            >
              <Gradient
                colors={parseGradient(item.theme)}
                borderRadius={14}
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardEmoji}>{item.author.avatar}</Text>
                <View>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardStats}>
                    {formatCount(item.stats.plays)} plays
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  searchBar: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff14",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 0,
  },
  trendingWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  trendingHeader: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#ffffff80",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ffffff12",
  },
  chipText: {
    color: "#fff",
    fontSize: 13,
  },
  loading: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#ffffff80",
    fontSize: 13,
  },
  card: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  cardBody: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },
  cardEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  cardStats: {
    color: "#ffffffb0",
    fontSize: 10,
    marginTop: 1,
  },
});
