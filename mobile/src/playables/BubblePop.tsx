// Native port of app/playables/BubblePop.tsx — tap bubbles before they
// drift off the top. Uses Reanimated for bubble drift + pop animations.

import { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

type Bubble = {
  id: number;
  x: number; // 0..1
  size: number;
  emoji: string;
  born: number;
};

const EMOJIS = ["🫧", "💧", "🔵", "🟣", "🟢", "🟡"];
const SPAWN_MS = 700;
const RISE_MS = 6000;

export function BubblePop({ active }: { active: boolean }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const nextIdRef = useRef(1);

  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => {
      setBubbles((list) => {
        const now = Date.now();
        const cleaned = list.filter((b) => now - b.born < RISE_MS);
        return [
          ...cleaned,
          {
            id: nextIdRef.current++,
            x: Math.random(),
            size: 56 + Math.random() * 40,
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]!,
            born: now,
          },
        ];
      });
    }, SPAWN_MS);
    return () => clearInterval(iv);
  }, [active]);

  return (
    <View style={styles.root}>
      {bubbles.map((b) => (
        <BubbleNode
          key={b.id}
          bubble={b}
          onPop={() => {
            setBubbles((list) => list.filter((x) => x.id !== b.id));
            setScore((s) => s + 1);
          }}
        />
      ))}
      <View pointerEvents="none" style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>POPPED</Text>
        <Text style={styles.scoreValue}>{score}</Text>
      </View>
    </View>
  );
}

function BubbleNode({ bubble, onPop }: { bubble: Bubble; onPop: () => void }) {
  const { width: W, height: H } = Dimensions.get("window");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const p = (Date.now() - start) / RISE_MS;
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const top = H * (1 - progress) * 0.85;
  const opacity = Math.max(0, 1 - progress * 1.2);

  return (
    <Pressable
      onPress={onPop}
      hitSlop={10}
      style={[
        styles.bubble,
        {
          left: bubble.x * (W - bubble.size - 24) + 12,
          top,
          width: bubble.size,
          height: bubble.size,
          borderRadius: bubble.size / 2,
          opacity,
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: bubble.size * 0.55 }]}>
        {bubble.emoji}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  bubble: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff24",
    borderWidth: 2,
    borderColor: "#ffffff60",
  },
  emoji: {
    textShadowColor: "#00000080",
    textShadowRadius: 6,
  },
  scoreCard: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#00000080",
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#ffffff90",
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
});
