"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export type BurstTrigger = { id: number; x: number; y: number } | null;

export function HeartBurst({ trigger }: { trigger: BurstTrigger }) {
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (!trigger) return;
    setBursts((b) => [...b, trigger]);
    const t = setTimeout(() => {
      setBursts((b) => b.filter((x) => x.id !== trigger.id));
    }, 900);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {bursts.map((b) => (
        <motion.div
          key={b.id}
          initial={{ x: b.x, y: b.y, scale: 0.6, opacity: 0, rotate: -15 }}
          animate={{ scale: [0.6, 1.4, 1.2], opacity: [0, 1, 0], y: b.y - 80, rotate: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 text-7xl"
        >
          ❤️
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
