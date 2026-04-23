"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Playable, PlayableKind } from "@/app/lib/types";
import { formatCount } from "@/app/lib/mockData";
import { api } from "@/app/lib/api";
import { SearchIcon, XIcon, SparkIcon } from "./Icons";
import { PlayableThumb } from "./PlayableThumb";

const TRENDING = ["#fidget", "#asmr", "#pigeonrhythm", "#neon", "#互动剧", "#rainbow", "#meow"];
const CATEGORIES: {
  label: string;
  id: "all" | "asmr" | "games" | "art" | "pets" | "memes" | "drama";
  emoji: string;
}[] = [
  { label: "For You", id: "all", emoji: "✨" },
  { label: "ASMR", id: "asmr", emoji: "🫧" },
  { label: "Games", id: "games", emoji: "🎮" },
  { label: "Art", id: "art", emoji: "🎨" },
  { label: "Drama", id: "drama", emoji: "🎬" },
  { label: "Memes", id: "memes", emoji: "😹" },
];

export function SearchScreen({
  initialQuery,
  onSelect,
}: {
  initialQuery?: string;
  onSelect: (p: Playable) => void;
}) {
  const [q, setQ] = useState(initialQuery ?? "");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const [results, setResults] = useState<Playable[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset on prop change
  useEffect(() => {
    if (initialQuery !== undefined) setQ(initialQuery);
  }, [initialQuery]);

  const params = useMemo(() => {
    const p = new URLSearchParams({ cat, limit: "40" });
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [q, cat]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const h = setTimeout(() => {
      api<{ items: Playable[] }>(`/api/search?${params}`)
        .then((r) => {
          if (!cancelled) setResults(r.items);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(h);
    };
  }, [params]);

  return (
    <div className="relative h-full w-full overflow-y-auto bg-black pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="sticky top-0 z-10 -mt-1 bg-black/85 px-4 pb-3 pt-2 backdrop-blur">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search playables, creators, tags"
            className="w-full rounded-full border border-white/10 bg-white/[0.06] py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/40 focus:border-pink-500/60 focus:outline-none"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10"
            >
              <XIcon className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="scroll-area mt-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`flex flex-none items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                cat === c.id ? "bg-white text-black" : "bg-white/10 text-white/80 hover:bg-white/15"
              }`}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {q === "" && (
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2">
            <SparkIcon className="h-4 w-4 text-pink-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/60">
              Trending
            </h2>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {TRENDING.map((t) => (
              <button
                key={t}
                onClick={() => setQ(t.replace("#", ""))}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/85"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 px-3">
        <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-white/60">
          {q ? `Results for "${q}"` : CATEGORIES.find((c) => c.id === cat)?.label}
        </h2>
        {loading && results.length === 0 ? (
          <GridSkeleton />
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/50">No matches.</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <AnimatePresence mode="popLayout">
              {results.map((p) => (
                <motion.button
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onSelect(p)}
                  className="relative aspect-[3/4] overflow-hidden rounded-xl text-left"
                >
                  <PlayableThumb kind={p.kind as PlayableKind} theme={p.theme} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="text-[13px] font-bold text-white drop-shadow line-clamp-1">
                      {p.title}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-white/80">
                      <span>▶ {formatCount(p.stats.plays)}</span>
                      <span>·</span>
                      <span className="truncate">{p.author.handle}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white/[0.04]"
        >
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-900/60 via-zinc-800/30 to-zinc-900/60" />
        </div>
      ))}
    </div>
  );
}
