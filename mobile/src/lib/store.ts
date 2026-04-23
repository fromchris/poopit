// RN port of app/lib/store.ts. Action names + shapes mirror the web
// store so ported screens line up 1:1. Skipped: DMs/conversations
// (the UI for those was skipped too), setChromeDimmed (not relevant
// when the native bottom tabs aren't absolutely-positioned over the
// playable).

import { create } from "zustand";
import { api, ApiError } from "./api";
import type { Playable } from "./types";

export type Me = {
  id: string;
  handle: string;
  avatar: string;
  bio: string;
  isGuest: boolean;
} | null;

export type FeedTab = "for-you" | "following";

export type Comment = {
  id: string;
  handle: string;
  avatar: string;
  avatarBg: string;
  body: string;
  likes: number;
  liked?: boolean;
  timeAgo: string;
};

export type Notification = {
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

type State = {
  booted: boolean;
  me: Me;
  feedTab: FeedTab;
  feed: Playable[];
  feedNextCursor: string | null;
  feedLoading: boolean;
  feedError: string | null;
  feedJumpToId: string | null;
  comments: Record<string, Comment[]>;
  notifications: Notification[];
  unread: number;
  likedPlayableIds: string[];
  remixedPlayableIds: string[];
  hiddenIds: Record<string, true>;
  toasts: string[];
};

type Actions = {
  boot: () => Promise<void>;
  signIn: (handle: string, password: string) => Promise<void>;
  signUp: (handle: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<{ recoveryCode: string }>;
  signOut: () => Promise<void>;
  updateProfile: (
    patch: { handle?: string; bio?: string; avatar?: string },
  ) => Promise<void>;

  setFeedTab: (t: FeedTab) => Promise<void>;
  loadFeed: (reset?: boolean) => Promise<void>;

  toggleLike: (id: string) => Promise<void>;
  toggleFollow: (handle: string) => Promise<void>;

  loadComments: (playableId: string) => Promise<void>;
  addComment: (playableId: string, body: string) => Promise<void>;
  toggleCommentLike: (playableId: string, commentId: string) => Promise<void>;
  deleteComment: (playableId: string, commentId: string) => Promise<void>;

  loadNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;

  removePlayable: (id: string) => void;
  hidePlayable: (id: string) => void;

  startGenerate: (
    prompt: string,
    sourceId?: string | null,
    attachments?: Array<{ kind: "image" | "video"; url: string; mime: string }>,
  ) => Promise<{ jobId: string } | null>;

  toast: (msg: string) => void;
  dismissToast: () => void;
};

export const useStore = create<State & Actions>((set, get) => ({
  booted: false,
  me: null,
  feedTab: "for-you",
  feed: [],
  feedNextCursor: null,
  feedLoading: false,
  feedError: null,
  feedJumpToId: null,
  comments: {},
  notifications: [],
  unread: 0,
  likedPlayableIds: [],
  remixedPlayableIds: [],
  hiddenIds: {},
  toasts: [],

  boot: async () => {
    try {
      try {
        const r = await api<{ user: Me }>("/api/auth/me");
        set({ me: r.user });
        if (r.user) {
          await get().loadNotifications();
        }
      } catch {}
      await get().loadFeed(true);
    } finally {
      set({ booted: true });
    }
  },

  signIn: async (handle, password) => {
    const r = await api<{ user: Me }>("/api/auth/signin", {
      body: { handle, password },
    });
    set({ me: r.user });
    await get().loadFeed(true);
    await get().loadNotifications();
  },

  signUp: async (handle, password) => {
    const r = await api<{ user: Me }>("/api/auth/signup", {
      body: { handle, password },
    });
    set({ me: r.user });
    await get().loadFeed(true);
    await get().loadNotifications();
  },

  signInAsGuest: async () => {
    const r = await api<{ user: Me; recoveryCode: string }>(
      "/api/auth/guest",
      { body: {} },
    );
    set({ me: r.user });
    await get().loadFeed(true);
    await get().loadNotifications();
    return { recoveryCode: r.recoveryCode };
  },

  signOut: async () => {
    try {
      await api("/api/auth/signout", { body: {} });
    } catch {}
    set({
      me: null,
      comments: {},
      notifications: [],
      unread: 0,
      likedPlayableIds: [],
      remixedPlayableIds: [],
    });
    await get().loadFeed(true);
  },

  updateProfile: async (patch) => {
    const r = await api<{ user: Me }>("/api/auth/me", {
      method: "PATCH",
      body: patch,
    });
    set({ me: r.user });
  },

  setFeedTab: async (t) => {
    set({ feedTab: t, feed: [], feedNextCursor: null });
    await get().loadFeed(true);
  },

  loadFeed: async (reset = false) => {
    const tab = get().feedTab;
    const cursor = reset ? null : get().feedNextCursor;
    set({ feedLoading: true, feedError: null });
    try {
      const qs = new URLSearchParams({ tab });
      if (cursor) qs.set("cursor", cursor);
      const r = await api<{
        items: Playable[];
        nextCursor: string | null;
      }>(`/api/feed?${qs.toString()}`);
      const hidden = get().hiddenIds;
      const fresh = r.items.filter((p) => !hidden[p.id]);
      set((s) => ({
        feed: reset ? fresh : [...s.feed, ...fresh],
        feedNextCursor: r.nextCursor,
      }));
    } catch (err) {
      set({
        feedError:
          err instanceof Error ? err.message : "Failed to load feed",
      });
    } finally {
      set({ feedLoading: false });
    }
  },

  toggleLike: async (id) => {
    const me = get().me;
    if (!me) {
      get().toast("Sign in to like");
      return;
    }
    const current = get().feed.find((p) => p.id === id);
    const wasLiked = !!current?.liked;
    set((s) => ({
      feed: s.feed.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !wasLiked,
              stats: {
                ...p.stats,
                likes: p.stats.likes + (wasLiked ? -1 : 1),
              },
            }
          : p,
      ),
    }));
    try {
      if (wasLiked) {
        await api(`/api/playables/${id}/like`, { method: "DELETE" });
      } else {
        await api(`/api/playables/${id}/like`, { method: "POST", body: {} });
      }
    } catch (err) {
      set((s) => ({
        feed: s.feed.map((p) =>
          p.id === id
            ? {
                ...p,
                liked: wasLiked,
                stats: {
                  ...p.stats,
                  likes: p.stats.likes + (wasLiked ? 1 : -1),
                },
              }
            : p,
        ),
      }));
      if (err instanceof ApiError) get().toast(err.message);
    }
  },

  toggleFollow: async (handle) => {
    const me = get().me;
    if (!me) {
      get().toast("Sign in to follow");
      return;
    }
    const prev = get().feed.find((p) => p.author.handle === handle);
    const wasFollowing = !!prev?.author.isFollowing;
    set((s) => ({
      feed: s.feed.map((p) =>
        p.author.handle === handle
          ? { ...p, author: { ...p.author, isFollowing: !wasFollowing } }
          : p,
      ),
    }));
    try {
      const url = `/api/users/${encodeURIComponent(handle)}/follow`;
      if (wasFollowing) await api(url, { method: "DELETE" });
      else await api(url, { method: "POST", body: {} });
    } catch (err) {
      set((s) => ({
        feed: s.feed.map((p) =>
          p.author.handle === handle
            ? { ...p, author: { ...p.author, isFollowing: wasFollowing } }
            : p,
        ),
      }));
      if (err instanceof ApiError) get().toast(err.message);
    }
  },

  loadComments: async (playableId) => {
    try {
      const r = await api<{ items: Comment[] }>(
        `/api/playables/${playableId}/comments`,
      );
      set((s) => ({ comments: { ...s.comments, [playableId]: r.items } }));
    } catch (err) {
      if (err instanceof ApiError) get().toast(err.message);
    }
  },

  addComment: async (playableId, body) => {
    const me = get().me;
    if (!me) {
      get().toast("Sign in to comment");
      return;
    }
    try {
      const r = await api<{ comment: Comment }>(
        `/api/playables/${playableId}/comments`,
        { body: { body } },
      );
      set((s) => ({
        comments: {
          ...s.comments,
          [playableId]: [r.comment, ...(s.comments[playableId] ?? [])],
        },
        feed: s.feed.map((p) =>
          p.id === playableId
            ? {
                ...p,
                stats: { ...p.stats, comments: p.stats.comments + 1 },
              }
            : p,
        ),
      }));
    } catch (err) {
      if (err instanceof ApiError) get().toast(err.message);
    }
  },

  toggleCommentLike: async (playableId, commentId) => {
    const me = get().me;
    if (!me) return;
    const list = get().comments[playableId] ?? [];
    const c = list.find((x) => x.id === commentId);
    if (!c) return;
    const wasLiked = !!c.liked;
    set((s) => ({
      comments: {
        ...s.comments,
        [playableId]: list.map((x) =>
          x.id === commentId
            ? {
                ...x,
                liked: !wasLiked,
                likes: x.likes + (wasLiked ? -1 : 1),
              }
            : x,
        ),
      },
    }));
    try {
      if (wasLiked) {
        await api(`/api/comments/${commentId}/like`, { method: "DELETE" });
      } else {
        await api(`/api/comments/${commentId}/like`, {
          method: "POST",
          body: {},
        });
      }
    } catch {
      set((s) => ({
        comments: {
          ...s.comments,
          [playableId]: (s.comments[playableId] ?? []).map((x) =>
            x.id === commentId
              ? {
                  ...x,
                  liked: wasLiked,
                  likes: x.likes + (wasLiked ? 1 : -1),
                }
              : x,
          ),
        },
      }));
    }
  },

  deleteComment: async (playableId, commentId) => {
    try {
      await api(`/api/comments/${commentId}`, { method: "DELETE" });
      set((s) => ({
        comments: {
          ...s.comments,
          [playableId]: (s.comments[playableId] ?? []).filter(
            (c) => c.id !== commentId,
          ),
        },
        feed: s.feed.map((p) =>
          p.id === playableId
            ? {
                ...p,
                stats: {
                  ...p.stats,
                  comments: Math.max(0, p.stats.comments - 1),
                },
              }
            : p,
        ),
      }));
    } catch (err) {
      if (err instanceof ApiError) get().toast(err.message);
    }
  },

  loadNotifications: async () => {
    try {
      const r = await api<{ items: Notification[]; unread: number }>(
        "/api/notifications",
      );
      set({ notifications: r.items, unread: r.unread });
    } catch {}
  },

  markAllRead: async () => {
    try {
      await api("/api/notifications/read", { body: {} });
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unread: 0,
      }));
    } catch {}
  },

  removePlayable: (id) => {
    set((s) => ({ feed: s.feed.filter((p) => p.id !== id) }));
  },

  hidePlayable: (id) => {
    set((s) => ({
      hiddenIds: { ...s.hiddenIds, [id]: true },
      feed: s.feed.filter((p) => p.id !== id),
    }));
  },

  startGenerate: async (prompt, sourceId, attachments) => {
    const me = get().me;
    if (!me) {
      get().toast("Sign in to generate");
      return null;
    }
    try {
      const r = await api<{ jobId: string; status: string }>(
        "/api/generate",
        {
          body: {
            prompt,
            sourceId: sourceId ?? null,
            mode: "code",
            attachments: attachments?.length
              ? attachments.map((a) => ({
                  kind: a.kind,
                  url: a.url,
                  mime: a.mime,
                }))
              : undefined,
          },
        },
      );
      get().toast("Generating · ping in Inbox when ready");
      return { jobId: r.jobId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't generate";
      get().toast(msg);
      return null;
    }
  },

  toast: (msg) => {
    set((s) => ({ toasts: [...s.toasts, msg] }));
    setTimeout(() => get().dismissToast(), 2800);
  },

  dismissToast: () => {
    set((s) => ({ toasts: s.toasts.slice(1) }));
  },
}));
