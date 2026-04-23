"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api } from "@/app/lib/api";
import { useStore } from "@/app/lib/store";
import { XIcon } from "./Icons";

type Message = {
  id: string;
  body: string;
  fromMe: boolean;
  sender: { handle: string; avatar: string; avatarBg: string };
  timeAgo: string;
  createdAt: string;
};

export function ConversationView({
  open,
  conversationId,
  peerHandle,
  onClose,
}: {
  open: boolean;
  conversationId: string | null;
  peerHandle: string | null;
  onClose: () => void;
}) {
  const toast = useStore((s) => s.toast);
  const [items, setItems] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !conversationId) return;
    setItems([]);
    setLoading(true);
    api<{ items: Message[] }>(`/api/conversations/${conversationId}/messages?limit=80`)
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, conversationId]);

  // SSE subscription for live incoming messages.
  useEffect(() => {
    if (!open || !conversationId) return;
    const es = new EventSource(`/api/conversations/${conversationId}/stream`);
    es.addEventListener("message", (ev) => {
      try {
        const m = JSON.parse((ev as MessageEvent).data) as Message;
        setItems((arr) =>
          arr.some((x) => x.id === m.id) ? arr : [...arr, m]
        );
      } catch {}
    });
    return () => es.close();
  }, [open, conversationId]);

  // Auto-scroll to newest.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items.length]);

  const send = async () => {
    if (!conversationId || !text.trim() || sending) return;
    setSending(true);
    try {
      const r = await api<{ message: Message }>(
        `/api/conversations/${conversationId}/messages`,
        { body: { body: text.trim() } }
      );
      setItems((arr) => [...arr, r.message]);
      setText("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && conversationId && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 260 }}
          className="absolute inset-0 z-[75] flex flex-col bg-black"
        >
          <div className="flex items-center gap-3 border-b border-white/5 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
            <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
              <XIcon className="h-4 w-4" />
            </button>
            <div className="flex-1 text-center text-[14px] font-bold">{peerHandle}</div>
            <div className="w-8" />
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {loading && items.length === 0 && (
              <div className="py-10 text-center text-sm text-white/50 animate-shimmer">
                Loading…
              </div>
            )}
            {items.length === 0 && !loading && (
              <div className="py-10 text-center text-sm text-white/50">
                Say hi to {peerHandle} 👋
              </div>
            )}
            {items.map((m) => (
              <div
                key={m.id}
                className={`mb-2 flex ${m.fromMe ? "justify-end" : "justify-start"} gap-2`}
              >
                {!m.fromMe && (
                  <div
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br text-sm ${m.sender.avatarBg}`}
                  >
                    {m.sender.avatar}
                  </div>
                )}
                <div
                  className={`max-w-[72%] rounded-2xl px-3 py-2 text-[14px] leading-snug break-words ${
                    m.fromMe
                      ? "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-white"
                      : "bg-white/[0.08] text-white"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-white/5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Message"
              className="flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-pink-500/60 focus:outline-none"
              disabled={sending}
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
