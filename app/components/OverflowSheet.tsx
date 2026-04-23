"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Playable } from "@/app/lib/types";
import { useStore } from "@/app/lib/store";
import { api } from "@/app/lib/api";
import { playableUrl } from "@/app/lib/url";
import {
  FlagIcon,
  HideIcon,
  LinkIcon,
  TrashIcon,
  XIcon,
} from "./Icons";

type Props = {
  item: Playable | null;
  open: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onReport: (item: Playable) => void;
  onHide: (id: string) => void;
};

export function OverflowSheet({ item, open, onClose, onDeleted, onReport, onHide }: Props) {
  const me = useStore((s) => s.me);
  const toast = useStore((s) => s.toast);
  const [busy, setBusy] = useState(false);

  if (!item) return null;
  const isOwn = !!me && item.author.handle === me.handle;

  const copyLink = async () => {
    const url = playableUrl(item.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: item.description, url });
        onClose();
        return;
      }
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      toast("Link copied");
    } catch {
      toast("Couldn't copy — long-press to copy manually");
    }
    onClose();
  };

  const delOwn = async () => {
    if (!confirm("Delete this playable? This can't be undone.")) return;
    setBusy(true);
    try {
      await api(`/api/playables/${item.id}`, { method: "DELETE" });
      onDeleted(item.id);
      onClose();
      toast("Deleted");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-40 bg-black/60"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-zinc-950 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-white/25" />
            <div className="flex items-center justify-between px-5 pb-2 pt-1">
              <div className="text-base font-bold">{item.title}</div>
              <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="px-2 py-2">
              <Row icon={<LinkIcon className="h-5 w-5" />} label="Copy link" onClick={copyLink} />
              <Row
                icon={<HideIcon className="h-5 w-5" />}
                label="Not interested"
                onClick={() => {
                  onHide(item.id);
                  onClose();
                  toast("We'll show less like this");
                }}
              />
              {isOwn ? (
                <Row
                  icon={<TrashIcon className="h-5 w-5 text-rose-400" />}
                  label="Delete"
                  danger
                  disabled={busy}
                  onClick={delOwn}
                />
              ) : (
                <Row
                  icon={<FlagIcon className="h-5 w-5 text-rose-400" />}
                  label="Report"
                  danger
                  onClick={() => {
                    onReport(item);
                    onClose();
                  }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/5 disabled:opacity-50 ${
        danger ? "text-rose-300" : "text-white/90"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
        {icon}
      </span>
      <span className="text-[14px] font-semibold">{label}</span>
    </button>
  );
}
