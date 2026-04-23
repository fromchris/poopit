"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Renders a sandboxed LLM-generated HTML bundle. The bundle is served at
 * `src` (typically /api/files/<key> from our local storage). We isolate
 * it with strict `sandbox` + minimal CSP so model-written JS can run but
 * cannot touch cookies/storage/network.
 */
export function LlmBundle({ active, src }: { active: boolean; src: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      { type: "loopit:visibility", active },
      "*"
    );
  }, [active, loaded]);

  return (
    <div className="relative h-full w-full overflow-hidden no-select bg-black">
      <iframe
        ref={iframeRef}
        src={src}
        title="Generated playable"
        // sandbox="allow-scripts" (no allow-same-origin) — code can't read cookies,
        // make same-origin requests, or touch localStorage of the parent.
        sandbox="allow-scripts"
        allow="autoplay"
        className="absolute inset-0 h-full w-full border-0 bg-transparent"
        onLoad={() => setLoaded(true)}
      />
      <AnimatePresence>
        {!loaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 rounded-full border-2 border-white/30 border-t-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
