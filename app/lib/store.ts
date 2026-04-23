"use client";

import { create } from "zustand";
import type { Playable } from "./types";
import { api, ApiError } from "./api";

// ─── server wire types (mirror app/server/serialize.ts) ───

export type Me = {
  id: string;
  handle: string;
  avatar: string;
  bio: string;
  isGuest: boolean;
} | null;

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

export type FeedTab = "for-you" | "following";

// ─── state ───

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
  /** When true, feed chrome (action rail, bottom tabs) fades to pass taps through to the playable. */
  chromeDimmed: boolean;
};

type Actions = {
  boot: () => Promise<void>;
  signIn: (handle: string, password: string) => Promise<void>;
  signUp: (handle: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<{ recoveryCode: string }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { handle?: string; bio?: string; avatar?: string }) => Promise<void>;

  setFeedTab: (t: FeedTab) => Promise<void>;
  loadFeed: (reset?: boolean) => Promise<void>;

  toggleLike: (id: string) => Promise<void>;
  toggleFollow: (handle: string) => Promise<void>;

  loadComments: (playableId: string) => Promise<void>;
  addComment: (playableId: string, body: string) => Promise<void>;

  loadNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;

  publish: (input: {
    kind: string;
    title: string;
    description: string;
    theme: string;
    tags: string[];
    sourceId?: string | null;
    bundleUrl?: string;
  }) => Promise<Playable>;

  toast: (msg: string) => void;
  dismissToast: () => void;

  jumpToPlayable: (p: Playable) => void;
  clearJumpTo: () => void;
  removePlayable: (id: string) => void;
  hidePlayable: (id: string) => void;

  toggleCommentLike: (playableId: string, commentId: string) => Promise<void>;
  deleteComment: (playableId: string, commentId: string) => Promise<void>;

  setChromeDimmed: (dimmed: boolean) => void;

  subscribeNotifications: () => () => void;
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
  chromeDimmed: false,

  boot: async () => {
    try {
      const r = await api<{ user: Me }>("/api/auth/me");
      set({ me: r.user });
      if (r.user) {
        await get().loadFeed(true);
        await get().loadNotifications();
      } else {
        await get().loadFeed(true);
      }
    } finally {
      set({ booted: true });
    }
  },

  signIn: async (handle, password) => {
    const r = await api<{ user: Me }>("/api/auth/signin", { body: { handle, password } });
    set({ me: r.user });
    await get().loadFeed(true);
    await get().loadNotifications();
  },

  signUp: async (handle, password) => {
    const r = await api<{ user: Me }>("/api/auth/signup", { body: { handle, password } });
    set({ me: r.user });
    await get().loadFeed(true);
    await get().loadNotifications();
  },

  signInAsGuest: async () => {
    const r = await api<{ user: Me; recoveryCode: string }>("/api/auth/guest", { body: {} });
    set({ me: r.user });
    await get().loadFeed(true);
    await get().loadNotifications();
    return { recoveryCode: r.recoveryCode };
  },

  signOut: async () => {
    await api("/api/auth/signout", { body: {} });
    set({
      me: null,
      feed: [],
      comments: {},
      notifications: [],
      unread: 0,
      likedPlayableIds: [],
      remixedPlayableIds: [],
    });
    await get().loadFeed(true);
  },

  updateProfile: async (patch) => {
    const r = await api<{ user: Me }>("/api/auth/me", { method: "PATCH", body: patch });
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
      const r = await api<{ items: Playable[]; nextCursor: string | null }>(
        `/api/feed?${qs.toString()}`
      );
      const hidden = get().hiddenIds;
      const fresh = r.items.filter((p) => !hidden[p.id]);
      set((s) => ({
        feed: reset ? fresh : [...s.feed, ...fresh],
        feedNextCursor: r.nextCursor,
      }));
    } catch (err) {
      set({ feedError: err instanceof Error ? err.message : "Failed to load feed" });
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
    // optimistic
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
          : p
      ),
      likedPlayableIds: wasLiked
        ? s.likedPlayableIds.filter((x) => x !== id)
        : [id, ...s.likedPlayableIds.filter((x) => x !== id)],
    }));
    try {
      if (wasLiked) {
        await api(`/api/playables/${id}/like`, { method: "DELETE" });
      } else {
        await api(`/api/playables/${id}/like`, { method: "POST", body: {} });
      }
    } catch (err) {
      // rollback
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
            : p
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
    const current = get().feed.find((p) => p.author.handle === handle);
    const wasFollowing = !!current?.author.isFollowing;
    set((s) => ({
      feed: s.feed.map((p) =>
        p.author.handle === handle
          ? { ...p, author: { ...p.author, isFollowing: !wasFollowing } }
          : p
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
            : p
        ),
      }));
      if (err instanceof ApiError) get().toast(err.message);
    }
  },

  loadComments: async (playableId) => {
    const r = await api<{ items: Comment[] }>(`/api/playables/${playableId}/comments`);
    set((s) => ({ comments: { ...s.comments, [playableId]: r.items } }));
  },

  addComment: async (playableId, body) => {
    const r = await api<{ comment: Comment }>(`/api/playables/${playableId}/comments`, {
      body: { body },
    });
    set((s) => ({
      comments: {
        ...s.comments,
        [playableId]: [r.comment, ...(s.comments[playableId] ?? [])],
      },
      feed: s.feed.map((p) =>
        p.id === playableId
          ? { ...p, stats: { ...p.stats, comments: p.stats.comments + 1 } }
          : p
      ),
    }));
  },

  loadNotifications: async () => {
    if (!get().me) return;
    try {
      const r = await api<{ items: Notification[]; unread: number }>("/api/notifications");
      set({ notifications: r.items, unread: r.unread });
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    if (!get().me) return;
    try {
      await api("/api/notifications/read", { body: {} });
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unread: 0,
      }));
    } catch {
      // ignore
    }
  },

  publish: async (input) => {
    const r = await api<{ playable: Playable }>("/api/playables", {
      body: input,
    });
    set((s) => ({ feed: [r.playable, ...s.feed] }));
    if (input.sourceId) {
      set((s) => ({
        remixedPlayableIds: [r.playable.id, ...s.remixedPlayableIds],
      }));
    }
    return r.playable;
  },

  toast: (msg) => {
    set((s) => ({ toasts: [...s.toasts.slice(-4), msg] }));
    setTimeout(() => get().dismissToast(), 2200);
  },

  dismissToast: () => set((s) => ({ toasts: s.toasts.slice(1) })),

  setChromeDimmed: (dimmed) => set({ chromeDimmed: dimmed }),

  jumpToPlayable: (p) =>
    set((s) => {
      // Ensure the playable is in the feed; prepend if new.
      const existing = s.feed.find((x) => x.id === p.id);
      const feed = existing ? s.feed : [p, ...s.feed];
      return { feed, feedJumpToId: p.id };
    }),

  clearJumpTo: () => set({ feedJumpToId: null }),

  removePlayable: (id) =>
    set((s) => ({
      feed: s.feed.filter((p) => p.id !== id),
    })),

  hidePlayable: (id) =>
    set((s) => ({
      hiddenIds: { ...s.hiddenIds, [id]: true },
      feed: s.feed.filter((p) => p.id !== id),
    })),

  toggleCommentLike: async (playableId, commentId) => {
    if (!get().me) {
      get().toast("Sign in to like");
      return;
    }
    // Optimistic
    const list = get().comments[playableId] ?? [];
    const prev = list.find((c) => c.id === commentId);
    if (!prev) return;
    const wasLiked = !!prev.liked;
    set((s) => ({
      comments: {
        ...s.comments,
        [playableId]: (s.comments[playableId] ?? []).map((c) =>
          c.id === commentId
            ? { ...c, liked: !wasLiked, likes: c.likes + (wasLiked ? -1 : 1) }
            : c
        ),
      },
    }));
    try {
      if (wasLiked) {
        await api(`/api/comments/${commentId}/like`, { method: "DELETE" });
      } else {
        await api(`/api/comments/${commentId}/like`, { method: "POST", body: {} });
      }
    } catch {
      // rollback
      set((s) => ({
        comments: {
          ...s.comments,
          [playableId]: (s.comments[playableId] ?? []).map((c) =>
            c.id === commentId
              ? { ...c, liked: wasLiked, likes: c.likes + (wasLiked ? 1 : -1) }
              : c
          ),
        },
      }));
    }
  },

  deleteComment: async (playableId, commentId) => {
    await api(`/api/comments/${commentId}`, { method: "DELETE" });
    set((s) => ({
      comments: {
        ...s.comments,
        [playableId]: (s.comments[playableId] ?? []).filter((c) => c.id !== commentId),
      },
      feed: s.feed.map((p) =>
        p.id === playableId
          ? { ...p, stats: { ...p.stats, comments: Math.max(0, p.stats.comments - 1) } }
          : p
      ),
    }));
  },

  subscribeNotifications: () => {
    if (typeof window === "undefined") return () => {};
    if (!get().me) return () => {};
    const es = new EventSource("/api/notifications/stream");
    let cancelled = false;
    // Dedup: the server-side poll may deliver the same notification again if
    // the cursor doesn't advance cleanly. Also guards against reconnect replays.
    const seenIds = new Set<string>();
    es.addEventListener("notification", (ev) => {
      if (cancelled) return;
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        if (!data?.id || seenIds.has(data.id)) return;
        seenIds.add(data.id);
        // Keep the set bounded.
        if (seenIds.size > 200) {
          const first = seenIds.values().next().value;
          if (first) seenIds.delete(first);
        }
        const actor = data.actor?.handle ?? "Loopit";
        const verb =
          data.type === "like"
            ? "liked your playable"
            : data.type === "comment"
            ? "commented"
            : data.type === "follow"
            ? "followed you"
            : data.type === "remix"
            ? "remixed"
            : data.type === "generation_ready"
            ? `"${data.targetTitle ?? "Your playable"}" is ready`
            : data.type === "generation_failed"
            ? "Generation failed"
            : "";
        if (verb) {
          // For our own generation results, don't prefix with handle.
          const msg =
            data.type === "generation_ready" || data.type === "generation_failed"
              ? verb
              : `${actor} ${verb}`;
          get().toast(msg);
        }
        get().loadNotifications().catch(() => {});
      } catch {}
    });
    es.addEventListener("badge", (ev) => {
      if (cancelled) return;
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        if (typeof data.unread === "number") set({ unread: data.unread });
      } catch {}
    });
    es.onerror = () => {
      // EventSource reconnects automatically; just swallow log spam.
    };
    return () => {
      cancelled = true;
      es.close();
    };
  },
}));
