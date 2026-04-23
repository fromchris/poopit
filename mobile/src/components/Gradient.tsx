// Minimal linear gradient using react-native-svg — avoids pulling in
// expo-linear-gradient as a separate dep. Stops are positioned evenly
// from top-left to bottom-right to match the web's `bg-gradient-to-br`.

import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

export function Gradient({
  colors,
  style,
  borderRadius = 0,
}: {
  colors: string[];
  style?: ViewStyle;
  borderRadius?: number;
}) {
  const stops = colors.length >= 2 ? colors : [...colors, ...colors];
  const gradId = `g-${stops.join("")}`;
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: "hidden" }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            {stops.map((c, i) => (
              <Stop
                key={i}
                offset={`${(i / (stops.length - 1)) * 100}%`}
                stopColor={c}
                stopOpacity={1}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>
    </View>
  );
}
