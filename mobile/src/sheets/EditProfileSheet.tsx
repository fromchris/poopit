// Edit-profile sheet: handle, bio, avatar emoji. Writes via
// store.updateProfile which PATCHes /api/auth/me.

import { useEffect, useState } from "react";
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
import { ApiError } from "../lib/api";
import { useStore } from "../lib/store";

const AVATARS = ["🎨", "🎭", "🐱", "🌸", "🎬", "🫧", "🔥", "⭐", "🚀", "🍓"];

export function EditProfileSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const me = useStore((s) => s.me);
  const updateProfile = useStore((s) => s.updateProfile);
  const toast = useStore((s) => s.toast);

  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && me) {
      setHandle(me.handle);
      setBio(me.bio ?? "");
      setAvatar(me.avatar || AVATARS[0]!);
    }
  }, [open, me]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ handle: handle.trim(), bio, avatar });
      toast("Profile updated");
      onClose();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!me) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit profile">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.body}
      >
        <Text style={styles.label}>Avatar</Text>
        <View style={styles.avatarRow}>
          {AVATARS.map((a) => (
            <Pressable
              key={a}
              onPress={() => setAvatar(a)}
              style={[
                styles.avatarPick,
                avatar === a && styles.avatarPickActive,
              ]}
            >
              <Text style={styles.avatarEmoji}>{a}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Handle</Text>
        <TextInput
          value={handle}
          onChangeText={setHandle}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="@handle"
          placeholderTextColor="#ffffff55"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          maxLength={160}
          style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
          placeholder="Tell the world about your playables"
          placeholderTextColor="#ffffff55"
        />

        <Pressable
          onPress={save}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.5 }]}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#ffffff80",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  avatarPick: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff0c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarPickActive: {
    borderColor: "#ec4899",
    backgroundColor: "#ffffff1a",
  },
  avatarEmoji: {
    fontSize: 22,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff0c",
    borderWidth: 1,
    borderColor: "#ffffff1a",
    borderRadius: 12,
    color: "#fff",
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  saveText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 14,
  },
});
