// Tap on the beat. Note spawns at 600ms intervals; score a hit if
// tapped during its brief active window.

import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const BEAT_MS = 600;
const HIT_WINDOW = 240;

export function RhythmTap({ active }: { active: boolean }) {
  const [beat, setBeat] = useState(0);
  const [score, setScore] = useState(0);
  const [miss, setMiss] = useState(0);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const hitRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    hitRef.current = false;
    const iv = setInterval(() => {
      if (!hitRef.current) setMiss((m) => m + 1);
      hitRef.current = false;
      setBeat((b) => b + 1);
    }, BEAT_MS);
    return () => clearInterval(iv);
  }, [active]);

  const tap = () => {
    if (!hitRef.current) {
      hitRef.current = true;
      setScore((s) => s + 1);
      setFlash("hit");
    } else {
      setFlash("miss");
    }
    setTimeout(() => setFlash(null), 200);
  };

  return (
    <Pressable style={styles.root} onPress={tap}>
      <View
        style={[
          styles.puck,
          {
            backgroundColor:
              flash === "hit"
                ? "#34d399"
                : flash === "miss"
                  ? "#f43f5e"
                  : "#fbbf24",
            transform: [{ scale: flash === "hit" ? 1.2 : 1 }],
          },
        ]}
      />
      <View style={styles.score}>
        <Text style={styles.scoreTxt}>
          ✓ {score}  ✗ {miss}
        </Text>
      </View>
      <Text style={styles.beat}>{beat}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  puck: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  score: {
    position: "absolute",
    top: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#00000080",
  },
  scoreTxt: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  beat: {
    position: "absolute",
    bottom: 30,
    color: "#ffffff70",
    fontSize: 11,
    letterSpacing: 1.5,
  },
});
