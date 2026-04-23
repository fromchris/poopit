"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Drop = { id: string; x: number; emoji: string; spawnedAt: number; dur: number };

const EMOJIS = ["🍓", "🍒", "🍎", "🥝", "🍊", "🍇", "🍑", "🌸", "🍋"];

export function TapRain({ active }: { active: boolean }) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setDrops((d) => [
        ...d.slice(-10),
        {
          id: `d-${Date.now()}-${idRef.current++}`,
          x: 8 + Math.random() * 84,
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]!,
          spawnedAt: performance.now(),
          dur: 2200 + Math.random() * 1200,
        },
      ]);
    }, 650);
    return () => clearInterval(interval);
  }, [active]);

  const tap = useCallback((id: string) => {
    setDrops((d) => d.filter((x) => x.id !== id));
    setScore((s) => s + 1);
  }, []);

  const miss = useCallback((id: string) => {
    setDrops((d) => d.filter((x) => x.id !== id));
    setMisses((m) => m + 1);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden no-select">
      <div className="pointer-events-none absolute left-1/2 top-24 z-10 -translate-x-1/2 text-center">
        <div className="text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          {score}
        </div>
        <div className="mt-1 text-[11px] font-bold tracking-widest text-white/70">
          CATCH! · 失误 {misses}
        </div>
      </div>

      <AnimatePresence>
        {drops.map((d) => (
          <motion.button
            key={d.id}
            initial={{ top: "-10%", opacity: 0, scale: 0.6 }}
            animate={{ top: "110%", opacity: 1, scale: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ top: { duration: d.dur / 1000, ease: "linear" }, default: { duration: 0.15 } }}
            onClick={() => tap(d.id)}
            onAnimationComplete={() => miss(d.id)}
            style={{ left: `${d.x}%` }}
            className="absolute -translate-x-1/2 text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
          >
            {d.emoji}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
