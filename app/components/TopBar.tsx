"use client";

import { useStore } from "@/app/lib/store";
import { useT } from "@/app/lib/i18n";
import { SearchIcon } from "./Icons";

export function TopBar({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const feedTab = useStore((s) => s.feedTab);
  const setFeedTab = useStore((s) => s.setFeedTab);
  const t = useT();

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex items-center gap-4">
        <TopTab
          label={t("top.following")}
          active={feedTab === "following"}
          onClick={() => void setFeedTab("following")}
        />
        <TopTab
          label={t("top.forYou")}
          active={feedTab === "for-you"}
          onClick={() => void setFeedTab("for-you")}
        />
      </div>
      <button
        onClick={onOpenSearch}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function TopTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="relative pb-1">
      <span
        className={`text-[15px] font-bold transition ${
          active ? "text-white" : "text-white/50"
        }`}
      >
        {label}
      </span>
      {active && (
        <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white" />
      )}
    </button>
  );
}

export function LoopitLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`loopit-gradient text-2xl font-black tracking-tight ${className}`}>
      Loopit
    </div>
  );
}
