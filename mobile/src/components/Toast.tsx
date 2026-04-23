// Floating bottom-center toasts fed from the store.

import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../lib/store";

export function Toast() {
  const messages = useStore((s) => s.toasts);
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (messages.length > 0) {
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slide, {
        toValue: 60,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [messages.length, slide]);

  if (messages.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + 100 }]}
    >
      <Animated.View style={{ transform: [{ translateY: slide }] }}>
        <View style={styles.toast}>
          <Text style={styles.text}>{messages[0]}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffffee",
  },
  text: {
    color: "#000",
    fontSize: 13,
    fontWeight: "700",
  },
});
