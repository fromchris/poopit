// Swipe to spin; momentum decays. Angle kept in state.

import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export function FidgetSpinner() {
  const [angle, setAngle] = useState(0);
  const velRef = useRef(0);
  const lastRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      if (Math.abs(velRef.current) > 0.001) {
        setAngle((a) => a + velRef.current);
        velRef.current *= 0.985;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <View
      style={styles.root}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        lastRef.current = {
          x: e.nativeEvent.locationX,
          y: e.nativeEvent.locationY,
        };
      }}
      onResponderMove={(e) => {
        const nx = e.nativeEvent.locationX;
        const ny = e.nativeEvent.locationY;
        const dx = nx - lastRef.current.x;
        const dy = ny - lastRef.current.y;
        velRef.current += (dx + dy) * 0.15;
        lastRef.current = { x: nx, y: ny };
      }}
    >
      <View
        style={[
          styles.spinner,
          { transform: [{ rotate: `${angle}deg` }] },
        ]}
      >
        <View style={[styles.arm, { backgroundColor: "#f43f5e" }]} />
        <View
          style={[
            styles.arm,
            { backgroundColor: "#fbbf24", transform: [{ rotate: "120deg" }] },
          ]}
        />
        <View
          style={[
            styles.arm,
            { backgroundColor: "#60a5fa", transform: [{ rotate: "240deg" }] },
          ]}
        />
        <View style={styles.hub} />
      </View>
      <Text style={styles.hint}>flick to spin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  arm: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    top: 20,
  },
  hub: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#ffffff60",
  },
  hint: {
    position: "absolute",
    bottom: 24,
    color: "#ffffff90",
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
});
