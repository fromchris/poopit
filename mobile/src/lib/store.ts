// Stripped RN port of the web store (app/lib/store.ts). Keeps the same
// action names + shape so screens ported later line up 1:1. Skipped for
// now: comments, notifications (SSE), publish, DMs, settings. Add as
// screens are ported.

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

type State = {
  booted: boolean;
  me: Me;
  feedTab: FeedTab;
  feed: Playable[];
  feedNextCursor: string | null;
  feedLoading: boolean;
  feedError: string | null;
  toasts: string[];
};

type Actions = {
  boot: () => Promise<void>;
  setFeedTab: (t: FeedTab) => Promise<void>;
  loadFeed: (reset?: boolean) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  toggleFollow: (handle: string) => Promise<void>;
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
  toasts: [],

  boot: async () => {
    try {
      try {
        const r = await api<{ user: Me }>("/api/auth/me");
        set({ me: r.user });
      } catch {
        // not signed in or backend unreachable — still try to show feed
      }
      await get().loadFeed(true);
    } finally {
      set({ booted: true });
    }
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
        `/api/feed?${qs.toString()}`,
      );
      set((s) => ({
        feed: reset ? r.items : [...s.feed, ...r.items],
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

  toast: (msg) => {
    set((s) => ({ toasts: [...s.toasts, msg] }));
    setTimeout(() => get().dismissToast(), 2800);
  },

  dismissToast: () => {
    set((s) => ({ toasts: s.toasts.slice(1) }));
  },
}));
