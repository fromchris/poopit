"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SparkIcon } from "./Icons";

export function GenerateLoader({
  open,
  prompt,
  steps,
  error,
}: {
  open: boolean;
  prompt: string;
  steps: string[];
  error?: string | null;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-black/90 p-8 backdrop-blur-md"
        >
          <motion.div
            animate={{ rotate: error ? 0 : 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 shadow-[0_0_60px_rgba(255,80,180,0.6)]"
          >
            <SparkIcon className="h-12 w-12 text-white drop-shadow" />
          </motion.div>
          <div className="text-center">
            <div className="text-lg font-black">
              {error ? "Generation failed" : "Generating playable"}
            </div>
            {prompt && !error && (
              <div className="mx-auto mt-1 max-w-[20rem] truncate text-sm text-white/60">
                “{prompt}”
              </div>
            )}
            {error && <div className="mt-1 text-sm text-rose-300">{error}</div>}
          </div>
          <div className="flex w-full max-w-[20rem] flex-col gap-2">
            {steps.map((s, i) => (
              <motion.div
                key={`${s}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 text-sm text-white"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">
                  {i < steps.length - 1 ? "✓" : "•"}
                </div>
                {s}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
