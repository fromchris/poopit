// Classic memory grid: 8 pairs (4×4). Tap two cards; if they match,
// stay flipped. Wins when all 16 flipped.

import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const EMOJIS = ["🐱", "🫧", "🌸", "🎈", "⭐", "🌙", "🔥", "🍓"];

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function MatchPair() {
  const [cards, setCards] = useState<Card[]>(() => makeDeck());
  const [open, setOpen] = useState<number[]>([]);
  const matched = cards.filter((c) => c.matched).length;

  const tap = (i: number) => {
    if (open.length >= 2) return;
    if (cards[i]!.flipped) return;
    const nextCards = cards.map((c, j) =>
      j === i ? { ...c, flipped: true } : c,
    );
    const nextOpen = [...open, i];
    setCards(nextCards);
    setOpen(nextOpen);
    if (nextOpen.length === 2) {
      const [a, b] = nextOpen;
      setTimeout(() => {
        if (nextCards[a!]!.emoji === nextCards[b!]!.emoji) {
          setCards((cs) =>
            cs.map((c, k) =>
              k === a || k === b ? { ...c, matched: true } : c,
            ),
          );
        } else {
          setCards((cs) =>
            cs.map((c, k) =>
              k === a || k === b ? { ...c, flipped: false } : c,
            ),
          );
        }
        setOpen([]);
      }, 600);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.score}>
        {matched / 2} / {EMOJIS.length}
      </Text>
      <View style={styles.grid}>
        {cards.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => tap(i)}
            style={[
              styles.card,
              c.flipped || c.matched ? styles.cardUp : styles.cardDown,
            ]}
          >
            <Text style={styles.cardEmoji}>
              {c.flipped || c.matched ? c.emoji : ""}
            </Text>
          </Pressable>
        ))}
      </View>
      {matched === EMOJIS.length * 2 && (
        <Pressable onPress={() => setCards(makeDeck())} style={styles.resetBtn}>
          <Text style={styles.resetText}>Play again</Text>
        </Pressable>
      )}
    </View>
  );
}

function makeDeck(): Card[] {
  return shuffle(
    EMOJIS.concat(EMOJIS).map((e, i) => ({
      id: i,
      emoji: e,
      flipped: false,
      matched: false,
    })),
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  score: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    maxWidth: 280,
  },
  card: {
    width: 62,
    height: 62,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDown: { backgroundColor: "#ffffff18" },
  cardUp: { backgroundColor: "#ffffff30" },
  cardEmoji: { fontSize: 28 },
  resetBtn: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  resetText: { color: "#000", fontWeight: "800", fontSize: 13 },
});
