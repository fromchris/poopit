"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/app/lib/store";
import { LoopitLogo } from "./TopBar";
import { SparkIcon, XIcon } from "./Icons";

type Mode = "signin" | "signup" | "guest";

export function AuthScreen({ onClose }: { onClose: () => void }) {
  const signIn = useStore((s) => s.signIn);
  const signUp = useStore((s) => s.signUp);
  const signInAsGuest = useStore((s) => s.signInAsGuest);
  const toast = useStore((s) => s.toast);

  const [mode, setMode] = useState<Mode>("signin");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "signin") await signIn(handle, password);
      else await signUp(handle, password);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      toast(msg);
    } finally {
      setBusy(false);
    }
  };

  const guest = async () => {
    setBusy(true);
    try {
      const r = await signInAsGuest();
      setRecoveryCode(r.recoveryCode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] flex flex-col bg-black"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
          <XIcon className="h-4 w-4" />
        </button>
        <LoopitLogo className="text-lg" />
        <div className="w-7" />
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-10">
        <AnimatePresence mode="wait">
          {recoveryCode ? (
            <RecoveryCodeView key="recovery" code={recoveryCode} onDone={onClose} />
          ) : (
            <motion.div key="form" className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  {mode === "signup" ? "Make an account" : "Welcome back"}
                </h1>
                <p className="mt-1 text-sm text-white/60">
                  {mode === "signup"
                    ? "Claim a handle so your playables + likes stick around."
                    : "Sign in to like, comment, and publish."}
                </p>
              </div>

              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@handle"
                autoCapitalize="off"
                autoCorrect="off"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/40 focus:border-pink-500/60 focus:outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/40 focus:border-pink-500/60 focus:outline-none"
              />

              <button
                onClick={submit}
                disabled={busy || !handle.trim() || password.length < 6}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-pink-500/40 disabled:opacity-40 active:scale-[0.98] transition"
              >
                {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>

              <button
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="text-sm text-white/70"
              >
                {mode === "signup" ? "Have an account? Sign in" : "New? Make one"}
              </button>

              <div className="my-2 flex items-center gap-3 text-xs text-white/40">
                <div className="h-px flex-1 bg-white/10" />
                or
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                onClick={guest}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                <SparkIcon className="h-4 w-4 text-pink-400" />
                Try as guest
              </button>
              <p className="text-[11px] text-white/45 text-center">
                Demo accounts: <code className="text-white/70">@you.loop</code> / <code className="text-white/70">looploop</code>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function RecoveryCodeView({ code, onDone }: { code: string; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="text-5xl">🫧</div>
      <h1 className="text-3xl font-black tracking-tight">You're in.</h1>
      <p className="text-sm text-white/70">
        This is a guest account. Save this recovery code somewhere safe — it's the
        only way to get back in if you lose your cookie.
      </p>
      <div className="select-all rounded-2xl border border-white/10 bg-white/[0.08] p-4 font-mono text-sm tracking-wider text-white">
        {code}
      </div>
      <button
        onClick={onDone}
        className="mt-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 py-3.5 text-[15px] font-bold text-white"
      >
        Got it, start looping
      </button>
    </motion.div>
  );
}
