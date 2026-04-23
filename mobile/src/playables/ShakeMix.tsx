// Shake / tap to mix ingredients. Uses expo-sensors would be ideal
// for real shake — here we fall back to a "shake" button so the port
// stays dep-light. Each press swaps layers.

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gradient } from "../components/Gradient";

const RECIPES = [
  { name: "Sunset Spritz", stops: ["#f97316", "#ec4899", "#a855f7"] },
  { name: "Lime Breeze", stops: ["#34d399", "#14b8a6", "#0ea5e9"] },
  { name: "Cherry Soda", stops: ["#f43f5e", "#ec4899", "#fbbf24"] },
  { name: "Midnight Coco", stops: ["#0f172a", "#4c1d95", "#ec4899"] },
];

export function ShakeMix() {
  const [i, setI] = useState(0);
  const r = RECIPES[i]!;
  return (
    <View style={styles.root}>
      <View style={styles.glass}>
        <Gradient colors={r.stops} borderRadius={14} />
        <View style={styles.bubbles}>
          {Array.from({ length: 6 }).map((_, k) => (
            <View
              key={k}
              style={[
                styles.bubble,
                {
                  left: 10 + k * 22,
                  bottom: 10 + (k % 3) * 20,
                },
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={styles.name}>{r.name}</Text>
      <Pressable
        style={styles.shakeBtn}
        onPress={() => setI((x) => (x + 1) % RECIPES.length)}
      >
        <Text style={styles.shakeTxt}>🥤 shake</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glass: {
    width: 140,
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ffffff60",
    position: "relative",
  },
  bubbles: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0 },
  bubble: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff80",
  },
  name: {
    marginTop: 16,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  shakeBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff18",
    borderWidth: 1,
    borderColor: "#ffffff40",
  },
  shakeTxt: { color: "#fff", fontWeight: "700" },
});
