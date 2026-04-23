"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Playable, PlayableKind } from "@/app/lib/types";
import { Playable as PlayableRenderer } from "@/app/playables";
import { useStore } from "@/app/lib/store";
import { XIcon, SparkIcon, RemixIcon } from "./Icons";

const THEMES: { label: string; theme: Playable["theme"]; swatch: string }[] = [
  { label: "Cyan Sky", theme: "from-cyan-400 via-sky-500 to-indigo-600", swatch: "from-cyan-400 to-indigo-600" },
  { label: "Candy", theme: "from-fuchsia-500 via-pink-500 to-rose-500", swatch: "from-fuchsia-500 to-rose-500" },
  { label: "Sunrise", theme: "from-orange-400 via-amber-500 to-yellow-400", swatch: "from-orange-400 to-yellow-400" },
  { label: "Mint", theme: "from-emerald-500 via-teal-500 to-sky-500", swatch: "from-emerald-500 to-sky-500" },
  { label: "Chrome", theme: "from-zinc-600 via-slate-800 to-black", swatch: "from-zinc-500 to-black" },
  { label: "Neon", theme: "from-purple-600 via-fuchsia-500 to-amber-400", swatch: "from-purple-600 to-amber-400" },
];

const KINDS: { kind: PlayableKind; label: string; emoji: string }[] = [
  { kind: "bubble-pop", label: "Bubble Pop", emoji: "🫧" },
  { kind: "squishy-blob", label: "Squishy", emoji: "🫠" },
  { kind: "rhythm-tap", label: "Rhythm", emoji: "🎵" },
  { kind: "color-splat", label: "Splat", emoji: "🎨" },
  { kind: "fidget-spinner", label: "Spinner", emoji: "⚙️" },
  { kind: "tap-rain", label: "Tap Rain", emoji: "🍓" },
  { kind: "match-pair", label: "Match", emoji: "🌸" },
  { kind: "draw-pad", label: "Draw", emoji: "✏️" },
  { kind: "shake-mix", label: "Shake", emoji: "🍸" },
  { kind: "emoji-stamp", label: "Stamp", emoji: "💖" },
];

type Draft = {
  kind: PlayableKind;
  title: string;
  description: string;
  tags: string[];
  theme: string;
};

