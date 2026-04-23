import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BottomSheet } from "../components/BottomSheet";
import { SparkIcon } from "../components/Icons";
import { useStore } from "../lib/store";
import type { Playable } from "../lib/types";

const IDEAS = [
  "make it lofi-themed",
  "add a combo meter",
  "flip the colors to neon",
  "make it harder at night",
];

export function RemixSheet({
  item,
  open,
  onClose,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
}) {
  const startGenerate = useStore((s) => s.startGenerate);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  if (!item) return null;

  const submit = async () => {
    const p = prompt.trim() || `remix of ${item.title}`;
    setBusy(true);
    try {
      const r = await startGenerate(p, item.id);
      if (r) {
        setPrompt("");
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={`Remix "${item.title}"`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.body}
      >
        <Text style={styles.sub}>
          Describe what you'd change. The agent writes the new playable.
        </Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={3}
          placeholder="lofi colors, add a combo meter…"
          placeholderTextColor="#ffffff55"
          style={styles.input}
        />
        <View style={styles.chips}>
          {IDEAS.map((i) => (
            <Pressable
              key={i}
              onPress={() => setPrompt(i)}
              style={styles.chip}
            >
              <Text style={styles.chipText}>{i}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          disabled={busy}
          onPress={submit}
          style={[styles.submit, busy && { opacity: 0.5 }]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <SparkIcon size={16} />
              <Text style={styles.submitText}>Remix</Text>
            </>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sub: {
    color: "#ffffff88",
    fontSize: 13,
    marginBottom: 12,
  },
  input: {
    minHeight: 80,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#ffffff0c",
    borderRadius: 14,
    color: "#fff",
    fontSize: 14,
    textAlignVertical: "top",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ffffff0c",
    borderWidth: 1,
    borderColor: "#ffffff1a",
  },
  chipText: {
    fontSize: 12,
    color: "#ffffffd0",
  },
  submit: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#ec4899",
  },
  submitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
