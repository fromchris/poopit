"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStore } from "@/app/lib/store";
import { api } from "@/app/lib/api";
import { XIcon } from "./Icons";

type Row = {
  handle: string;
  avatar: string;
  avatarBg: string;
  bio: string;
  isFollowing: boolean;
  isYou: boolean;
};

export function FollowListSheet({
  open,
  handle,
  kind,
  onClose,
}: {
  open: boolean;
  handle: string | null;
  kind: "followers" | "following" | null;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const toggleFollow = useStore((s) => s.toggleFollow);

  useEffect(() => {
    if (!open || !handle || !kind) return;
    setRows([]);
    setLoading(true);
    api<{ items: Row[] }>(
      `/api/users/${encodeURIComponent(handle)}/followers?kind=${kind}`
    )
      .then((r) => setRows(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, handle, kind]);

  return (
    <AnimatePresence>
      {open && handle && kind && (
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
            className="absolute inset-x-0 bottom-0 z-50 flex max-h-[85%] flex-col rounded-t-3xl bg-zinc-950 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/25" />
            <div className="flex items-center justify-between px-5 pb-3 pt-2">
              <div className="text-base font-bold">
                {kind === "followers" ? "Followers" : "Following"} · {handle}
              </div>
              <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && rows.length === 0 && (
                <div className="py-10 text-center text-sm text-white/50 animate-shimmer">
                  Loading…
                </div>
              )}
              {!loading && rows.length === 0 && (
                <div className="py-10 text-center text-sm text-white/50">No one here yet.</div>
              )}
              {rows.map((r) => (
                <div key={r.handle} className="flex items-center gap-3 px-5 py-2.5">
                  <div
                    className={`flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br text-xl ${r.avatarBg}`}
                  >
                    {r.avatar}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-[14px] font-bold">{r.handle}</div>
                    <div className="truncate text-[12px] text-white/60">{r.bio || "no bio yet"}</div>
                  </div>
                  {r.isYou ? (
                    <span className="text-[11px] font-bold text-white/45">YOU</span>
                  ) : (
                    <button
                      onClick={() => {
                        toggleFollow(r.handle);
                        setRows((arr) =>
                          arr.map((x) =>
                            x.handle === r.handle ? { ...x, isFollowing: !x.isFollowing } : x
                          )
                        );
                      }}
                      className={`flex-none rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                        r.isFollowing
                          ? "bg-white/10 text-white"
                          : "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 text-white shadow-md shadow-pink-500/40"
                      }`}
                    >
                      {r.isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
