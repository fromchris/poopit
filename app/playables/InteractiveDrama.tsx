"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Hosts a self-contained interactive-drama HTML bundle in an iframe.
 *
 * The bundle owns its own playback + branching state machine (video,
 * choice UI, QTEs, timers, explore hotspots). We NEVER drive the video's
 * play/pause from outside: external control fights the drama's state
 * machine — `playing` flag desyncs, interactions never fire.
 *
 * What we do:
 *  - Mute when offscreen so audio doesn't bleed through the feed.
 *  - Show a "tap to play" hint when the video is paused at t=0 and the
 *    drama is in view — browsers block audible autoplay without a user
 *    gesture, so we guide the user to tap once. Real tap → gesture →
 *    the drama's own `#s.onclick` calls v.play() inside the iframe.
 */
export function InteractiveDrama({
  active,
  src,
}: {
  active: boolean;
  src: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [needsTap, setNeedsTap] = useState(true);

  // Mute/unmute only. Never touch play/pause.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !loaded) return;
    try {
      const video = iframe.contentDocument?.querySelector("video");
      if (!video) return;
      video.muted = !active;
    } catch {}
  }, [active, loaded]);

  // Poll the iframe's video to decide whether to show "tap to play".
  useEffect(() => {
    if (!loaded || !active) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const interval = setInterval(() => {
      try {
        const v = iframe.contentDocument?.querySelector("video");
        if (!v) return;
        // Hint visible only while the video hasn't actually begun
        setNeedsTap(v.paused && v.currentTime < 0.1);
      } catch {}
    }, 400);
    return () => clearInterval(interval);
  }, [loaded, active]);

  return (
    <div className="relative h-full w-full overflow-hidden no-select bg-black">
      <iframe
        ref={iframeRef}
        src={src}
        title="Interactive drama"
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; fullscreen; accelerometer"
        onLoad={() => setLoaded(true)}
      />

      <AnimatePresence>
        {!loaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 rounded-full border-2 border-amber-500/30 border-t-amber-500"
            />
            <div className="text-[13px] font-semibold tracking-widest text-amber-500/80">
              LOADING EPISODE
            </div>
            <div className="text-[11px] text-white/45">大乾假太监 · 主线</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap-to-play hint — pointer-events none so the tap reaches the iframe */}
      <AnimatePresence>
        {loaded && active && needsTap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[2px]"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl shadow-[0_0_40px_rgba(255,255,255,0.4)]"
            >
              ▶
            </motion.div>
            <div className="text-[13px] font-bold tracking-wider text-white/90">
              点屏幕开始 · TAP TO PLAY
            </div>
            <div className="text-[10px] text-white/55">
              第一集·主线 · 你的选择决定结局
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
