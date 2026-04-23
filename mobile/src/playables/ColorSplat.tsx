// Tap to drop color splats. Splats blend together by opacity.

import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const COLORS = ["#f472b6", "#fb923c", "#facc15", "#34d399", "#60a5fa", "#a78bfa"];
type Splat = { id: number; x: number; y: number; r: number; color: string };

export function ColorSplat() {
  const [splats, setSplats] = useState<Splat[]>([]);
  const nextIdRef = useRef(1);
  return (
    <Pressable
      style={styles.root}
      onPress={(e) => {
        const { locationX, locationY } = e.nativeEvent;
        const n = 2 + Math.floor(Math.random() * 3);
        const batch: Splat[] = [];
        for (let i = 0; i < n; i++) {
          const ang = Math.random() * Math.PI * 2;
          const dist = Math.random() * 40;
          batch.push({
            id: nextIdRef.current++,
            x: locationX + Math.cos(ang) * dist,
            y: locationY + Math.sin(ang) * dist,
            r: 40 + Math.random() * 60,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
          });
        }
        setSplats((l) => [...l, ...batch]);
      }}
    >
      {splats.map((s) => (
        <View
          key={s.id}
          style={[
            styles.splat,
            {
              left: s.x - s.r / 2,
              top: s.y - s.r / 2,
              width: s.r,
              height: s.r,
              borderRadius: s.r / 2,
              backgroundColor: s.color,
            },
          ]}
        />
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: "relative", overflow: "hidden" },
  splat: { position: "absolute", opacity: 0.55 },
});
