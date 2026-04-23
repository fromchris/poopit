// Drag to squish a blob. Pure-geometry spring: position = drag point,
// scale springs back. Animated.Value + useNativeDriver for perf.

import { useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

export function SquishyBlob() {
  const scale = useRef(new Animated.Value(1)).current;
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const pulsing = useRef(false);

  const grab = () => {
    pulsing.current = true;
    Animated.spring(scale, {
      toValue: 1.35,
      useNativeDriver: true,
    }).start();
  };

  const release = () => {
    pulsing.current = false;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(x, { toValue: 0, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View
      style={styles.root}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={grab}
      onResponderMove={(e) => {
        if (!pulsing.current) return;
        // Center is relative to the touch target; tilt the blob toward touch.
        const { pageX, pageY, locationX, locationY } = e.nativeEvent as unknown as {
          pageX: number;
          pageY: number;
          locationX: number;
          locationY: number;
        };
        // Use locationX/Y relative to bounds. We don't know the bounds here,
        // so just use a coarse delta (distance from 0 / center-ish).
        x.setValue((locationX - 160) * 0.3);
        y.setValue((locationY - 260) * 0.3);
      }}
      onResponderRelease={release}
    >
      <Animated.View
        style={[
          styles.blob,
          {
            transform: [{ translateX: x }, { translateY: y }, { scale }],
          },
        ]}
      />
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
    shadowColor: "#f472b6",
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
