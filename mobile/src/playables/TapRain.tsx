// Tap-spawned drops that rain down. Pure native, no gestures library.

import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Drop = { id: number; x: number; y: number; emoji: string; born: number };
const EMOJIS = ["💧", "💦", "❄️", "⭐", "💫"];
const LIFE_MS = 2200;

export function TapRain({ active }: { active: boolean }) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const nextIdRef = useRef(1);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      setDrops((list) => list.filter((d) => now - d.born < LIFE_MS));
    }, 300);
    return () => clearInterval(iv);
  }, []);

  return (
    <Pressable
      onPress={(e) => {
        if (!active) return;
        const { locationX, locationY } = e.nativeEvent;
        const batch: Drop[] = [];
        for (let i = 0; i < 4; i++) {
          batch.push({
            id: nextIdRef.current++,
            x: locationX + (Math.random() - 0.5) * 40,
            y: locationY + (Math.random() - 0.5) * 30,
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]!,
            born: Date.now(),
          });
        }
        setDrops((list) => [...list, ...batch]);
      }}
      style={styles.root}
    >
      {drops.map((d) => (
        <DropNode key={d.id} drop={d} />
      ))}
      <View pointerEvents="none" style={styles.hint}>
        <Text style={styles.hintText}>Tap anywhere</Text>
      </View>
    </Pressable>
  );
}

function DropNode({ drop }: { drop: Drop }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const t = (Date.now() - start) / LIFE_MS;
      setP(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <Text
      style={[
        styles.drop,
        {
          left: drop.x - 16,
          top: drop.y + p * 80,
          opacity: Math.max(0, 1 - p * 1.3),
          transform: [{ scale: 1 - p * 0.4 }],
        },
      ]}
    >
      {drop.emoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: "relative", overflow: "hidden" },
  drop: {
    position: "absolute",
    fontSize: 32,
    textShadowColor: "#00000080",
    textShadowRadius: 6,
  },
  hint: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    fontSize: 12,
    color: "#ffffff90",
    backgroundColor: "#00000060",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
