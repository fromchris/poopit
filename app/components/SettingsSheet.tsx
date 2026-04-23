"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useStore } from "@/app/lib/store";
import { useLocale, useT, type Locale } from "@/app/lib/i18n";
import { LogoutIcon, SettingsIcon, XIcon } from "./Icons";

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const me = useStore((s) => s.me);
  const signOut = useStore((s) => s.signOut);
  const toast = useStore((s) => s.toast);
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);

  // Local UI prefs — persisted via localStorage for portability.
  const [notifyLikes, setNotifyLikes] = useState(() => read("n-likes", true));
  const [notifyComments, setNotifyComments] = useState(() => read("n-comments", true));
  const [notifyFollows, setNotifyFollows] = useState(() => read("n-follows", true));
  const [reducedMotion, setReducedMotion] = useState(() => read("reduced-motion", false));
  const [lowData, setLowData] = useState(() => read("low-data", false));

  const save = <T,>(key: string, v: T, setter: (x: T) => void) => {
    setter(v);
    if (typeof window !== "undefined") localStorage.setItem(`loopit-pref-${key}`, JSON.stringify(v));
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
            className="absolute inset-x-0 bottom-0 z-50 max-h-[88%] overflow-hidden rounded-t-3xl bg-zinc-950 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-white/25" />
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <div className="flex items-center gap-2 text-base font-bold">
                <SettingsIcon className="h-4 w-4" />
                {t("settings.title")}
              </div>
              <button onClick={onClose} className="rounded-full bg-white/10 p-1.5">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: "70vh" }}>
              <Section label={t("settings.language")}>
                <div className="flex gap-2 p-2">
                  {(["en", "zh"] as Locale[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLocale(l)}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition ${
                        locale === l
                          ? "bg-white text-black"
                          : "bg-white/[0.06] text-white/80"
                      }`}
                    >
                      {l === "en" ? "English" : "中文"}
                    </button>
                  ))}
                </div>
              </Section>

              <Section label={t("settings.account")}>
                <Row label={me?.handle ?? "—"} value={me ? "signed in" : "signed out"} />
                {me?.isGuest && (
                  <Row
                    label="Upgrade guest account"
                    value="Set a password in Edit profile"
                  />
                )}
              </Section>

              <Section label={t("settings.notifications")}>
                <Toggle
                  label={t("inbox.tab.likes")}
                  on={notifyLikes}
                  onChange={(v) => save("n-likes", v, setNotifyLikes)}
                />
                <Toggle
                  label={t("inbox.tab.comments")}
                  on={notifyComments}
                  onChange={(v) => save("n-comments", v, setNotifyComments)}
                />
                <Toggle
                  label={t("inbox.tab.follows")}
                  on={notifyFollows}
                  onChange={(v) => save("n-follows", v, setNotifyFollows)}
                />
              </Section>

              <Section label={t("settings.playback")}>
                <Toggle
                  label={t("settings.reducedMotion")}
                  on={reducedMotion}
                  onChange={(v) => save("reduced-motion", v, setReducedMotion)}
                />
                <Toggle
                  label={t("settings.dataSaver")}
                  on={lowData}
                  onChange={(v) => save("low-data", v, setLowData)}
                />
              </Section>

              <Section label={t("settings.privacy")}>
                <LinkRow label={t("settings.privacyPolicy")} onClick={() => toast("soon")} />
                <LinkRow label={t("settings.terms")} onClick={() => toast("soon")} />
                <LinkRow label={t("settings.help")} onClick={() => toast("soon")} />
                <LinkRow label={t("settings.export")} onClick={() => toast("soon")} />
                <LinkRow label={t("settings.delete")} danger onClick={() => toast("soon")} />
              </Section>

              {me && (
                <button
                  onClick={async () => {
                    await signOut();
                    onClose();
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/15 py-3 text-sm font-bold text-rose-300 hover:bg-rose-500/25"
                >
                  <LogoutIcon className="h-4 w-4" />
                  {t("settings.signOut")}
                </button>
              )}

              <div className="mt-6 text-center text-[10px] text-white/40">
                {t("settings.version")}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="pb-1 pl-2 text-[11px] font-bold uppercase tracking-wider text-white/50">
        {label}
      </div>
      <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.03]">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[14px] font-semibold">{label}</span>
      {value && <span className="text-[12px] text-white/55">{value}</span>}
    </div>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between px-4 py-3 text-left"
    >
      <span className="text-[14px] font-semibold text-white">{label}</span>
      <span
        className={`relative flex h-6 w-10 items-center rounded-full transition ${
          on ? "bg-gradient-to-r from-fuchsia-500 to-pink-500" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute h-5 w-5 rounded-full bg-white shadow transition ${
            on ? "left-[calc(100%-22px)]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function LinkRow({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between px-4 py-3 text-left text-[14px] font-semibold ${
        danger ? "text-rose-300" : "text-white"
      }`}
    >
      {label}
      <span className="text-white/40">›</span>
    </button>
  );
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(`loopit-pref-${key}`);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
