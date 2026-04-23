"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const STORAGE_KEY = "loopit-swipe-hint-shown";

export function SwipeHint({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [enabled]);

  // Dismiss on any user gesture in the feed.
  useEffect(() => {
    if (!visible) return;
    const dismiss = () => {
      setVisible(false);
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    };
    const handlers: [string, () => void][] = [
      ["scroll", dismiss],
      ["pointerdown", dismiss],
      ["keydown", dismiss],
      ["wheel", dismiss],
      ["touchstart", dismiss],
    ];
    handlers.forEach(([k, f]) => window.addEventListener(k, f, { once: true, capture: true }));
    const auto = setTimeout(dismiss, 6000);
    return () => {
      handlers.forEach(([k, f]) => window.removeEventListener(k, f, { capture: true } as EventListenerOptions));
      clearTimeout(auto);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-[55] flex items-end justify-center pb-40"
        >
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-black/55 px-4 py-3 backdrop-blur"
          >
            <div className="text-2xl">👆</div>
            <div className="text-[12px] font-bold tracking-wider text-white">
              SWIPE UP FOR MORE
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
