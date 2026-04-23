"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useStore } from "@/app/lib/store";
import { api } from "@/app/lib/api";
import { SparkIcon, RetryIcon, XIcon } from "./Icons";

export type PendingJob = {
  id: string;
  prompt: string;
  status: "queued" | "running" | "succeeded" | "failed";
  playableId?: string | null;
  mode: "parameter" | "code";
  steps?: string[];
  createdAt?: string;
  completedAt?: string | null;
  errorCode?: string | null;
};

export function PendingJobs({
  jobs,
  onOpenPlayable,
  onRetry,
  onChange,
}: {
  jobs: PendingJob[];
  onOpenPlayable?: (playableId: string) => void;
  onRetry?: (prompt: string, mode: "parameter" | "code") => void;
  onChange?: () => void;
}) {
  const recent = jobs.slice(0, 5);
  if (recent.length === 0) return null;
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/60">
        <SparkIcon className="h-3.5 w-3.5 text-pink-400 animate-shimmer" />
        your latest generations
      </div>
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {recent.map((j) => (
            <motion.div
              key={j.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <JobRow
                job={j}
                onOpenPlayable={onOpenPlayable}
                onRetry={onRetry}
                onChange={onChange}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function JobRow({
  job,
  onOpenPlayable,
  onRetry,
  onChange,
}: {
  job: PendingJob;
  onOpenPlayable?: (playableId: string) => void;
  onRetry?: (prompt: string, mode: "parameter" | "code") => void;
  onChange?: () => void;
}) {
  const toast = useStore((s) => s.toast);
  const isRunning = job.status === "queued" || job.status === "running";
  const elapsedSec = useElapsedSec(
    isRunning && job.createdAt ? new Date(job.createdAt).getTime() : null
  );
  const lastStep = job.steps?.[job.steps.length - 1];

  const cancelOrDismiss = async () => {
    try {
      await api(`/api/generate?jobId=${job.id}`, { method: "DELETE" });
      onChange?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Cancel failed");
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-2">
      <StatusDot status={job.status} />
      <div className="flex-1 overflow-hidden">
        <div className="truncate text-[13px] text-white">{job.prompt}</div>
        <div className="truncate text-[10px] text-white/55">
          {job.mode === "code" ? "original" : "from template"}
          {" · "}
          {labelFor(job.status)}
          {isRunning && elapsedSec > 0 && ` · ${elapsedSec}s`}
          {isRunning && lastStep && ` · ${lastStep}`}
          {job.status === "failed" && job.errorCode && ` · ${truncate(job.errorCode, 50)}`}
        </div>
      </div>
      {job.status === "succeeded" && job.playableId ? (
        <>
          <button
            onClick={() => onOpenPlayable?.(job.playableId!)}
            className="rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-3 py-1 text-[11px] font-bold text-white"
          >
            Open
          </button>
          <button
            onClick={cancelOrDismiss}
            aria-label="Dismiss"
            className="rounded-full bg-white/10 p-1 text-white"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </>
      ) : job.status === "failed" ? (
        <>
          <button
            onClick={() => onRetry?.(job.prompt, job.mode)}
            className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-white"
          >
            <RetryIcon className="h-3 w-3" />
            Retry
          </button>
          <button
            onClick={cancelOrDismiss}
            aria-label="Dismiss"
            className="rounded-full bg-white/10 p-1 text-white"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </>
      ) : (
        <button
          onClick={cancelOrDismiss}
          className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/15"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function useElapsedSec(startMs: number | null): number {
  const [sec, setSec] = useState(
    startMs ? Math.max(0, Math.floor((Date.now() - startMs) / 1000)) : 0
  );
  useEffect(() => {
    if (startMs == null) return;
    const iv = setInterval(() => {
      setSec(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(iv);
  }, [startMs]);
  return sec;
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

function labelFor(s: PendingJob["status"]) {
  switch (s) {
    case "queued":
      return "queued";
    case "running":
      return "generating";
    case "succeeded":
      return "ready";
    case "failed":
      return "failed";
  }
}

function StatusDot({ status }: { status: PendingJob["status"] }) {
  if (status === "succeeded") {
    return <span className="h-2 w-2 flex-none rounded-full bg-emerald-400" />;
  }
  if (status === "failed") {
    return <span className="h-2 w-2 flex-none rounded-full bg-rose-500" />;
  }
  return (
    <motion.span
      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.2, repeat: Infinity }}
      className="h-2 w-2 flex-none rounded-full bg-pink-400"
    />
  );
}
