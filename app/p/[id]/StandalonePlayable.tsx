"use client";

import type { Playable } from "@/app/lib/types";
import { Playable as PlayableRenderer } from "@/app/playables";
import { formatCount } from "@/app/lib/mockData";

export function StandalonePlayable({ item }: { item: Playable }) {
  const isDrama = item.kind === "interactive-drama";
  return (
    <section
      className={`relative h-full w-full bg-gradient-to-br ${item.theme}`}
    >
      {!isDrama && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.45)_100%)]" />
      )}
      <PlayableRenderer kind={item.kind} active src={item.src} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-lg ${item.author.avatarBg}`}
        >
          {item.author.avatar}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-bold text-white drop-shadow">{item.title}</div>
          <div className="text-[11px] text-white/80">
            {item.author.handle} · ▶ {formatCount(item.stats.plays)}
          </div>
        </div>
      </div>
    </section>
  );
}
