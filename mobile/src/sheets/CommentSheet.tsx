import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BottomSheet } from "../components/BottomSheet";
import { HeartIcon, TrashIcon } from "../components/Icons";
import { Gradient } from "../components/Gradient";
import { parseGradient } from "../lib/theme";
import { useStore, type Comment } from "../lib/store";
import type { Playable } from "../lib/types";

export function CommentSheet({
  item,
  open,
  onClose,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
}) {
  const me = useStore((s) => s.me);
  const commentsMap = useStore((s) => s.comments);
  const loadComments = useStore((s) => s.loadComments);
  const addComment = useStore((s) => s.addComment);
  const toggleCommentLike = useStore((s) => s.toggleCommentLike);
  const deleteComment = useStore((s) => s.deleteComment);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && item) {
      setLoading(true);
      loadComments(item.id).finally(() => setLoading(false));
    }
  }, [open, item, loadComments]);

  if (!item) return null;

  const list = commentsMap[item.id] ?? [];

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    await addComment(item.id, body);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`${list.length} comments`}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.body}
      >
        {loading && list.length === 0 ? (
          <View style={styles.empty}>
            <ActivityIndicator color="#ec4899" />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Be the first to comment.</Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}
            renderItem={({ item: c }) => (
              <Row
                c={c}
                canDelete={!!me && c.handle === me.handle}
                onLike={() => toggleCommentLike(item.id, c.id)}
                onDelete={() => deleteComment(item.id, c.id)}
              />
            )}
          />
        )}
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={
              me ? `Comment as ${me.handle}` : "Sign in to comment"
            }
            placeholderTextColor="#ffffff55"
            editable={!!me}
            style={styles.input}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <Pressable
            onPress={submit}
            disabled={!me || !text.trim()}
            style={[
              styles.postBtn,
              (!me || !text.trim()) && { opacity: 0.4 },
            ]}
          >
            <Text style={styles.postText}>Post</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

function Row({
  c,
  canDelete,
  onLike,
  onDelete,
}: {
  c: Comment;
  canDelete: boolean;
  onLike: () => void;
  onDelete: () => void;
}) {
  const stops = parseGradient(c.avatarBg);
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Gradient colors={stops} borderRadius={16} />
        <Text style={styles.avatarEmoji}>{c.avatar}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <View style={styles.rowHeader}>
          <Text style={styles.handle}>{c.handle}</Text>
          <Text style={styles.timeAgo}>{c.timeAgo}</Text>
        </View>
        <Text style={styles.bodyText}>{c.body}</Text>
        {canDelete && (
          <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
            <TrashIcon size={13} color="#ffffff80" />
            <Text style={styles.deleteText}>delete</Text>
          </Pressable>
        )}
      </View>
      <Pressable onPress={onLike} hitSlop={10} style={styles.likeBtn}>
        <HeartIcon
          size={18}
          filled={c.liked}
          color={c.liked ? "#f43f5e" : "#ffffff90"}
        />
        {c.likes > 0 && (
          <Text
            style={[styles.likeText, c.liked && { color: "#fb7185" }]}
          >
            {c.likes}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    minHeight: 280,
    flex: 1,
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#ffffff80",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 16,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  handle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  timeAgo: {
    color: "#ffffff55",
    fontSize: 11,
  },
  bodyText: {
    color: "#ffffffd8",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  deleteText: {
    color: "#ffffff80",
    fontSize: 11,
  },
  likeBtn: {
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  likeText: {
    marginTop: 2,
    fontSize: 10,
    color: "#ffffff80",
    fontVariant: ["tabular-nums"],
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ffffff18",
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff0c",
    borderRadius: 999,
    color: "#fff",
    fontSize: 14,
  },
  postBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ec4899",
  },
  postText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});
