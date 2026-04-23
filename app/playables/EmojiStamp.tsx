"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const PALETTE = ["🌟", "💖", "🦄", "🌈", "🍒", "🔥", "🍀", "⚡", "🍩", "🫧"];

type Stamp = { id: number; x: number; y: number; emoji: string; rot: number; scale: number };

export function EmojiStamp({ active }: { active: boolean }) {
  const [emoji, setEmoji] = useState(PALETTE[0]!);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [id, setId] = useState(0);

  const addAt = (x: number, y: number) => {
    const next = id + 1;
    setId(next);
    setStamps((s) => [
      ...s.slice(-120),
      {
        id: next,
        x,
        y,
        emoji,
        rot: (Math.random() - 0.5) * 50,
        scale: 0.8 + Math.random() * 0.6,
      },
    ]);
  };

  const clear = () => setStamps([]);

  if (!active) {
    // purge when scrolled away so next visit is fresh
    if (stamps.length) clear();
  }

  return (
    <div className="relative h-full w-full overflow-hidden no-select">
      <div
        className="absolute inset-0"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          addAt(e.clientX - rect.left, e.clientY - rect.top);
        }}
        onPointerMove={(e) => {
          if (!e.buttons) return;
          const rect = e.currentTarget.getBoundingClientRect();
          if (Math.random() > 0.7) addAt(e.clientX - rect.left, e.clientY - rect.top);
        }}
      >
        <AnimatePresence>
          {stamps.map((s) => (
            <motion.div
              key={s.id}
              initial={{ scale: 0, rotate: s.rot - 40, opacity: 0 }}
              animate={{ scale: s.scale, rotate: s.rot, opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ left: s.x, top: s.y }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-4xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            >
              {s.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="pointer-events-auto absolute bottom-36 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        <div className="scroll-area flex max-w-[360px] gap-1 overflow-x-auto rounded-full bg-black/40 p-1.5 backdrop-blur">
          {PALETTE.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-xl transition ${
                emoji === e ? "bg-white/30 ring-2 ring-white" : "hover:bg-white/10"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <button
          onClick={clear}
          className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-bold text-white backdrop-blur"
        >
          clear ({stamps.length})
        </button>
      </div>
    </div>
  );
}
