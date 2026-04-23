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

export function ActionRail({
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
    <div className="pointer-events-none absolute right-1 bottom-24 z-20 flex flex-col items-center gap-3 [&>*]:pointer-events-auto">
      <div className="relative">
        <button
          onClick={onAuthorClick}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ring-2 ring-white ${item.author.avatarBg} text-2xl active:scale-95 transition`}
        >
          {item.author.avatar}
        </button>
        {!followed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFollow(item.author.handle);
            }}
            className="absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-rose-500 text-white shadow-md"
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        )}
      </div>

      <RailButton
        active={liked}
        onClick={onLike}
        label={formatCount(item.stats.likes)}
        icon={
          <motion.span
            animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={liked ? "text-rose-500" : "text-white"}
          >
            <HeartIcon filled={liked} className="h-8 w-8 drop-shadow-lg" />
          </motion.span>
        }
      />
      <RailButton
        onClick={onComment}
        label={formatCount(item.stats.comments)}
        icon={<CommentIcon className="h-8 w-8 text-white drop-shadow-lg" />}
      />
      <RailButton
        onClick={onRemix}
        label={formatCount(item.stats.remixes)}
        accent
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 shadow-lg shadow-pink-500/40">
            <RemixIcon className="h-6 w-6 text-white" />
          </div>
        }
      />
      <RailButton
        onClick={onShare}
        label="Share"
        icon={<ShareIcon className="h-8 w-8 text-white drop-shadow-lg" />}
      />
      <button
        onClick={onMore}
        aria-label="More"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur active:scale-95"
      >
        <DotsIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function RailButton({
  icon,
  label,
  onClick,
  active,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  accent?: boolean;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95 transition">
      {icon}
      <span
        className={`text-[11px] font-semibold tabular-nums drop-shadow ${
          active ? "text-rose-400" : accent ? "text-pink-200" : "text-white"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
