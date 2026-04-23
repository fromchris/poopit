"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * Stacked toast queue. Pass the whole array; each entry shows with a stagger
 * and slides out after the store dismisses it.
 */
export function Toast({ messages }: { messages: string[] | string | null }) {
  const list = Array.isArray(messages)
    ? messages
    : typeof messages === "string"
    ? [messages]
    : [];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-[60] flex flex-col items-center gap-1.5">
      <AnimatePresence>
        {list.slice(0, 3).map((msg, i) => (
          <motion.div
            key={msg + "-" + i}
            initial={{ y: 40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
            className="rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-black shadow-lg"
          >
            {msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
