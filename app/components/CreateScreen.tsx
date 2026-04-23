"use client";

import { useState } from "react";
import type { Playable } from "@/app/lib/types";
import { SparkIcon } from "./Icons";
import { PendingJobs, type PendingJob } from "./PendingJobs";
import { MediaPicker, type Media } from "./MediaPicker";

const IDEAS = [
  "a cat that purrs louder the more you pet it",
  "a jelly that wobbles to a lofi beat",
  "tap the notes before the pigeon flies away",
  "paint fireworks that grow as you drag",
];

export function CreateScreen({
  onGenerate,
  pendingJobs,
  onOpenPlayable,
  onJobsChange,
}: {
  onGenerate: (
    prompt: string,
    mode: "parameter" | "code",
    attachments?: Media[]
  ) => void;
  pendingJobs?: PendingJob[];
  onOpenPlayable?: (playableId: string) => void;
  onJobsChange?: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Media[]>([]);

  const submit = () => {
    const p = prompt.trim();
    if (!p && attachments.length === 0) return;
    onGenerate(p || "use my media to make something fun", "code", attachments);
    setAttachments([]);
  };

  return (
    <div className="relative h-full w-full overflow-y-auto bg-black px-5 pb-28 pt-[max(4rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-black tracking-tight">Make a playable</h1>
      <p className="mt-1 text-sm text-white/60">
        Describe an idea. The AI writes the whole thing — logic, art, and all.
      </p>

      <div className="relative mt-5">
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="a cat that purrs louder the more you pet it…"
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-[15px] text-white placeholder:text-white/40 focus:border-pink-500/60 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
          maxLength={240}
        />
        <button
          onClick={submit}
          disabled={!prompt.trim() && attachments.length === 0}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-pink-500/40 disabled:opacity-40 active:scale-95 transition"
        >
          <SparkIcon className="h-4 w-4" />
          Generate
        </button>
      </div>

      <MediaPicker items={attachments} onChange={setAttachments} />

      <div className="mt-3 flex flex-wrap gap-2">
        {IDEAS.map((i) => (
          <button
            key={i}
            onClick={() => setPrompt(i)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
          >
            {i}
          </button>
        ))}
      </div>

      {pendingJobs && (
        <PendingJobs
          jobs={pendingJobs}
          onOpenPlayable={onOpenPlayable}
          onRetry={(p, m) => onGenerate(p, m)}
          onChange={onJobsChange}
        />
      )}
    </div>
  );
}

export type { Playable };
