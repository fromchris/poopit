// Finger-paint: each pan builds a polyline rendered via react-native-svg.

import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";

type Stroke = { id: number; points: string; color: string };
const COLORS = ["#ffffff", "#f472b6", "#facc15", "#34d399", "#60a5fa"];

export function DrawPad() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(COLORS[0]!);
  const currentRef = useRef<string>("");
  const nextIdRef = useRef(1);

  return (
    <View style={styles.root}>
      <View
        style={styles.canvas}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          currentRef.current = `${x},${y}`;
        }}
        onResponderMove={(e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          currentRef.current += ` ${x},${y}`;
          // Force re-render to show in-progress stroke
          setStrokes((s) => [...s]);
        }}
        onResponderRelease={() => {
          if (!currentRef.current) return;
          setStrokes((s) => [
            ...s,
            { id: nextIdRef.current++, points: currentRef.current, color },
          ]);
          currentRef.current = "";
        }}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {strokes.map((s) => (
            <Polyline
              key={s.id}
              points={s.points}
              stroke={s.color}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentRef.current ? (
            <Polyline
              points={currentRef.current}
              stroke={color}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      </View>
      <View style={styles.palette}>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.swatch,
              {
                backgroundColor: c,
                borderWidth: color === c ? 3 : 1,
                borderColor: color === c ? "#fff" : "#ffffff40",
              },
            ]}
          />
        ))}
        <Pressable
          onPress={() => setStrokes([])}
          style={styles.clearBtn}
        >
          <Text style={styles.clearText}>clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: { flex: 1 },
  palette: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#00000060",
  },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  clearBtn: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ffffff18",
  },
  clearText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
