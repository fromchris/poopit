"use client";

import { useStore } from "@/app/lib/store";
import { useT } from "@/app/lib/i18n";
import {
  HomeIcon,
  SearchIcon,
  UserIcon,
  PlusIcon,
  InboxIcon,
} from "./Icons";

export type Tab = "feed" | "search" | "create" | "inbox" | "profile";

export function BottomTabs({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const unread = useStore((s) => s.unread);
  const chromeDimmed = useStore((s) => s.chromeDimmed);
  const t = useT();
  // Only dim on the Feed tab — other tabs have normal scrollable content.
  const dim = tab === "feed" && chromeDimmed;

  if (dim) {
    // Fully hidden — no ghost, no pointer target.
    return null;
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex h-20 items-start justify-around bg-gradient-to-t from-black via-black/90 to-transparent px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <TabButton
        label={t("tab.feed")}
        active={tab === "feed"}
        onClick={() => onChange("feed")}
        icon={<HomeIcon filled={tab === "feed"} className="h-6 w-6" />}
      />
      <TabButton
        label={t("tab.search")}
        active={tab === "search"}
        onClick={() => onChange("search")}
        icon={<SearchIcon className="h-6 w-6" />}
      />
      <button
        onClick={() => onChange("create")}
        className="relative -mt-3 flex h-12 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-white shadow-lg shadow-pink-500/40 active:scale-95 transition"
      >
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 blur-lg opacity-50" />
        <PlusIcon className="relative h-7 w-7" />
      </button>
      <TabButton
        label={t("tab.inbox")}
        active={tab === "inbox"}
        onClick={() => onChange("inbox")}
        badge={unread}
        icon={<InboxIcon filled={tab === "inbox"} className="h-6 w-6" />}
      />
      <TabButton
        label={t("tab.me")}
        active={tab === "profile"}
        onClick={() => onChange("profile")}
        icon={<UserIcon filled={tab === "profile"} className="h-6 w-6" />}
      />
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex min-w-12 flex-col items-center gap-0.5 transition ${
        active ? "text-white" : "text-white/50"
      }`}
    >
      <div className="relative">
        {icon}
        {badge ? (
          <span className="absolute -right-2 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </div>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
