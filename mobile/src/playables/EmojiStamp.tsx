// Stamp emojis anywhere on the canvas. Pick from a small palette.

import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const PALETTE = ["💖", "⭐", "🌸", "🔥", "✨", "🫧", "🌈", "⚡"];
type Stamp = { id: number; x: number; y: number; e: string };

export function EmojiStamp() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [active, setActive] = useState(PALETTE[0]!);
  const nextIdRef = useRef(1);

  return (
    <View style={styles.root}>
      <Pressable
        style={styles.canvas}
        onPress={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          setStamps((l) => [
            ...l,
            { id: nextIdRef.current++, x: locationX, y: locationY, e: active },
          ]);
        }}
      >
        {stamps.map((s) => (
          <Text key={s.id} style={[styles.stamp, { left: s.x - 20, top: s.y - 20 }]}>
            {s.e}
          </Text>
        ))}
      </Pressable>
      <View style={styles.palette}>
        {PALETTE.map((e) => (
          <Pressable
            key={e}
            onPress={() => setActive(e)}
            style={[
              styles.pick,
              active === e && styles.pickActive,
            ]}
          >
            <Text style={styles.pickEmoji}>{e}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setStamps([])}
          style={[styles.pick, { backgroundColor: "#ffffff18" }]}
        >
          <Text style={styles.pickEmoji}>🗑</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: { flex: 1, position: "relative" },
  stamp: { position: "absolute", fontSize: 40 },
  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 10,
    backgroundColor: "#00000050",
  },
  pick: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff10",
  },
  pickActive: {
    backgroundColor: "#ffffff30",
    borderWidth: 1,
    borderColor: "#ffffff70",
  },
  pickEmoji: { fontSize: 18 },
});
