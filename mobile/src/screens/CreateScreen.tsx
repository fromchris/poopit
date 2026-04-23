// Native port of app/components/CreateScreen.tsx. Matches the
// post-template-removal design: prompt + media picker + idea chips +
// pending-jobs list. Always generates (no template flow).

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SparkIcon, XIcon } from "../components/Icons";
import { api } from "../lib/api";
import { pickMedia, uploadAsset, type UploadedMedia } from "../lib/uploads";
import { useStore } from "../lib/store";

const IDEAS = [
  "a cat that purrs louder the more you pet it",
  "a jelly that wobbles to a lofi beat",
  "tap the notes before the pigeon flies away",
  "paint fireworks that grow as you drag",
];

type PendingJob = {
  id: string;
  prompt: string;
  status: "queued" | "running" | "succeeded" | "failed";
  playableId?: string | null;
  mode: "parameter" | "code";
};

export function CreateScreen({
  onOpenAuth,
}: {
  onOpenAuth: () => void;
}) {
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.me);
  const startGenerate = useStore((s) => s.startGenerate);

  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobs, setJobs] = useState<PendingJob[]>([]);

  const reloadJobs = useCallback(async () => {
    if (!me) return;
    try {
      const r = await api<{ items: PendingJob[] }>(
        "/api/me/generations?limit=10",
      );
      setJobs(r.items);
    } catch {}
  }, [me]);

  useEffect(() => {
    if (!me) {
      setJobs([]);
      return;
    }
    reloadJobs();
    const iv = setInterval(reloadJobs, 3000);
    return () => clearInterval(iv);
  }, [me, reloadJobs]);

  const addMedia = async (kind: "image" | "video") => {
    if (!me) {
      onOpenAuth();
      return;
    }
    const asset = await pickMedia(kind);
    if (!asset) return;
    setUploading(true);
    try {
      const uploaded = await uploadAsset(asset);
      setAttachments((a) => [...a, uploaded]);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!me) {
      onOpenAuth();
      return;
    }
    const p = prompt.trim();
    if (!p && attachments.length === 0) return;
    setGenerating(true);
    try {
      const r = await startGenerate(
        p || "use my media to make something fun",
        null,
        attachments.map((a) => ({ kind: a.kind, url: a.url, mime: a.mime })),
      );
      if (r) {
        setPrompt("");
        setAttachments([]);
        await reloadJobs();
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 24,
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <View>
            <Text style={styles.h1}>Make a playable</Text>
            <Text style={styles.sub}>
              Describe an idea. The AI writes the whole thing — logic, art,
              and all.
            </Text>

            <View style={styles.inputWrap}>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={4}
                placeholder="a cat that purrs louder the more you pet it…"
                placeholderTextColor="#ffffff55"
                style={styles.input}
                maxLength={240}
              />
              <Pressable
                onPress={submit}
                disabled={
                  generating || (!prompt.trim() && attachments.length === 0)
                }
                style={[
                  styles.generateBtn,
                  (generating ||
                    (!prompt.trim() && attachments.length === 0)) && {
                    opacity: 0.4,
                  },
                ]}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <SparkIcon size={16} />
                    <Text style={styles.generateText}>Generate</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.mediaRow}>
              <Pressable
                onPress={() => addMedia("image")}
                style={styles.mediaBtn}
              >
                <Text style={styles.mediaEmoji}>📷</Text>
                <Text style={styles.mediaLabel}>Photo</Text>
              </Pressable>
              <Pressable
                onPress={() => addMedia("video")}
                style={styles.mediaBtn}
              >
                <Text style={styles.mediaEmoji}>🎥</Text>
                <Text style={styles.mediaLabel}>Video</Text>
              </Pressable>
              {uploading && <ActivityIndicator color="#ec4899" />}
            </View>

            {attachments.length > 0 && (
              <View style={styles.thumbs}>
                {attachments.map((a, i) => (
                  <View key={a.url} style={styles.thumbWrap}>
                    <Image
                      source={{ uri: `${a.url}` }}
                      style={styles.thumb}
                    />
                    <Pressable
                      style={styles.removeThumb}
                      onPress={() =>
                        setAttachments((list) =>
                          list.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <XIcon size={12} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

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

            {jobs.length > 0 && (
              <Text style={styles.jobsHeader}>Your latest generations</Text>
            )}
          </View>
        }
        renderItem={({ item: job }) => <JobRow job={job} />}
      />
    </KeyboardAvoidingView>
  );
}

function JobRow({ job }: { job: PendingJob }) {
  return (
    <View style={styles.jobRow}>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={styles.jobPrompt}>
          {job.prompt}
        </Text>
        <Text style={styles.jobStatus}>
          {job.status === "queued"
            ? "Queued…"
            : job.status === "running"
              ? "Generating…"
              : job.status === "failed"
                ? "Failed"
                : "Published"}
        </Text>
      </View>
      {(job.status === "queued" || job.status === "running") && (
        <ActivityIndicator color="#ec4899" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  h1: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    color: "#ffffff90",
  },
  inputWrap: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ffffff1a",
    borderRadius: 16,
    backgroundColor: "#ffffff0c",
    padding: 14,
  },
  input: {
    minHeight: 80,
    color: "#fff",
    fontSize: 15,
    textAlignVertical: "top",
  },
  generateBtn: {
    alignSelf: "flex-end",
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ec4899",
  },
  generateText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  mediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffffff1a",
    backgroundColor: "#ffffff08",
  },
  mediaEmoji: {
    fontSize: 16,
  },
  mediaLabel: {
    color: "#ffffffd0",
    fontSize: 13,
    fontWeight: "600",
  },
  thumbs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  thumbWrap: {
    position: "relative",
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#ffffff18",
  },
  removeThumb: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff40",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffffff1a",
    backgroundColor: "#ffffff06",
  },
  chipText: {
    fontSize: 12,
    color: "#ffffffcc",
  },
  jobsHeader: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#ffffff80",
    textTransform: "uppercase",
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ffffff14",
  },
  jobPrompt: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
  },
  jobStatus: {
    marginTop: 2,
    fontSize: 11,
    color: "#ffffff80",
  },
});
