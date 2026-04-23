"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Playable, PlayableKind } from "@/app/lib/types";
import { SparkIcon } from "./Icons";
import { PendingJobs, type PendingJob } from "./PendingJobs";
import { MediaPicker, type Media } from "./MediaPicker";

type Template = {
  name: string;
  emoji: string;
  color: string;
  kind: PlayableKind;
  theme: string;
};

const TEMPLATES: Template[] = [
  {
    name: "Pigeon Rhythm",
    emoji: "🐦",
    color: "from-orange-400 to-amber-300",
    kind: "rhythm-tap",
    theme: "from-orange-400 via-amber-500 to-yellow-400",
  },
  {
    name: "Bubble Pop",
    emoji: "🫧",
    color: "from-cyan-400 to-blue-500",
    kind: "bubble-pop",
    theme: "from-cyan-400 via-sky-500 to-indigo-600",
  },
  {
    name: "Squishy Pet",
    emoji: "🫠",
    color: "from-fuchsia-500 to-rose-400",
    kind: "squishy-blob",
    theme: "from-fuchsia-500 via-pink-500 to-rose-500",
  },
  {
    name: "Color Splat",
    emoji: "🎨",
    color: "from-emerald-400 to-teal-500",
    kind: "color-splat",
    theme: "from-emerald-500 via-teal-500 to-sky-500",
  },
  {
    name: "Fidget",
    emoji: "⚙️",
    color: "from-slate-400 to-slate-600",
    kind: "fidget-spinner",
    theme: "from-zinc-600 via-slate-800 to-black",
  },
  {
    name: "Tap Rain",
    emoji: "🍓",
    color: "from-pink-500 to-rose-400",
    kind: "tap-rain",
    theme: "from-rose-400 via-pink-500 to-purple-600",
  },
  {
    name: "Match Pair",
    emoji: "🌸",
    color: "from-violet-500 to-fuchsia-400",
    kind: "match-pair",
    theme: "from-indigo-600 via-violet-600 to-fuchsia-500",
  },
  {
    name: "Draw Pad",
    emoji: "✏️",
    color: "from-zinc-400 to-zinc-700",
    kind: "draw-pad",
    theme: "from-zinc-800 via-zinc-900 to-black",
  },
  {
    name: "Shake Mix",
    emoji: "🍸",
    color: "from-amber-400 to-rose-500",
    kind: "shake-mix",
    theme: "from-amber-500 via-pink-500 to-violet-600",
  },
  {
    name: "Emoji Stamp",
    emoji: "💖",
    color: "from-pink-400 to-amber-400",
    kind: "emoji-stamp",
    theme: "from-pink-500 via-fuchsia-500 to-amber-400",
  },
  {
    name: "Blank",
    emoji: "✨",
    color: "from-zinc-800 to-zinc-900",
    kind: "bubble-pop",
    theme: "from-purple-600 via-fuchsia-500 to-amber-400",
  },
];

const IDEAS = [
  "a cat that purrs louder the more you pet it",
  "a jelly that wobbles to a lofi beat",
  "tap the notes before the pigeon flies away",
  "paint fireworks that grow as you drag",
];

export function CreateScreen({
  onGenerate,
  onPickTemplate,
  pendingJobs,
  onOpenPlayable,
  onJobsChange,
}: {
  onGenerate: (
    prompt: string,
    mode: "parameter" | "code",
    attachments?: Media[]
  ) => void;
  onPickTemplate: (t: { kind: PlayableKind; theme: string; name: string }) => void;
  pendingJobs?: PendingJob[];
  onOpenPlayable?: (playableId: string) => void;
  onJobsChange?: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"parameter" | "code">("code");
  const [attachments, setAttachments] = useState<Media[]>([]);

  const submit = () => {
    const p = prompt.trim();
    if (!p && attachments.length === 0) return;
    onGenerate(p || "use my media to make something fun", mode, attachments);
    setAttachments([]);
  };

  return (
    <div className="relative h-full w-full overflow-y-auto bg-black px-5 pb-28 pt-[max(4rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-black tracking-tight">Make a playable</h1>
      <p className="mt-1 text-sm text-white/60">
        Describe an idea. Our AI builds the logic and art.
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

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-1 flex gap-1">
        <ModeBtn
          active={mode === "code"}
          onClick={() => setMode("code")}
          title="Original ✨"
          subtitle="A brand-new playable, written from scratch. ~30–90s."
        />
        <ModeBtn
          active={mode === "parameter"}
          onClick={() => setMode("parameter")}
          title="From template"
          subtitle="Pick from 10 built-in mechanics + theme. Instant."
        />
      </div>

      {pendingJobs && (
        <PendingJobs
          jobs={pendingJobs}
          onOpenPlayable={onOpenPlayable}
          onRetry={(p, m) => onGenerate(p, m)}
          onChange={onJobsChange}
        />
      )}

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-white/50">
        Start from a template
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {TEMPLATES.map((t, i) => (
          <motion.button
            key={t.name}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPickTemplate({ kind: t.kind, theme: t.theme, name: t.name })}
            className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br ${t.color} p-4 text-left shadow-lg`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="text-5xl drop-shadow-md">{t.emoji}</div>
            <div className="absolute bottom-3 left-4 right-4">
              <div className="text-base font-bold text-white drop-shadow">{t.name}</div>
              <div className="text-[11px] text-white/75">Tap to open editor</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-3 py-2.5 text-left transition ${
        active ? "bg-white text-black" : "text-white hover:bg-white/5"
      }`}
    >
      <div className="text-[13px] font-bold">{title}</div>
      <div className={`mt-0.5 text-[10px] ${active ? "text-black/55" : "text-white/55"}`}>
        {subtitle}
      </div>
    </button>
  );
}

export type { Playable };
