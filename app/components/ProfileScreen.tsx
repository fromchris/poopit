"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Playable, PlayableKind } from "@/app/lib/types";
import { formatCount } from "@/app/lib/mockData";
import { useStore } from "@/app/lib/store";
import { api } from "@/app/lib/api";
import { EditProfileSheet } from "./EditProfileSheet";
import { SettingsSheet } from "./SettingsSheet";
import { FollowListSheet } from "./FollowListSheet";
import { PlayableThumb } from "./PlayableThumb";
import { SettingsIcon } from "./Icons";

type SubTab = "created" | "liked" | "remixed";

type UserDetail = {
  user: {
    handle: string;
    avatar: string;
    avatarBg: string;
    bio: string;
    counts: { playables: number; followers: number; following: number; likes: number };
  };
  playables: Playable[];
};

export function ProfileScreen({
  onOpenPlayable,
  onOpenAuth,
}: {
  onOpenPlayable?: (p: Playable) => void;
  onOpenAuth?: () => void;
}) {
  const me = useStore((s) => s.me);

  const [sub, setSub] = useState<SubTab>("created");
  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [followKind, setFollowKind] = useState<"followers" | "following" | null>(null);

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [liked, setLiked] = useState<Playable[]>([]);
  const [remixed, setRemixed] = useState<Playable[]>([]);
  const [loading, setLoading] = useState(false);

  // Load profile detail + own playables
  useEffect(() => {
    if (!me) return;
    setDetail(null);
    setLoading(true);
    api<UserDetail>(`/api/users/${encodeURIComponent(me.handle)}`)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [me]);

  // Load liked playables from server
  useEffect(() => {
    if (!me || sub !== "liked") return;
    api<{ items: Playable[] }>("/api/me/liked?limit=40")
      .then((r) => setLiked(r.items))
      .catch(() => {});
  }, [me, sub]);

  // Load remixes (my playables tagged remix)
  useEffect(() => {
    if (!me || sub !== "remixed") return;
    api<{ items: Playable[] }>(`/api/playables?creator=${encodeURIComponent(me.handle)}&limit=40`)
      .then((r) => setRemixed(r.items.filter((p) => p.tags.includes("remix"))))
      .catch(() => {});
  }, [me, sub]);

  const created = detail?.playables ?? [];
  const grid: Playable[] = useMemo(() => {
    if (sub === "liked") return liked;
    if (sub === "remixed") return remixed;
    return created;
  }, [sub, liked, remixed, created]);

  if (!me) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-black p-8 text-center">
        <div className="text-5xl">🦄</div>
        <div className="text-lg font-bold">Sign in to see your profile</div>
        <button
          onClick={() => onOpenAuth?.()}
          className="rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-5 py-2.5 text-sm font-bold text-white"
        >
          Sign in or create account
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-y-auto bg-black pb-28">
      <div className="relative h-40 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.35),transparent_60%)]" />
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="-mt-12 px-5">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-5xl ring-4 ring-black">
          {me.avatar}
        </div>
        <div className="mt-3 text-xl font-black">{me.handle}</div>
        <div className="text-sm text-white/60">{me.bio || "no bio yet"}</div>

        <div className="mt-4 flex gap-6">
          <Stat
            label="Playables"
            value={(detail?.user.counts.playables ?? 0).toString()}
          />
          <button onClick={() => setFollowKind("followers")}>
            <Stat
              label="Followers"
              value={formatCount(detail?.user.counts.followers ?? 0)}
            />
          </button>
          <button onClick={() => setFollowKind("following")}>
            <Stat
              label="Following"
              value={formatCount(detail?.user.counts.following ?? 0)}
            />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 rounded-full bg-white py-2 text-sm font-bold text-black active:scale-95 transition"
          >
            Edit profile
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex-1 rounded-full bg-white/10 py-2 text-sm font-bold text-white active:scale-95 transition"
          >
            Settings
          </button>
        </div>

        <div className="mt-6 border-b border-white/10">
          <div className="flex gap-1 text-sm font-bold">
            <SubTabBtn
              active={sub === "created"}
              label="Created"
              onClick={() => setSub("created")}
            />
            <SubTabBtn
              active={sub === "liked"}
              label="Liked"
              onClick={() => setSub("liked")}
              count={liked.length}
            />
            <SubTabBtn
              active={sub === "remixed"}
              label="Remixed"
              onClick={() => setSub("remixed")}
              count={remixed.length}
            />
          </div>
        </div>

        {grid.length === 0 ? (
          loading && sub === "created" ? (
            <GridSkeleton rows={2} />
          ) : (
            <div className="py-12 text-center text-sm text-white/50">
              {sub === "liked" && "Tap ❤️ on a playable to save it here."}
              {sub === "remixed" && "Your remixes will appear here."}
              {sub === "created" && "Make your first playable from the Create tab."}
            </div>
          )
        ) : (
          <motion.div layout className="mt-3 grid grid-cols-3 gap-1">
            {grid.map((p) => (
              <motion.button
                layout
                key={p.id}
                onClick={() => onOpenPlayable?.(p)}
                className="relative aspect-[3/4] overflow-hidden rounded-md text-left"
              >
                <PlayableThumb kind={p.kind as PlayableKind} theme={p.theme} />
                <div className="absolute bottom-1 left-1 rounded bg-black/40 px-1 text-[10px] font-bold text-white/90 drop-shadow backdrop-blur-sm">
                  ▶ {formatCount(p.stats.plays)}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      <EditProfileSheet open={editing} onClose={() => setEditing(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <FollowListSheet
        open={followKind !== null}
        handle={me.handle}
        kind={followKind}
        onClose={() => setFollowKind(null)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-left">
      <div className="text-lg font-black">{value}</div>
      <div className="text-[11px] text-white/60">{label}</div>
    </div>
  );
}

function SubTabBtn({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 pb-2.5 pt-1 text-sm font-bold transition ${
        active ? "text-white" : "text-white/50"
      }`}
    >
      {label}
      {count ? <span className="ml-1 text-[11px] text-white/50">{count}</span> : null}
      {active && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-white" />
      )}
    </button>
  );
}

function GridSkeleton({ rows = 2 }: { rows?: number }) {
  const n = rows * 3;
  return (
    <div className="mt-3 grid grid-cols-3 gap-1">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-md bg-white/[0.04]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-900/60 via-zinc-800/30 to-zinc-900/60" />
        </div>
      ))}
    </div>
  );
}