export function EditorScreen({
  open,
  source,
  initialPrompt,
  presetKind,
  presetTheme,
  onClose,
  onPublish,
}: {
  open: boolean;
  source: Playable | null;
  initialPrompt: string;
  presetKind?: PlayableKind;
  presetTheme?: string;
  onClose: () => void;
  onPublish: (title: string, description: string, tags: string[], draft: Draft) => void;
}) {
  const me = useStore((s) => s.me);

  const initial: Draft =
    source != null
      ? {
          kind: presetKind ?? source.kind,
          title: `Remix: ${source.title}`,
          description: initialPrompt || source.description,
          tags: [...source.tags, "remix"],
          theme: presetTheme ?? source.theme,
        }
      : {
          kind: presetKind ?? "bubble-pop",
          title: "Untitled playable",
          description: initialPrompt || "describe what makes yours different",
          tags: ["new"],
          theme: presetTheme ?? "from-cyan-400 via-sky-500 to-indigo-600",
        };

  const [draft, setDraft] = useState<Draft>(initial);
  const [tagInput, setTagInput] = useState("");

  // If the agent pre-filled a pending spec, hydrate the draft from it.
  useEffect(() => {
    if (!open) return;
    const raw = sessionStorage.getItem("loopit-pending-spec");
    if (!raw) return;
    try {
      const spec = JSON.parse(raw) as Draft;
      setDraft((d) => ({
        kind: spec.kind ?? d.kind,
        theme: spec.theme ?? d.theme,
        title: spec.title ?? d.title,
        description: spec.description ?? d.description,
        tags: (spec.tags && spec.tags.length ? spec.tags : d.tags).slice(0, 6),
      }));
    } catch {}
    sessionStorage.removeItem("loopit-pending-spec");
  }, [open]);

  if (!open) return null;

  const addTag = () => {
    const t = tagInput.trim().replace(/^#+/, "").toLowerCase();
    if (!t) return;
    if (draft.tags.includes(t)) return setTagInput("");
    setDraft({ ...draft, tags: [...draft.tags, t].slice(0, 6) });
    setTagInput("");
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 240 }}
      className="absolute inset-0 z-[65] flex flex-col bg-zinc-950"
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
          <XIcon className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <RemixIcon className="h-4 w-4 text-pink-400" />
          Editor
        </div>
        <button
          onClick={() =>
            onPublish(draft.title, draft.description, draft.tags, draft)
          }
          className="rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-4 py-1.5 text-sm font-bold text-white shadow-md shadow-pink-500/40"
        >
          Publish
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div
            className={`relative aspect-[9/16] overflow-hidden rounded-2xl bg-gradient-to-br ${draft.theme}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
            <PlayableRenderer kind={draft.kind} active src={source?.src} />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-[13px] font-bold drop-shadow">{draft.title}</div>
              <div className="text-[11px] text-white/80 drop-shadow">{draft.description}</div>
            </div>
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
              {me?.avatar ?? "🦄"} {me?.handle ?? "@you"}
            </div>
          </div>
        </div>

        <Section label="Mechanic">
          <div className="scroll-area flex gap-2 overflow-x-auto px-4 pb-1">
            {KINDS.map((k) => (
              <button
                key={k.kind}
                onClick={() => setDraft({ ...draft, kind: k.kind })}
                className={`flex flex-none flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 text-xs font-bold transition ${
                  draft.kind === k.kind
                    ? "border-pink-500 bg-pink-500/10 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/70"
                }`}
              >
                <span className="text-xl">{k.emoji}</span>
                {k.label}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Theme">
          <div className="scroll-area flex gap-3 overflow-x-auto px-4 pb-1">
            {THEMES.map((t) => (
              <button
                key={t.label}
                onClick={() => setDraft({ ...draft, theme: t.theme })}
                className="flex flex-none flex-col items-center gap-1.5"
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${t.swatch} ring-2 transition ${
                    draft.theme === t.theme ? "ring-white" : "ring-transparent"
                  }`}
                />
                <span className="text-[10px] font-semibold text-white/70">{t.label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section label="Title">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="mx-4 w-[calc(100%-2rem)] rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[14px] text-white focus:border-pink-500/60 focus:outline-none"
            maxLength={60}
          />
        </Section>

        <Section label="Caption">
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
            className="mx-4 w-[calc(100%-2rem)] resize-none rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[14px] text-white focus:border-pink-500/60 focus:outline-none"
            maxLength={160}
          />
        </Section>

        <Section label="Tags">
          <div className="px-4 pb-6">
            <div className="flex flex-wrap gap-1.5">
              {draft.tags.map((t) => (
                <button
                  key={t}
                  onClick={() => setDraft({ ...draft, tags: draft.tags.filter((x) => x !== t) })}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold"
                >
                  #{t} ×
                </button>
              ))}
              <div className="flex items-center gap-1 rounded-full bg-white/[0.06] pl-2 pr-1">
                <span className="text-xs text-white/40">#</span>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="add tag"
                  className="w-20 bg-transparent py-1 text-xs text-white placeholder:text-white/30 focus:outline-none"
                />
                <button
                  onClick={addTag}
                  className="rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </Section>

        <div className="mx-4 mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-[12px] font-bold text-white/80">
            <SparkIcon className="h-4 w-4 text-pink-400" />
            Draft
          </div>
          <p className="mt-1 text-[11px] leading-snug text-white/55">
            Mechanic, theme, and caption are a first pass — tweak anything
            before publishing.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="px-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-white/50">
        {label}
      </div>
      {children}
    </div>
  );
}
