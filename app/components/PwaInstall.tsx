"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { XIcon } from "./Icons";

type BeforeInstallEvt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SUPPRESS_KEY = "loopit-install-dismissed";

export function PwaInstall() {
  const [evt, setEvt] = useState<BeforeInstallEvt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register SW (idempotent).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (window.matchMedia?.("(display-mode: standalone)")?.matches) {
      setInstalled(true);
      return;
    }

    if (localStorage.getItem(SUPPRESS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallEvt);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (installed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(SUPPRESS_KEY, "1");
    } catch {}
    setEvt(null);
  };

  const install = async () => {
    if (!evt) return;
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === "accepted") setInstalled(true);
    } finally {
      setEvt(null);
    }
  };

  return (
    <AnimatePresence>
      {evt && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="pointer-events-auto absolute bottom-24 left-3 right-3 z-[70] flex items-center gap-3 rounded-2xl border border-white/15 bg-zinc-950/95 p-3 shadow-xl backdrop-blur"
        >
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-xl">
            ∞
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold">Install Loopit</div>
            <div className="text-[11px] text-white/60">
              Full-screen app, faster launch, no browser bar.
            </div>
          </div>
          <button
            onClick={install}
            className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-black"
          >
            Install
          </button>
          <button onClick={dismiss} className="rounded-full bg-white/10 p-1.5">
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
