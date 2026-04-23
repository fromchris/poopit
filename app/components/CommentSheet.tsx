"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Playable } from "@/app/lib/types";
import { useStore } from "@/app/lib/store";
import { HeartIcon, TrashIcon, XIcon } from "./Icons";
import { formatCount } from "@/app/lib/mockData";

export function CommentSheet({
  item,
  open,
  onClose,
}: {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
}) {
  const commentsMap = useStore((s) => s.comments);
  const loadComments = useStore((s) => s.loadComments);
  const addComment = useStore((s) => s.addComment);
  const toggleCommentLike = useStore((s) => s.toggleCommentLike);
  const deleteComment = useStore((s) => s.deleteComment);
  const me = useStore((s) => s.me);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const comments = item ? commentsMap[item.id] ?? [] : [];

  useEffect(() => {
    if (open && item) loadComments(item.id).catch(() => {});
  }, [open, item, loadComments]);

  const submit = async () => {
    if (!item || !text.trim() || busy) return;
    if (!me) {
      useStore.getState().toast("Sign in to comment");
      return;
    }
    setBusy(true);
    try {
      await addComment(item.id, text.trim());
      setText("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      useStore.getState().toast(msg);
    } finally {
      setBusy(false);
    }
  };

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
            className="absolute inset-x-0 bottom-0 z-50 flex max-h-[82%] flex-col rounded-t-3xl bg-zinc-950"
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/25" />
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <div className="text-base font-bold">
                {formatCount(item.stats.comments)} comments
              </div>
              <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="scroll-area flex-1 overflow-y-auto px-4 pb-3">
              {comments.length === 0 && (
                <div className="py-10 text-center text-sm text-white/50">
                  Be the first to comment.
                </div>
              )}
              {comments.map((c) => {
                const isMine = me?.handle === c.handle;
                return (
                  <div key={c.id} className="flex gap-3 py-3">
                    <div
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br text-lg ${c.avatarBg}`}
                    >
                      {c.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-white">{c.handle}</span>
                        {isMine && (
                          <span className="rounded bg-white/10 px-1 text-[10px] font-bold text-white/60">
                            you
                          </span>
                        )}
                        <span className="text-[11px] text-white/40">{c.timeAgo}</span>
                      </div>
                      <p className="mt-0.5 text-[14px] leading-snug text-white/90">{c.body}</p>
                      {isMine && (
                        <button
                          onClick={async () => {
                            try {
                              await deleteComment(item.id, c.id);
                            } catch {
                              useStore.getState().toast("Delete failed");
                            }
                          }}
                          className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-300/80 hover:text-rose-300"
                        >
                          <TrashIcon className="h-3 w-3" /> delete
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => toggleCommentLike(item.id, c.id)}
                      className="flex flex-col items-center gap-0.5"
                    >
                      <HeartIcon
                        filled={c.liked}
                        className={`h-4 w-4 ${c.liked ? "text-rose-500" : "text-white/40"}`}
                      />
                      <span
                        className={`text-[10px] tabular-nums ${
                          c.liked ? "text-rose-400" : "text-white/40"
                        }`}
                      >
                        {c.likes}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 border-t border-white/5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-lg">
                {me?.avatar ?? "✨"}
              </div>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder={me ? `Comment as ${me.handle}` : "Sign in to comment"}
                disabled={!me || busy}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-pink-500/60 focus:outline-none disabled:opacity-60"
              />
              <button
                onClick={submit}
                disabled={!text.trim() || !me || busy}
                className="rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                {busy ? "…" : "Post"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
