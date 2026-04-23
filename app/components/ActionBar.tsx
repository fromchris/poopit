"use client";

import { motion } from "framer-motion";
import type { Playable } from "@/app/lib/types";
import { formatCount } from "@/app/lib/mockData";
import { useStore } from "@/app/lib/store";
import {
  HeartIcon,
  CommentIcon,
  RemixIcon,
  ShareIcon,
  PlusIcon,
  DotsIcon,
} from "./Icons";

type Props = {
  item: Playable;
  onLike: () => void;
  onComment: () => void;
  onRemix: () => void;
  onShare: () => void;
  onAuthorClick: () => void;
  onMore: () => void;
};

/**
 * Horizontal action bar — phone-native layout. Sits under the caption,
 * above the bottom tabs. Avatar + follow on the left, engagement actions
 * spread across the right. All buttons are thumb-zone, all equal size.
 */
export function ActionBar({
  item,
  onLike,
  onComment,
  onRemix,
  onShare,
  onAuthorClick,
  onMore,
}: Props) {
  const toggleFollow = useStore((s) => s.toggleFollow);
  const liked = !!item.liked;
  const followed = !!item.author.isFollowing;

  return (
    <div className="absolute inset-x-0 bottom-20 z-20 flex items-center justify-between gap-2 px-3 py-1">
      {/* Author chip */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative flex-none">
          <button
            onClick={onAuthorClick}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-xl ring-2 ring-white/90 ${item.author.avatarBg} active:scale-95 transition`}
          >
            {item.author.avatar}
          </button>
          {!followed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFollow(item.author.handle);
              }}
              className="absolute -bottom-1 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-rose-500 text-white shadow"
            >
              <PlusIcon className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <BarBtn onClick={onLike} active={liked} label={formatCount(item.stats.likes)}>
          <motion.span
            animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className={liked ? "text-rose-500" : "text-white"}
          >
            <HeartIcon filled={liked} className="h-6 w-6" />
          </motion.span>
        </BarBtn>
        <BarBtn onClick={onComment} label={formatCount(item.stats.comments)}>
          <CommentIcon className="h-6 w-6 text-white" />
        </BarBtn>
        <BarBtn onClick={onRemix} label={formatCount(item.stats.remixes)} accent>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 shadow-md shadow-pink-500/30">
            <RemixIcon className="h-5 w-5 text-white" />
          </div>
        </BarBtn>
        <BarBtn onClick={onShare}>
          <ShareIcon className="h-6 w-6 text-white" />
        </BarBtn>
        <BarBtn onClick={onMore}>
          <DotsIcon className="h-5 w-5 text-white" />
        </BarBtn>
      </div>
    </div>
  );
}

function BarBtn({
  children,
  label,
  onClick,
  active,
  accent,
}: {
  children: React.ReactNode;
  label?: string;
  onClick: () => void;
  active?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-w-10 flex-col items-center justify-center gap-0 px-1.5 active:scale-95 transition"
    >
      {children}
      {label !== undefined && (
        <span
          className={`text-[10px] font-semibold tabular-nums leading-tight drop-shadow ${
            active ? "text-rose-400" : accent ? "text-pink-200" : "text-white/90"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
}
