"use client";

import { motion } from "framer-motion";
import type { Playable } from "@/app/lib/types";
import { Playable as PlayableRenderer } from "@/app/playables";
import { formatCount } from "@/app/lib/mockData";
import { useStore } from "@/app/lib/store";
import {
  HeartIcon,
  CommentIcon,
  RemixIcon,
  ShareIcon,
  DotsIcon,
  PlusIcon,
} from "./Icons";

type Props = {
  item: Playable;
  active: boolean;
  onLike: () => void;
  onComment: () => void;
  onRemix: () => void;
  onShare: () => void;
  onAuthorClick: () => void;
  onTagClick: (tag: string) => void;
  onSourceClick: (sourceId: string) => void;
  onMore: () => void;
};

/**
 * Loopit-style layout:
 *
 *   ┌ page bg (black) ─────────────┐
 *   │ [TopBar: Following · For You]│  (rendered by Feed)
 *   │ ╭───────────────────────────╮│
 *   │ │                           ││
 *   │ │      PLAYABLE CARD        ││  rounded, themed bg
 *   │ │       (flex-1)            ││
 *   │ │                           ││
 *   │ ╰───────────────────────────╯│
 *   │ ❤ 12K  💬 312  🔁 1.4K   ↗ ⋯ │  action row (on page bg)
 *   │ 👤 @creator: caption…  Remix·77│  caption row
 *   │ [BottomTabs]                 │  (rendered by page)
 *   └──────────────────────────────┘
 */
export function FeedItem({
  item,
  active,
  onLike,
  onComment,
  onRemix,
  onShare,
  onAuthorClick,
  onTagClick,
  onSourceClick,
  onMore,
}: Props) {
  const toggleFollow = useStore((s) => s.toggleFollow);
  const liked = !!item.liked;
  const followed = !!item.author.isFollowing;
  const isDrama = item.kind === "interactive-drama";
  const isRemix = item.tags.includes("remix") || /^Remix:/i.test(item.title);
  const captionText = item.description || item.title;

  return (
    <section
      className="feed-item flex h-full w-full flex-col gap-2 bg-black px-3"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)",
        paddingBottom: "5.5rem",
      }}
    >
      {/* ── Rounded playable card ───────────────────────────── */}
      <div
        className={`relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br ${item.theme}`}
      >
        {!isDrama && item.kind !== "llm-bundle" && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.45)_100%)]" />
        )}
        <div className="relative h-full w-full">
          <PlayableRenderer kind={item.kind} active={active} src={item.src} />
        </div>
      </div>

      {/* ── Action row ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-5">
          <ActionBtn
            onClick={onLike}
            active={liked}
            count={formatCount(item.stats.likes)}
          >
            <motion.span
              animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={liked ? "text-rose-500" : "text-white"}
            >
              <HeartIcon filled={liked} className="h-6 w-6" />
            </motion.span>
          </ActionBtn>
          <ActionBtn
            onClick={onComment}
            count={formatCount(item.stats.comments)}
          >
            <CommentIcon className="h-6 w-6 text-white" />
          </ActionBtn>
          <ActionBtn
            onClick={onRemix}
            count={formatCount(item.stats.remixes)}
            accent
          >
            <RemixIcon className="h-6 w-6 text-white" />
          </ActionBtn>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onShare}
            aria-label="Share"
            className="flex h-8 w-8 items-center justify-center text-white active:scale-95 transition"
          >
            <ShareIcon className="h-6 w-6" />
          </button>
          <button
            onClick={onMore}
            aria-label="More"
            className="flex h-8 w-8 items-center justify-center text-white active:scale-95 transition"
          >
            <DotsIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Caption row ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 pl-1 pb-1">
        <button
          onClick={onAuthorClick}
          className="relative flex-none active:scale-95 transition"
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-lg ring-2 ring-white/80 ${item.author.avatarBg}`}
          >
            {item.author.avatar}
          </span>
          {!followed && (
            <span
              role="button"
              aria-label="Follow"
              onClick={(e) => {
                e.stopPropagation();
                toggleFollow(item.author.handle);
              }}
              className="absolute -bottom-1 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-rose-500 text-white shadow"
            >
              <PlusIcon className="h-2.5 w-2.5" />
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1 text-[13px] leading-tight">
          <div className="truncate text-white">
            <span className="font-bold">{item.author.handle}:</span>{" "}
            <span className="text-white/85">{captionText}</span>
          </div>
          {item.tags.length > 0 && (
            <div className="mt-0.5 flex flex-nowrap items-center gap-1.5 overflow-hidden">
              {item.tags.slice(0, 4).map((t) => (
                <button
                  key={t}
                  onClick={() => onTagClick(t)}
                  className="flex-none text-[11px] text-white/55 hover:text-white/85"
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
        {isRemix && (
          <button
            onClick={() => onSourceClick(item.id)}
            className="flex flex-none items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/90 backdrop-blur active:scale-95 transition"
          >
            <RemixIcon className="h-3 w-3" />
            Remix · {formatCount(item.stats.remixes)}
          </button>
        )}
      </div>
    </section>
  );
}

function ActionBtn({
  children,
  count,
  onClick,
  active,
  accent,
}: {
  children: React.ReactNode;
  count?: string;
  onClick: () => void;
  active?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 active:scale-95 transition"
    >
      {children}
      {count !== undefined && (
        <span
          className={`text-[13px] font-bold tabular-nums ${
            active ? "text-rose-400" : accent ? "text-pink-200" : "text-white/90"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
