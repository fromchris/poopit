"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Playable } from "@/app/lib/types";
import { useStore } from "@/app/lib/store";
import { api } from "@/app/lib/api";
import { FeedItem } from "./FeedItem";
import { TopBar } from "./TopBar";
import { RemixSheet } from "./RemixSheet";
import { CommentSheet } from "./CommentSheet";
import { ShareSheet } from "./ShareSheet";
import { AuthorSheet } from "./AuthorSheet";
import { OverflowSheet } from "./OverflowSheet";
import { ReportSheet } from "./ReportSheet";
import { RetryIcon } from "./Icons";

type OpenSheet = null | "comments" | "share" | "remix" | "author" | "more" | "report";

export function Feed({
  onOpenSearch,
  onStartRemix,
  onTagClick,
  onOpenPlayable,
}: {
  onOpenSearch: () => void;
  onStartRemix: (source: Playable, prompt: string) => void;
  onTagClick: (tag: string) => void;
  onOpenPlayable: (p: Playable) => void;
}) {
  const feed = useStore((s) => s.feed);
  const feedTab = useStore((s) => s.feedTab);
  const loading = useStore((s) => s.feedLoading);
  const nextCursor = useStore((s) => s.feedNextCursor);
  const feedError = useStore((s) => s.feedError);
  const feedJumpToId = useStore((s) => s.feedJumpToId);
  const loadFeed = useStore((s) => s.loadFeed);
  const toggleLike = useStore((s) => s.toggleLike);
  const removePlayable = useStore((s) => s.removePlayable);
  const hidePlayable = useStore((s) => s.hidePlayable);
  const clearJumpTo = useStore((s) => s.clearJumpTo);
  const toast = useStore((s) => s.toast);

  const [activeIdx, setActiveIdx] = useState(0);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const playPingedRef = useRef<Set<string>>(new Set());

  // Reset scroll when switching tabs.
  useEffect(() => {
    setActiveIdx(0);
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [feedTab]);

  // Consume jumpTo: scroll the feed to the requested playable.
  useEffect(() => {
    if (!feedJumpToId) return;
    const idx = feed.findIndex((p) => p.id === feedJumpToId);
    if (idx < 0) return;
    const fs = scrollRef.current;
    if (!fs) return;
    fs.scrollTo({ top: idx * fs.clientHeight, behavior: "instant" as ScrollBehavior });
    setActiveIdx(idx);
    clearJumpTo();
  }, [feedJumpToId, feed, clearJumpTo]);

  // Intersection observer: active item + infinite scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sections = el.querySelectorAll<HTMLElement>(".feed-item");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Array.from(sections).indexOf(e.target as HTMLElement);
            if (idx !== -1) {
              setActiveIdx(idx);
              if (idx >= feed.length - 3 && nextCursor && !loading) {
                loadFeed(false).catch(() => {});
              }
            }
          }
        }
      },
      { root: el, threshold: [0.6] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [feed.length, nextCursor, loading, loadFeed]);

  // Record play event (deduped server-side).
  useEffect(() => {
    const cur = feed[activeIdx];
    if (!cur) return;
    if (playPingedRef.current.has(cur.id)) return;
    playPingedRef.current.add(cur.id);
    api(`/api/playables/${cur.id}/play`, { body: { completed: false, duration: 0 } }).catch(
      () => {}
    );
  }, [feed, activeIdx]);

  // Keyboard nav: arrow keys step through the feed.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }
      const fs = scrollRef.current;
      if (!fs) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") {
        e.preventDefault();
        const next = Math.min(feed.length - 1, activeIdx + 1);
        fs.scrollTo({ top: next * fs.clientHeight, behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") {
        e.preventDefault();
        const next = Math.max(0, activeIdx - 1);
        fs.scrollTo({ top: next * fs.clientHeight, behavior: "smooth" });
      } else if (e.key === "l") {
        e.preventDefault();
        const cur = feed[activeIdx];
        if (cur) toggleLike(cur.id);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [feed, activeIdx, toggleLike]);

  // Pull-to-refresh.
  const [pullOffset, setPullOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartRef = useRef<number | null>(null);
  const onPullStart = (e: React.PointerEvent<HTMLDivElement>) => {
    const fs = scrollRef.current;
    if (!fs || fs.scrollTop > 0) return;
    pullStartRef.current = e.clientY;
  };
  const onPullMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pullStartRef.current == null) return;
    const dy = e.clientY - pullStartRef.current;
    if (dy <= 0) return;
    setPullOffset(Math.min(120, dy * 0.5));
  };
  const onPullEnd = async () => {
    const off = pullOffset;
    pullStartRef.current = null;
    setPullOffset(0);
    if (off > 64) {
      setRefreshing(true);
      try {
        await loadFeed(true);
      } finally {
        setRefreshing(false);
      }
    }
  };

  const current = feed[activeIdx] ?? null;

  return (
    <div className="relative h-full w-full">
      <TopBar onOpenSearch={onOpenSearch} />

      {/* Pull-to-refresh spinner anchored to top */}
      <AnimatePresence>
        {(pullOffset > 0 || refreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pointer-events-none absolute inset-x-0 top-12 z-10 flex justify-center"
            style={{ transform: `translateY(${refreshing ? 8 : Math.min(pullOffset - 20, 40)}px)` }}
          >
            <motion.div
              animate={{ rotate: refreshing ? 360 : (pullOffset / 120) * 180 }}
              transition={refreshing ? { duration: 1.2, repeat: Infinity, ease: "linear" } : {}}
              className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        className="feed-scroll h-full w-full"
        onPointerDown={onPullStart}
        onPointerMove={onPullMove}
        onPointerUp={onPullEnd}
        onPointerCancel={onPullEnd}
      >
        {feedError ? (
          <FeedErrorState error={feedError} onRetry={() => loadFeed(true)} />
        ) : feed.length === 0 ? (
          loading ? (
            <FeedSkeleton />
          ) : (
            <EmptyFeed tab={feedTab} />
          )
        ) : (
          feed.map((item, i) => (
            <FeedItem
              key={item.id}
              item={item}
              active={i === activeIdx}
              onLike={() => {
                const wasLiked = !!item.liked;
                toggleLike(item.id);
                if (!wasLiked) toast("Liked ❤️");
              }}
              onComment={() => setSheet("comments")}
              onRemix={() => setSheet("remix")}
              onShare={() => setSheet("share")}
              onAuthorClick={() => setSheet("author")}
              onTagClick={(t) => onTagClick(t)}
              onSourceClick={() => toast("Remix of an earlier playable")}
              onMore={() => setSheet("more")}
            />
          ))
        )}
      </div>

      <CommentSheet item={current} open={sheet === "comments"} onClose={() => setSheet(null)} />
      <ShareSheet
        item={current}
        open={sheet === "share"}
        onClose={() => setSheet(null)}
        onToast={toast}
      />
      <AuthorSheet
        item={current}
        open={sheet === "author"}
        onClose={() => setSheet(null)}
        onOpenPlayable={(p) => {
          setSheet(null);
          onOpenPlayable(p);
        }}
      />
      <RemixSheet
        item={current}
        open={sheet === "remix"}
        onClose={() => setSheet(null)}
        onGenerate={(prompt) => {
          setSheet(null);
          if (current) onStartRemix(current, prompt);
        }}
      />
      <OverflowSheet
        item={current}
        open={sheet === "more"}
        onClose={() => setSheet(null)}
        onDeleted={(id) => removePlayable(id)}
        onReport={() => setSheet("report")}
        onHide={(id) => hidePlayable(id)}
      />
      <ReportSheet
        item={current}
        open={sheet === "report"}
        onClose={() => setSheet(null)}
      />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="feed-item relative flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        className="text-sm tracking-widest text-white/60"
      >
        LOADING FEED…
      </motion.div>
    </div>
  );
}

function FeedErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="feed-item relative flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 to-black px-8 text-center">
      <div className="text-5xl">⚠️</div>
      <div className="text-base font-bold">Couldn't load feed</div>
      <div className="max-w-[18rem] text-sm text-white/55">{error}</div>
      <button
        onClick={onRetry}
        className="mt-2 flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-bold active:scale-95"
      >
        <RetryIcon className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function EmptyFeed({ tab }: { tab: string }) {
  return (
    <div className="feed-item relative flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 to-black px-8 text-center">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl"
      >
        🫧
      </motion.div>
      <div className="text-lg font-bold">Nothing here yet</div>
      <p className="text-sm text-white/60">
        {tab === "following"
          ? "Follow some creators to fill this feed."
          : "Be the first to publish a playable."}
      </p>
    </div>
  );
}
