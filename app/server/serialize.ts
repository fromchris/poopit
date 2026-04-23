/**
 * Serializers that shape Prisma rows into the wire types consumed by the
 * client's zustand store. Keep output shape stable across API versions.
 */
import type { Comment, Notification, Playable, Tag, User } from "@prisma/client";
import type { PlayableKind } from "@/app/lib/types";

export type WireUser = {
  id: string;
  handle: string;
  avatar: string;
  avatarBg: string;
  bio?: string;
  isGuest?: boolean;
};

export type WirePlayable = {
  id: string;
  kind: PlayableKind;
  title: string;
  description: string;
  theme: string;
  src?: string;
  author: {
    handle: string;
    avatar: string;
    avatarBg: string;
    isFollowing: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    remixes: number;
    plays: number;
  };
  tags: string[];
  liked?: boolean;
  createdAt: string;
};

export type WireComment = {
  id: string;
  handle: string;
  avatar: string;
  avatarBg: string;
  body: string;
  likes: number;
  liked?: boolean;
  timeAgo: string;
};

export type WireNotification = {
  id: string;
  type: string;
  handle: string;
  avatar: string;
  avatarBg: string;
  target?: string;
  targetId?: string;
  preview?: string;
  timeAgo: string;
  read: boolean;
};

// ─── helpers ───

const AVATAR_BG_POOL = [
  "from-cyan-400 to-blue-500",
  "from-pink-400 to-purple-500",
  "from-yellow-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-slate-300 to-slate-500",
  "from-fuchsia-500 to-amber-400",
  "from-violet-400 to-fuchsia-500",
  "from-orange-400 to-rose-500",
];

export function avatarBgFor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_BG_POOL[Math.abs(hash) % AVATAR_BG_POOL.length]!;
}

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return date.toISOString().slice(0, 10);
}

// ─── serializers ───

type PlayableRow = Playable & {
  creator: User;
  tags: { tag: Tag }[];
  likes?: { userId: string }[];
  source?: Playable | null;
};

export function serializePlayable(
  p: PlayableRow,
  viewerId: string | null,
  followedHandles: Set<string> = new Set()
): WirePlayable {
  return {
    id: p.id,
    kind: p.kind as PlayableKind,
    title: p.title,
    description: p.description,
    theme: p.theme,
    src: p.bundleUrl ?? undefined,
    author: {
      handle: p.creator.handle,
      avatar: p.creator.avatar,
      avatarBg: avatarBgFor(p.creator.id),
      isFollowing: followedHandles.has(p.creator.handle),
    },
    stats: {
      likes: p.likeCount,
      comments: p.commentCount,
      remixes: p.remixCount,
      plays: p.playCount,
    },
    tags: p.tags.map((t) => t.tag.name),
    liked: viewerId ? (p.likes ?? []).some((l) => l.userId === viewerId) : false,
    createdAt: p.createdAt.toISOString(),
  };
}

type CommentRow = Comment & {
  author: User;
  likes?: { userId: string }[];
};

export function serializeComment(c: CommentRow, viewerId: string | null): WireComment {
  return {
    id: c.id,
    handle: c.author.handle,
    avatar: c.author.avatar,
    avatarBg: avatarBgFor(c.author.id),
    body: c.body,
    likes: c.likeCount,
    liked: viewerId ? (c.likes ?? []).some((l) => l.userId === viewerId) : false,
    timeAgo: timeAgo(c.createdAt),
  };
}

type NotificationRow = Notification & {
  actor?: User | null;
};

export function serializeNotification(n: NotificationRow): WireNotification {
  return {
    id: n.id,
    type: n.type,
    handle: n.actor?.handle ?? "Loopit",
    avatar: n.actor?.avatar ?? "✨",
    avatarBg: n.actor ? avatarBgFor(n.actor.id) : "from-pink-500 to-amber-400",
    target: n.targetTitle ?? undefined,
    targetId: n.targetId ?? undefined,
    preview: n.preview ?? undefined,
    timeAgo: timeAgo(n.createdAt),
    read: n.read,
  };
}
