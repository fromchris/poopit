// Native bottom sheet — plain RN Modal with a slide-up animation.
// Not using @gorhom/bottom-sheet to keep deps minimal.

import { type ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePrefs } from "../lib/prefs";
import { XIcon } from "./Icons";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeight,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: number;
}) {
  const { height: winH } = Dimensions.get("window");
  const cap = maxHeight ?? Math.floor(winH * 0.85);
  const slide = useRef(new Animated.Value(winH)).current;
  const insets = useSafeAreaInsets();
  const reducedMotion = usePrefs((s) => s.reducedMotion);

  useEffect(() => {
    if (open) {
      Animated.timing(slide, {
        toValue: 0,
        duration: reducedMotion ? 0 : 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      slide.setValue(winH);
    }
  }, [open, slide, winH, reducedMotion]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation?.()}>
          <Animated.View
            style={[
              styles.sheet,
              {
                maxHeight: cap,
                paddingBottom: insets.bottom + 16,
                transform: [{ translateY: slide }],
              },
            ]}
          >
            <View style={styles.grabber} />
            {title ? (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={onClose} hitSlop={12}>
                  <XIcon size={20} />
                </Pressable>
              </View>
            ) : null}
            <View style={styles.body}>{children}</View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111113",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffffff30",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
  },
});
