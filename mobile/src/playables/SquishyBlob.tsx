// Squishy blob — the "pet the kitty" playable. Drag to squish, the
// longer you hold the louder the purr (shown as a widening halo +
// growing tilde count). Letting go springs back.

import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export function SquishyBlob() {
  const scale = useRef(new Animated.Value(1)).current;
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const petting = useRef(false);
  const [purr, setPurr] = useState(0);

  // While petting, the purr count climbs; when released, it decays.
  useEffect(() => {
    let raf: number;
    const tick = () => {
      setPurr((p) => {
        if (petting.current) return Math.min(p + 0.08, 12);
        return p > 0 ? Math.max(p - 0.05, 0) : 0;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const grab = () => {
    petting.current = true;
    Animated.spring(scale, {
      toValue: 1.3,
      useNativeDriver: true,
    }).start();
    Animated.timing(halo, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const release = () => {
    petting.current = false;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(x, { toValue: 0, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, useNativeDriver: true }),
      Animated.timing(halo, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View
      style={styles.root}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={grab}
      onResponderMove={(e) => {
        if (!petting.current) return;
        const { locationX, locationY } = e.nativeEvent;
        x.setValue((locationX - 160) * 0.25);
        y.setValue((locationY - 260) * 0.25);
      }}
      onResponderRelease={release}
      onResponderTerminate={release}
    >
      {/* Purr halo — grows with purr intensity */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            opacity: halo.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            }),
            transform: [
              {
                scale: halo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.8],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.blob,
          {
            transform: [{ translateX: x }, { translateY: y }, { scale }],
          },
        ]}
      >
        <Text style={styles.face}>🐱</Text>
      </Animated.View>

      {/* "purr~~~" indicator, grows with intensity */}
      <View pointerEvents="none" style={styles.purrWrap}>
        <Text style={styles.purrText}>
          {purr > 0.5
            ? "purr" + "~".repeat(Math.min(Math.floor(purr), 10))
            : "tap & hold to pet"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  blob: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#f472b6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f472b6",
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  face: {
    fontSize: 80,
  },
  halo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#ffffff",
  },
  purrWrap: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  purrText: {
    color: "#ffffffd8",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
