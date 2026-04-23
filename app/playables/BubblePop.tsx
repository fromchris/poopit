"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Bubble = { id: string; x: number; y: number; size: number; hue: number };

export function BubblePop({ active }: { active: boolean }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const spawn = () => {
      setBubbles((b) => {
        const trimmed = b.length > 14 ? b.slice(-14) : b;
        return [
          ...trimmed,
          {
            id: `b-${Date.now()}-${idRef.current++}`,
            x: 8 + Math.random() * 84,
            y: 90 + Math.random() * 10,
            size: 48 + Math.random() * 56,
            hue: Math.floor(Math.random() * 360),
          },
        ];
      });
    };
    spawn();
    const interval = setInterval(spawn, 520);
    return () => clearInterval(interval);
  }, [active]);

  const pop = useCallback((id: string) => {
    setBubbles((b) => b.filter((x) => x.id !== id));
    setScore((s) => s + 1);
    setStreak((s) => s + 1);
  }, []);

  useEffect(() => {
    if (streak === 0) return;
    const t = setTimeout(() => setStreak(0), 1500);
    return () => clearTimeout(t);
  }, [streak]);

  return (
    <div className="relative h-full w-full overflow-hidden no-select">
      {/* HUD */}
      <div className="pointer-events-none absolute left-1/2 top-24 z-10 -translate-x-1/2 text-center">
        <div className="text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          {score}
        </div>
        <AnimatePresence>
          {streak > 2 && (
            <motion.div
              key={streak}
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white backdrop-blur"
            >
              🔥 {streak}x streak
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bubbles rising */}
      <AnimatePresence>
        {bubbles.map((b) => (
          <motion.button
            key={b.id}
            initial={{ top: `${b.y}%`, opacity: 0, scale: 0.6 }}
            animate={{ top: "-20%", opacity: 1, scale: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ top: { duration: 6, ease: "linear" }, default: { duration: 0.3 } }}
            onClick={() => pop(b.id)}
            onAnimationComplete={() =>
              setBubbles((cur) => cur.filter((x) => x.id !== b.id))
            }
            style={{
              left: `${b.x}%`,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 30% 30%, hsla(${b.hue},90%,85%,0.95), hsla(${b.hue},85%,60%,0.55) 60%, hsla(${b.hue},75%,40%,0.25))`,
              boxShadow: `0 0 24px hsla(${b.hue},90%,70%,0.6), inset -8px -10px 20px hsla(${b.hue},60%,40%,0.35)`,
            }}
            className="absolute -translate-x-1/2 rounded-full border border-white/40"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
