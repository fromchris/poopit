"use client";

import { useEffect, useState } from "react";
import { useStore, type Notification } from "@/app/lib/store";
import { useT } from "@/app/lib/i18n";
import { api } from "@/app/lib/api";
import type { Playable } from "@/app/lib/types";
import {
  HeartIcon,
  CommentIcon,
  RemixIcon,
  SparkIcon,
  UserIcon,
  FlagIcon,
} from "./Icons";
import { MessagesList } from "./MessagesList";
import { ConversationView } from "./ConversationView";

type OuterTab = "notifications" | "messages";
const SUBTABS: { id: "all" | "like" | "comment" | "follow"; labelKey: string }[] = [
  { id: "all", labelKey: "inbox.tab.all" },
  { id: "like", labelKey: "inbox.tab.likes" },
  { id: "comment", labelKey: "inbox.tab.comments" },
  { id: "follow", labelKey: "inbox.tab.follows" },
];

export function InboxScreen({
  onOpenPlayable,
}: {
  onOpenPlayable?: (p: Playable) => void;
}) {
  const notifications = useStore((s) => s.notifications);
  const loadNotifications = useStore((s) => s.loadNotifications);
  const markAllRead = useStore((s) => s.markAllRead);
  const me = useStore((s) => s.me);
  const t = useT();
  const [outer, setOuter] = useState<OuterTab>("notifications");
  const [inner, setInner] = useState<(typeof SUBTABS)[number]["id"]>("all");
  const [loading, setLoading] = useState(false);

  const [convId, setConvId] = useState<string | null>(null);
  const [convPeer, setConvPeer] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    setLoading(true);
    loadNotifications()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadNotifications, me]);

  const filtered = notifications.filter((n) => {
    if (inner === "all") return true;
    return n.type === inner;
  });

  useEffect(() => {
    if (!me || notifications.length === 0) return;
    const to = setTimeout(() => markAllRead(), 1500);
    return () => clearTimeout(to);
  }, [markAllRead, me, notifications.length]);

  const jumpTo = async (playableId: string) => {
    try {
      const r = await api<{ playable: Playable }>(`/api/playables/${playableId}`);
      onOpenPlayable?.(r.playable);
    } catch {}
  };

  if (!me) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-black p-8 text-center text-white/60">
        <div className="text-5xl">📬</div>
        <div className="text-lg font-bold text-white">{t("inbox.signIn")}</div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-y-auto bg-black pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="sticky top-0 z-10 bg-black/85 px-5 pb-3 pt-4 backdrop-blur">
        <h1 className="text-xl font-black tracking-tight">{t("inbox.title")}</h1>
        <div className="mt-3 flex gap-2">
          <OuterTabBtn
            active={outer === "notifications"}
            label={t("inbox.title")}
            onClick={() => setOuter("notifications")}
          />
          <OuterTabBtn
            active={outer === "messages"}
            label="Messages"
            onClick={() => setOuter("messages")}
          />
        </div>
        {outer === "notifications" && (
          <div className="scroll-area mt-3 flex gap-2 overflow-x-auto">
            {SUBTABS.map((s) => (
              <button
                key={s.id}
                onClick={() => setInner(s.id)}
                className={`flex-none rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  inner === s.id
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        )}
      </div>

      {outer === "notifications" ? (
        <div className="divide-y divide-white/5">
          {loading && notifications.length === 0 ? (
            <InboxSkeleton />
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-white/50">{t("inbox.empty")}</div>
          ) : (
            filtered.map((n) => <Row key={n.id} n={n} t={t} onJump={jumpTo} />)
          )}
        </div>
      ) : (
        <MessagesList
          onOpen={(id, handle) => {
            setConvId(id);
            setConvPeer(handle);
          }}
        />
      )}

      <ConversationView
        open={convId !== null}
        conversationId={convId}
        peerHandle={convPeer}
        onClose={() => setConvId(null)}
      />
    </div>
  );
}

function OuterTabBtn({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full px-3 py-2 text-sm font-bold transition ${
        active ? "bg-white text-black" : "bg-white/10 text-white/70"
      }`}
    >
      {label}
    </button>
  );
}

function InboxSkeleton() {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3">
          <div className="h-11 w-11 flex-none rounded-full bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

type NotificationWithTarget = Notification & { targetId?: string };

function Row({
  n,
  t,
  onJump,
}: {
  n: Notification;
  t: ReturnType<typeof useT>;
  onJump: (playableId: string) => void;
}) {
  // The wire shape doesn't include targetId, but we can still deep-link from
  // generation_ready by looking up latest playables. For now, highlight the
  // row and let Feed handle the rest via SSE toast.
  const targetId = (n as NotificationWithTarget).targetId;
  const clickable =
    !!targetId && (n.type === "generation_ready" || n.type === "like" || n.type === "comment" || n.type === "remix");
  const Tag = clickable ? "button" : "div";
  return (
    <Tag
      onClick={clickable ? () => onJump(targetId!) : undefined}
      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition ${
        clickable ? "hover:bg-white/5" : ""
      }`}
    >
      <div
        className={`relative flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br text-xl ${n.avatarBg}`}
      >
        {n.avatar}
        <Badge type={n.type} />
      </div>
      <div className="flex-1">
        <div className="text-[14px] leading-snug">
          <span className="font-bold">{n.handle}</span>{" "}
          <span className="text-white/85">{action(n.type, t)}</span>
          {n.target && <span className="text-white/60"> · {n.target}</span>}
          <span className="ml-1 text-[11px] text-white/45">{n.timeAgo}</span>
        </div>
        {n.preview && (
          <div className="mt-0.5 line-clamp-1 text-[12px] text-white/60">
            “{n.preview}”
          </div>
        )}
      </div>
      {!n.read && <div className="h-2 w-2 flex-none rounded-full bg-pink-500" />}
      {n.type === "follow" && (
        <button className="flex-none rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
          {t("inbox.followBack")}
        </button>
      )}
      {clickable && <span className="text-white/40">›</span>}
    </Tag>
  );
}

function Badge({ type }: { type: string }) {
  const cls =
    "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-black";
  if (type === "like")
    return (
      <div className={`${cls} bg-rose-500`}>
        <HeartIcon filled className="h-3 w-3 text-white" />
      </div>
    );
  if (type === "comment")
    return (
      <div className={`${cls} bg-sky-500`}>
        <CommentIcon className="h-3 w-3 text-white" />
      </div>
    );
  if (type === "follow")
    return (
      <div className={`${cls} bg-emerald-500`}>
        <UserIcon filled className="h-3 w-3 text-white" />
      </div>
    );
  if (type === "remix")
    return (
      <div className={`${cls} bg-gradient-to-br from-pink-500 to-amber-400`}>
        <RemixIcon className="h-3 w-3 text-white" />
      </div>
    );
  if (type === "generation_ready")
    return (
      <div className={`${cls} bg-gradient-to-br from-fuchsia-500 to-amber-400`}>
        <SparkIcon className="h-3 w-3 text-white" />
      </div>
    );
  if (type === "generation_failed")
    return (
      <div className={`${cls} bg-rose-600`}>
        <FlagIcon className="h-3 w-3 text-white" />
      </div>
    );
  return (
    <div className={`${cls} bg-violet-500`}>
      <SparkIcon className="h-3 w-3 text-white" />
    </div>
  );
}

function action(type: string, t: ReturnType<typeof useT>): string {
  switch (type) {
    case "like":
      return t("inbox.action.like");
    case "comment":
      return t("inbox.action.comment");
    case "follow":
      return t("inbox.action.follow");
    case "remix":
      return t("inbox.action.remix");
    case "generation_ready":
      return t("inbox.action.generation_ready");
    case "generation_failed":
      return t("inbox.action.generation_failed");
    default:
      return "";
  }
}
