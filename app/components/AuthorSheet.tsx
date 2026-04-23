"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Playable, PlayableKind } from "@/app/lib/types";
import { formatCount } from "@/app/lib/mockData";
import { useStore } from "@/app/lib/store";
import { api } from "@/app/lib/api";
import { FollowListSheet } from "./FollowListSheet";
import { ConversationView } from "./ConversationView";
import { PlayableThumb } from "./PlayableThumb";
import { XIcon } from "./Icons";

type AuthorInfo = {
  user: {
    handle: string;
    avatar: string;
    avatarBg: string;
    bio: string;
    isFollowing: boolean;
    counts: { playables: number; followers: number; following: number; likes: number };
  };
  playables: Playable[];
};

export function AuthorSheet({
  item,
  open,
  onClose,
  onOpenPlayable,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
  onOpenPlayable?: (p: Playable) => void;
}) {
  const toggleFollow = useStore((s) => s.toggleFollow);
  const me = useStore((s) => s.me);
  const toast = useStore((s) => s.toast);
  const [info, setInfo] = useState<AuthorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [followKind, setFollowKind] = useState<"followers" | "following" | null>(null);
  const [convId, setConvId] = useState<string | null>(null);

  const openDm = async () => {
    if (!item) return;
    if (!me) return toast("Sign in to message");
    try {
      const r = await api<{ id: string }>("/api/conversations", {
        body: { handle: item.author.handle },
      });
      setConvId(r.id);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't open chat");
    }
  };

  useEffect(() => {
    if (!open || !item) return;
    setInfo(null);
    setLoading(true);
    api<AuthorInfo>(`/api/users/${encodeURIComponent(item.author.handle)}`)
      .then(setInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, item]);

  return (
    <AnimatePresence>
      {open && item && (
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
            className="absolute inset-x-0 bottom-0 z-50 max-h-[82%] overflow-hidden rounded-t-3xl bg-zinc-950"
          >
            <div className={`relative h-24 bg-gradient-to-br ${item.author.avatarBg}`}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.35),transparent_60%)]" />
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-black/40 p-1.5"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="-mt-10 px-5 pb-6 overflow-y-auto" style={{ maxHeight: "calc(82vh - 6rem)" }}>
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-4xl ring-4 ring-zinc-950 ${item.author.avatarBg}`}
              >
                {item.author.avatar}
              </div>
              <div className="mt-2 text-lg font-black">{item.author.handle}</div>
              <div className="text-xs text-white/60">
                {info?.user.bio || (loading ? "loading…" : "creator on Loopit")}
              </div>

              {info && (
                <div className="mt-3 flex gap-5 text-sm">
                  <span>
                    <b className="text-white">{info.user.counts.playables}</b>
                    <span className="ml-1 text-white/60">playables</span>
                  </span>
                  <button
                    onClick={() => setFollowKind("followers")}
                    className="hover:text-pink-300"
                  >
                    <b className="text-white">{formatCount(info.user.counts.followers)}</b>
                    <span className="ml-1 text-white/60">followers</span>
                  </button>
                  <button
                    onClick={() => setFollowKind("following")}
                    className="hover:text-pink-300"
                  >
                    <b className="text-white">{formatCount(info.user.counts.following)}</b>
                    <span className="ml-1 text-white/60">following</span>
                  </button>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toggleFollow(item.author.handle)}
                  className={`flex-1 rounded-full py-2 text-sm font-bold transition active:scale-95 ${
                    item.author.isFollowing
                      ? "bg-white/10 text-white"
                      : "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 text-white shadow-lg shadow-pink-500/40"
                  }`}
                >
                  {item.author.isFollowing ? "Following" : "Follow"}
                </button>
                <button
                  onClick={openDm}
                  className="flex-1 rounded-full bg-white/10 py-2 text-sm font-bold text-white active:scale-95 transition"
                >
                  Message
                </button>
              </div>

              <div className="mt-5 mb-4 text-xs font-bold uppercase tracking-wider text-white/50">
                Playables
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(info?.playables ?? [item]).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onOpenPlayable?.(p);
                      onClose();
                    }}
                    className="relative aspect-[3/4] overflow-hidden rounded-md text-left"
                  >
                    <PlayableThumb kind={p.kind as PlayableKind} theme={p.theme} />
                    <div className="absolute bottom-1 left-1 rounded bg-black/40 px-1 text-[10px] font-bold text-white/90 drop-shadow backdrop-blur-sm">
                      ▶ {formatCount(p.stats.plays)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <FollowListSheet
            open={followKind !== null}
            handle={item.author.handle}
            kind={followKind}
            onClose={() => setFollowKind(null)}
          />
          <ConversationView
            open={convId !== null}
            conversationId={convId}
            peerHandle={item.author.handle}
            onClose={() => setConvId(null)}
          />
        </>
      )}
    </AnimatePresence>
  );
}
