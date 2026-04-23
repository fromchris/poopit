"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Playable } from "@/app/lib/types";
import { playableUrl } from "@/app/lib/url";
import { XIcon } from "./Icons";

const CHANNELS = [
  { name: "Copy link", emoji: "🔗", bg: "from-zinc-300 to-zinc-500" },
  { name: "Story", emoji: "✨", bg: "from-fuchsia-500 to-amber-400" },
  { name: "Message", emoji: "💬", bg: "from-emerald-400 to-teal-500" },
  { name: "WhatsApp", emoji: "📱", bg: "from-green-400 to-emerald-500" },
  { name: "Instagram", emoji: "📸", bg: "from-pink-500 to-amber-400" },
  { name: "X", emoji: "✖️", bg: "from-zinc-700 to-black" },
  { name: "TikTok", emoji: "🎵", bg: "from-zinc-700 to-black" },
  { name: "Save", emoji: "💾", bg: "from-sky-400 to-blue-600" },
];

const ACTIONS = [
  { name: "Report", emoji: "🚩" },
  { name: "Not interested", emoji: "🙅" },
  { name: "Hide", emoji: "🙈" },
];

export function ShareSheet({
  item,
  open,
  onClose,
  onToast,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const handle = async (name: string) => {
    onClose();
    if (!item) return;
    const url = playableUrl(item.id);
    if (name === "Copy link") {
      try {
        if (navigator.clipboard) await navigator.clipboard.writeText(url);
        onToast("Link copied");
      } catch {
        onToast("Couldn't copy");
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.description, url });
        return;
      } catch {
        /* user cancelled or failed */
      }
    }
    onToast(`Shared to ${name}`);
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
            className="absolute inset-0 z-40 bg-black/60"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-zinc-950 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-white/25" />
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <div className="text-base font-bold">Share {item.title}</div>
              <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="scroll-area flex gap-4 overflow-x-auto px-5 pb-5">
              {CHANNELS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handle(c.name)}
                  className="flex w-16 flex-none flex-col items-center gap-1.5 active:scale-95 transition"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.bg} text-2xl shadow-md`}
                  >
                    {c.emoji}
                  </div>
                  <span className="text-[11px] font-semibold text-white/90">{c.name}</span>
                </button>
              ))}
            </div>
            <div className="mx-5 border-t border-white/5" />
            <div className="px-2 py-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.name}
                  onClick={() => handle(a.name)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/5"
                >
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-[14px] font-semibold text-white/90">{a.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
