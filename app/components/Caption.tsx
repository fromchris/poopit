"use client";

import type { Playable } from "@/app/lib/types";
import { formatCount } from "@/app/lib/mockData";
import { RemixIcon } from "./Icons";

export function Caption({
  item,
  onAuthorClick,
  onTagClick,
  onSourceClick,
}: {
  item: Playable;
  onAuthorClick?: () => void;
  onTagClick?: (tag: string) => void;
  onSourceClick?: (sourceId: string) => void;
}) {
  // Remix lineage: our wire format doesn't carry `sourceId` explicitly,
  // but remixes are tagged "remix" and titled "Remix: …" by convention.
  const isRemix = item.tags.includes("remix") || /^Remix:/i.test(item.title);

  return (
    <div className="pointer-events-none absolute bottom-24 left-4 right-16 z-10 flex flex-col items-start gap-2 text-white">
      <button
        onClick={onAuthorClick}
        className="pointer-events-auto flex w-fit items-center gap-2 active:opacity-70"
      >
        <span className="text-[15px] font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
          {item.author.handle}
        </span>
        <span className="text-[11px] text-white/60">
          · {formatCount(item.stats.plays)} plays
        </span>
      </button>
      <div className="pointer-events-none text-[15px] font-semibold leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
        {item.title}
      </div>
      {isRemix && onSourceClick && (
        <button
          onClick={() => onSourceClick(item.id)}
          className="pointer-events-auto flex w-fit items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white/90 backdrop-blur"
        >
          <RemixIcon className="h-3 w-3" />
          remix lineage
        </button>
      )}
      <div className="pointer-events-none text-[13px] text-white/85 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
        {item.description}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {item.tags.map((t) => (
          <button
            key={t}
            onClick={() => onTagClick?.(t)}
            className="pointer-events-auto rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/25"
          >
            #{t}
          </button>
        ))}
      </div>
    </div>
  );
}
