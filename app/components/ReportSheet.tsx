"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Playable } from "@/app/lib/types";
import { api } from "@/app/lib/api";
import { useStore } from "@/app/lib/store";
import { FlagIcon, XIcon } from "./Icons";

const REASONS = [
  "Nudity or sexual content",
  "Violence or threats",
  "Hate speech",
  "Spam or misleading",
  "Harassment or bullying",
  "Copyright infringement",
  "Something else",
];

export function ReportSheet({
  item,
  open,
  onClose,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useStore((s) => s.toast);
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  if (!item) return null;

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api("/api/reports", {
        body: { playableId: item.id, reason: selected, notes: notes.trim() || undefined },
      });
      toast("Thanks — our team will review");
      setSelected(null);
      setNotes("");
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't submit report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-40 bg-black/60"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 z-50 max-h-[85%] overflow-hidden rounded-t-3xl bg-zinc-950 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-white/25" />
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <div className="flex items-center gap-2 text-base font-bold">
                <FlagIcon className="h-4 w-4 text-rose-400" />
                Report
              </div>
              <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 pb-1 text-xs text-white/60">
              Help keep Loopit safe. Your report is anonymous to the creator.
            </div>

            <div className="mt-3 space-y-1 overflow-y-auto px-3" style={{ maxHeight: 320 }}>
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelected(r)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                    selected === r
                      ? "bg-pink-500/15 text-white ring-1 ring-pink-500"
                      : "text-white/85 hover:bg-white/5"
                  }`}
                >
                  {r}
                  {selected === r && <span className="text-pink-300">✓</span>}
                </button>
              ))}
            </div>

            <div className="px-5 pt-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add details (optional)"
                rows={2}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[14px] text-white placeholder:text-white/40 focus:outline-none"
                maxLength={500}
              />
            </div>

            <div className="flex gap-2 px-5 pt-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-full bg-white/10 py-2.5 text-sm font-bold text-white"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!selected || busy}
                className="flex-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/40 disabled:opacity-40"
              >
                {busy ? "…" : "Submit report"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
