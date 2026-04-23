import { StyleSheet, Text, View } from "react-native";

// Placeholder for playable kinds not yet ported to native. Shows a
// centered label so the feed still flows through them correctly.

export function StubPlayable({ kind }: { kind: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{kind}</Text>
      <Text style={styles.hint}>not ported to native yet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  label: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffffd8",
    letterSpacing: -0.5,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: "#ffffff70",
  },
});
