"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Playable } from "@/app/lib/types";
import { RemixIcon, SparkIcon, XIcon } from "./Icons";

const SUGGESTIONS = [
  "Make everything neon pink",
  "Swap to an underwater theme",
  "Make it harder and add a timer",
  "Turn bubbles into ghosts",
  "Add a cat that meows on tap",
];

export function RemixSheet({
  item,
  open,
  onClose,
  onGenerate,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");

  const submit = () => {
    onGenerate(prompt);
    setPrompt("");
  };

  return (
    <AnimatePresence>
      {open && item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-zinc-950 p-5 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[0_-20px_50px_rgba(255,45,135,0.2)]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/25" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400">
                  <RemixIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-base font-bold">Remix this playable</div>
                  <div className="text-xs text-white/60">
                    based on <span className="text-white/85">{item.title}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-5">
              <input
                type="text"
                autoFocus
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Describe your twist…"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pl-4 pr-10 text-[15px] text-white placeholder:text-white/40 focus:border-pink-500/60 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
              />
              <SparkIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-pink-400 animate-shimmer" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10"
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={submit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-pink-500/40 active:scale-[0.98] transition"
            >
              <SparkIcon className="h-5 w-5" />
              Generate Remix
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
