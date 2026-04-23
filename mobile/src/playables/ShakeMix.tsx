// Shake the phone to swap drinks. Falls back to a tap button if the
// accelerometer isn't available (web / simulator).

import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Accelerometer } from "expo-sensors";
import { Gradient } from "../components/Gradient";

const RECIPES = [
  { name: "Sunset Spritz", stops: ["#f97316", "#ec4899", "#a855f7"] },
  { name: "Lime Breeze", stops: ["#34d399", "#14b8a6", "#0ea5e9"] },
  { name: "Cherry Soda", stops: ["#f43f5e", "#ec4899", "#fbbf24"] },
  { name: "Midnight Coco", stops: ["#0f172a", "#4c1d95", "#ec4899"] },
];

const THRESHOLD = 1.8; // g — any axis jump above this counts as a shake
const COOLDOWN_MS = 500;

export function ShakeMix({ active }: { active: boolean }) {
  const [i, setI] = useState(0);
  const lastShakeRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    let sub: { remove: () => void } | null = null;
    let mounted = true;
    (async () => {
      try {
        const ok = await Accelerometer.isAvailableAsync();
        if (!ok || !mounted) return;
        Accelerometer.setUpdateInterval(100);
        sub = Accelerometer.addListener(({ x, y, z }) => {
          const mag = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (mag > THRESHOLD && now - lastShakeRef.current > COOLDOWN_MS) {
            lastShakeRef.current = now;
            setI((k) => (k + 1) % RECIPES.length);
          }
        });
      } catch {
        // accelerometer unavailable — tap button still works
      }
    })();
    return () => {
      mounted = false;
      try {
        sub?.remove();
      } catch {}
    };
  }, [active]);

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
                { left: 10 + k * 22, bottom: 10 + (k % 3) * 20 },
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={styles.name}>{r.name}</Text>
      <Text style={styles.hint}>shake phone or tap</Text>
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
  hint: {
    marginTop: 2,
    color: "#ffffff80",
    fontSize: 11,
  },
  shakeBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff18",
    borderWidth: 1,
    borderColor: "#ffffff40",
  },
  shakeTxt: { color: "#fff", fontWeight: "700" },
});
