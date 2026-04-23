"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/app/lib/store";
import { XIcon, PlusIcon } from "./Icons";

export type Media = {
  kind: "image" | "video";
  url: string;
  mime: string;
  name: string;
  bytes: number;
};

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_MIMES = ["video/mp4", "video/webm"];

export function MediaPicker({
  items,
  onChange,
  max = 4,
}: {
  items: Media[];
  onChange: (items: Media[]) => void;
  max?: number;
}) {
  const toast = useStore((s) => s.toast);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const canAdd = items.length < max;

  const upload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const csrf = getCookie("loopit_csrf");
    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: form,
        headers: csrf ? { "x-csrf-token": csrf } : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        const parsed = safeParse(text);
        const e = parsed?.error;
        throw new Error(e?.message ?? `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as Media;
      onChange([...items, data]);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const pickImage = () => imageInputRef.current?.click();
  const pickVideo = () => videoInputRef.current?.click();

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((m) => (
          <motion.div
            key={m.url}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative h-14 w-14 overflow-hidden rounded-xl bg-white/10"
          >
            {m.kind === "image" ? (
              // Not using next/image — these come from /api/files which isn't in image remotePatterns
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.url}
                alt={m.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={m.url}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            )}
            <button
              onClick={() => onChange(items.filter((x) => x.url !== m.url))}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
              aria-label="Remove"
            >
              <XIcon className="h-3 w-3" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-black/55 px-1 py-0.5 text-center text-[9px] font-bold text-white">
              {m.kind === "image" ? "IMG" : "VID"}
            </div>
          </motion.div>
        ))}
        {canAdd && (
          <>
            <AttachBtn
              emoji="📷"
              label="Photo"
              disabled={uploading}
              onClick={pickImage}
            />
            <AttachBtn
              emoji="🎥"
              label="Video"
              disabled={uploading}
              onClick={pickVideo}
            />
          </>
        )}
      </div>
      {items.length > 0 && (
        <p className="mt-1.5 text-[10px] text-white/50">
          GPT-5.4 will see your photos and can weave them into the playable.
        </p>
      )}
      <input
        ref={imageInputRef}
        type="file"
        accept={IMAGE_MIMES.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept={VIDEO_MIMES.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function AttachBtn({
  emoji,
  label,
  onClick,
  disabled,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-white/20 bg-white/[0.04] text-[10px] font-bold text-white/75 hover:bg-white/[0.08] disabled:opacity-50"
    >
      <span className="text-lg">{emoji}</span>
      <span>{label}</span>
      <PlusIcon className="absolute -mt-10 ml-10 h-3 w-3 text-pink-400" />
    </button>
  );
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]!) : null;
}

function safeParse(s: string): { error?: { message?: string } } | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
