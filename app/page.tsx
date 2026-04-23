"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Feed } from "./components/Feed";
import { BottomTabs, type Tab } from "./components/BottomTabs";
import { CreateScreen } from "./components/CreateScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { SearchScreen } from "./components/SearchScreen";
import { InboxScreen } from "./components/InboxScreen";
import { EditorScreen } from "./components/EditorScreen";
import { AuthScreen } from "./components/AuthScreen";
import { SwipeHint } from "./components/SwipeHint";
import { PwaInstall } from "./components/PwaInstall";
import { Toast } from "./components/Toast";
import { api } from "./lib/api";
import { useStore } from "./lib/store";
import { parseInitialRouting, updateUrl } from "./lib/url";
import type { Playable, PlayableKind } from "./lib/types";

type EditorState =
  | null
  | {
      source: Playable | null;
      prompt: string;
      kind?: PlayableKind;
      theme?: string;
      bundleUrl?: string | null;
    };

type PendingJob = {
  id: string;
  prompt: string;
  status: "queued" | "running" | "succeeded" | "failed";
  playableId?: string | null;
  mode: "parameter" | "code";
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("feed");
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [editor, setEditor] = useState<EditorState>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);

  const booted = useStore((s) => s.booted);
  const me = useStore((s) => s.me);
  const boot = useStore((s) => s.boot);
  const toasts = useStore((s) => s.toasts);
  const publish = useStore((s) => s.publish);
  const toast = useStore((s) => s.toast);
  const jumpToPlayable = useStore((s) => s.jumpToPlayable);
  const subscribeNotifications = useStore((s) => s.subscribeNotifications);

  useEffect(() => {
    boot();
  }, [boot]);

  // Consume URL query params once after boot completes.
  useEffect(() => {
    if (!booted || typeof window === "undefined") return;
    const routing = parseInitialRouting(new URL(window.location.href).searchParams);
    if (routing.tab && routing.tab !== "feed") setTab(routing.tab);
    if (routing.query) setSearchQuery(routing.query);
    if (routing.tag) {
      setSearchQuery(routing.tag);
      setTab("search");
    }
    if (routing.playableId) {
      // If it's not in the feed yet, fetch it and prepend so jumpTo has something to scroll to.
      api<{ playable: Playable }>(`/api/playables/${routing.playableId}`)
        .then((r) => {
          jumpToPlayable(r.playable);
          setTab("feed");
        })
        .catch(() => {});
    }
    // Strip one-shot params after we've honored them so a refresh stays where you are.
    updateUrl({ p: null, t: null, u: null, q: null });
  }, [booted, jumpToPlayable]);

  // Keep tab in URL so back/forward works with the browser.
  useEffect(() => {
    updateUrl({ tab: tab === "feed" ? null : tab });
  }, [tab]);

  // Live notification stream — subscribe once signed in; clean up on logout/unmount.
  useEffect(() => {
    if (!me) return;
    const unsubscribe = subscribeNotifications();
    return unsubscribe;
  }, [me, subscribeNotifications]);

  // Load + poll pending generation jobs (survives refresh).
  const reloadJobs = useCallback(async () => {
    try {
      const r = await api<{ items: PendingJob[] }>("/api/me/generations?limit=10");
      setPendingJobs(r.items);
    } catch {}
  }, []);
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    const load = async () => {
      try {
        const r = await api<{ items: PendingJob[] }>("/api/me/generations?limit=10");
        if (cancelled) return;
        setPendingJobs(r.items);
      } catch {}
    };
    load();
    const iv = setInterval(load, 2000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [me]);

  // Note: the generation_ready toast is emitted inside the store's SSE
  // handler (with per-ID dedup). We intentionally don't subscribe here to
  // avoid duplicating on list refetch.

  // Prompt auth once per session for signed-out users.
  useEffect(() => {
    if (booted && !me) {
      const shown = sessionStorage.getItem("loopit-auth-shown");
      if (!shown) {
        setAuthOpen(true);
        sessionStorage.setItem("loopit-auth-shown", "1");
      }
    }
  }, [booted, me]);

  const runGenerate = useCallback(
    async (
      prompt: string,
      source: Playable | null,
      mode: "parameter" | "code" = "code",
      attachments?: Array<{ kind: "image" | "video"; url: string; mime: string }>
    ) => {
      if (!me) {
        setAuthOpen(true);
        return;
      }
      try {
        const r = await api<{ jobId: string; status: string; mode: string }>(
          "/api/generate",
          {
            body: {
              prompt,
              sourceId: source?.id ?? null,
              mode,
              attachments: attachments?.length
                ? attachments.map((a) => ({ kind: a.kind, url: a.url, mime: a.mime }))
                : undefined,
            },
          }
        );
        toast(
          mode === "code"
            ? attachments?.length
              ? "Generating with your media · ping in Inbox when it's ready"
              : "Generating · we'll ping you in Inbox when it's ready"
            : "Generating · should be quick"
        );
        setTab("feed");
        setPendingJobs((p) => [
          { id: r.jobId, prompt, status: "queued", playableId: null, mode: r.mode as PendingJob["mode"] },
          ...p,
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Couldn't start generation";
        toast(msg);
      }
    },
    [me, toast]
  );

  const handlePublish = async (
    title: string,
    description: string,
    tags: string[],
    draft: { kind: PlayableKind; theme: string }
  ) => {
    if (!me) {
      setAuthOpen(true);
      return;
    }
    const source = editor?.source ?? null;
    const bundleUrl = editor?.bundleUrl ?? null;
    try {
      const p = await publish({
        kind: draft.kind,
        title,
        description,
        theme: draft.theme,
        tags,
        sourceId: source?.id ?? null,
        bundleUrl: bundleUrl ?? undefined,
      });
      setEditor(null);
      setTab("feed");
      jumpToPlayable(p);
      toast("Published to your Feed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publish failed";
      toast(msg);
    }
  };

  const openPlayable = (p: Playable) => {
    jumpToPlayable(p);
    setTab("feed");
  };

  const openSearchWithTag = (tag: string) => {
    setSearchQuery(tag);
    setTab("search");
  };

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-[460px] flex-col overflow-hidden bg-black shadow-[0_0_80px_rgba(255,45,135,0.1)]">
      <div className="relative h-full flex-1">
        {tab === "feed" && (
          <Feed
            onOpenSearch={() => {
              setSearchQuery(undefined);
              setTab("search");
            }}
            onStartRemix={(source, prompt) =>
              runGenerate(prompt || `remix of ${source.title}`, source)
            }
            onTagClick={openSearchWithTag}
            onOpenPlayable={openPlayable}
          />
        )}
        {tab === "search" && (
          <SearchScreen
            initialQuery={searchQuery}
            onSelect={openPlayable}
          />
        )}
        {tab === "create" && (
          <CreateScreen
            pendingJobs={pendingJobs}
            onJobsChange={reloadJobs}
            onOpenPlayable={async (id) => {
              try {
                const r = await api<{ playable: Playable }>(`/api/playables/${id}`);
                openPlayable(r.playable);
              } catch {
                toast("Couldn't load that playable");
              }
            }}
            onGenerate={(prompt, mode, atts) => runGenerate(prompt, null, mode, atts)}
            onPickTemplate={({ kind, theme, name }) => {
              const source: Playable = {
                id: `tpl-${kind}`,
                kind,
                title: name,
                description: `start from ${name}`,
                tags: ["template"],
                theme,
                author: {
                  handle: "@studio.loopit",
                  avatar: "🎬",
                  avatarBg: "from-yellow-400 to-orange-500",
                  isFollowing: false,
                },
                stats: { likes: 0, comments: 0, remixes: 0, plays: 0 },
              };
              setEditor({ source, prompt: "" });
            }}
          />
        )}
        {tab === "inbox" && <InboxScreen onOpenPlayable={openPlayable} />}
        {tab === "profile" && (
          <ProfileScreen
            onOpenPlayable={openPlayable}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}
      </div>
      <BottomTabs tab={tab} onChange={setTab} />

      <SwipeHint enabled={tab === "feed" && !editor && !authOpen} />

      <AnimatePresence>
        {editor && (
          <EditorScreen
            open
            source={editor.source}
            initialPrompt={editor.prompt}
            presetKind={editor.kind}
            presetTheme={editor.theme}
            onClose={() => setEditor(null)}
            onPublish={(title, desc, tags, draft) =>
              handlePublish(title, desc, tags, draft)
            }
          />
        )}
      </AnimatePresence>


      <AnimatePresence>
        {authOpen && <AuthScreen onClose={() => setAuthOpen(false)} />}
      </AnimatePresence>

      <PwaInstall />
      <Toast messages={toasts} />
    </main>
  );
}
