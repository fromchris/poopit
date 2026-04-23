"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useStore } from "@/app/lib/store";

const AVATARS = ["🦄", "🫧", "🐦", "🎨", "⚙️", "🫠", "🌸", "🎧", "🌿", "👻", "🍓", "🐙"];

export function EditProfileSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const me = useStore((s) => s.me);
  const updateProfile = useStore((s) => s.updateProfile);
  const toast = useStore((s) => s.toast);

  const [handle, setHandle] = useState(me?.handle ?? "");
  const [bio, setBio] = useState(me?.bio ?? "");
  const [avatar, setAvatar] = useState(me?.avatar ?? "🦄");
  const [busy, setBusy] = useState(false);

  if (!me) return null;

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({
        handle: handle.trim() || undefined,
        bio: bio.trim(),
        avatar,
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast(msg);
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
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-zinc-950 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-white/25" />
            <div className="flex items-center justify-between px-5 pb-2 pt-1">
              <button onClick={onClose} className="text-sm font-semibold text-white/70">
                Cancel
              </button>
              <div className="text-base font-bold">Edit profile</div>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-full bg-white px-3 py-1 text-sm font-bold text-black disabled:opacity-60"
              >
                {busy ? "…" : "Save"}
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-4xl ring-4 ring-zinc-950">
                  {avatar}
                </div>
                <div className="flex-1 text-[11px] text-white/60">
                  Pick an avatar. Full image upload coming soon.
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-2xl transition ${
                      avatar === a
                        ? "bg-white/20 ring-2 ring-pink-500"
                        : "bg-white/[0.06] hover:bg-white/10"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                  Handle
                </label>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[14px] text-white focus:outline-none"
                  maxLength={24}
                />
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[14px] text-white placeholder:text-white/40 focus:outline-none"
                  maxLength={160}
                />
                <div className="mt-1 text-right text-[10px] text-white/40">
                  {bio.length}/160
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
