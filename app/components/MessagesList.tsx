"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/app/lib/api";

type Conversation = {
  id: string;
  peer: { handle: string; avatar: string; avatarBg: string } | null;
  lastMessage: { body: string; fromMe: boolean; timeAgo: string } | null;
  unread: number;
  lastMessageAt: string;
};

export function MessagesList({
  onOpen,
}: {
  onOpen: (convId: string, peerHandle: string) => void;
}) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api<{ items: Conversation[] }>("/api/conversations")
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading && items.length === 0) {
    return (
      <div className="divide-y divide-white/5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="h-12 w-12 flex-none rounded-full bg-white/[0.06] animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/2 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-2.5 w-3/4 rounded bg-white/[0.04] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-white/50">
        No messages yet. Tap "Message" on anyone's profile to start.
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {items.map((c) => (
        <motion.button
          key={c.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => c.peer && onOpen(c.id, c.peer.handle)}
          className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-white/[0.03]"
        >
          <div
            className={`flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br text-xl ${c.peer?.avatarBg ?? "from-zinc-700 to-zinc-900"}`}
          >
            {c.peer?.avatar ?? "👤"}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-baseline gap-2">
              <span className="truncate text-[14px] font-bold">
                {c.peer?.handle ?? "(deleted)"}
              </span>
              <span className="ml-auto flex-none text-[10px] text-white/45">
                {c.lastMessage?.timeAgo}
              </span>
            </div>
            <div className="truncate text-[12px] text-white/60">
              {c.lastMessage
                ? (c.lastMessage.fromMe ? "You: " : "") + c.lastMessage.body
                : "(no messages yet)"}
            </div>
          </div>
          {c.unread > 0 && (
            <span className="ml-1 flex h-2 w-2 flex-none rounded-full bg-pink-500" />
          )}
        </motion.button>
      ))}
    </div>
  );
}
