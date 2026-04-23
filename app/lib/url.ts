/**
 * URL helpers for shareable deep links + in-app query routing.
 *
 * Query params we understand on "/" (the app shell):
 *   ?tab=feed|search|create|inbox|profile
 *   ?p=<playable-id>              jump-to that playable on load
 *   ?t=<tag>                       search this tag on load
 *   ?u=<@handle>                   open this user's profile on load
 *   ?q=<query>                     search query
 *
 * Shareable dedicated page: /p/[id] renders the playable standalone.
 */
import type { Tab } from "@/app/components/BottomTabs";

export type InitialRouting = {
  tab: Tab;
  playableId?: string;
  tag?: string;
  query?: string;
  userHandle?: string;
};

export function parseInitialRouting(search: URLSearchParams): InitialRouting {
  const raw = search.get("tab");
  const tab: Tab =
    raw === "search" ||
    raw === "create" ||
    raw === "inbox" ||
    raw === "profile" ||
    raw === "feed"
      ? (raw as Tab)
      : search.get("p") || search.get("u")
      ? "feed"
      : search.get("t") || search.get("q")
      ? "search"
      : "feed";
  return {
    tab,
    playableId: search.get("p") ?? undefined,
    tag: search.get("t") ?? undefined,
    query: search.get("q") ?? undefined,
    userHandle: search.get("u") ?? undefined,
  };
}

export function playableUrl(id: string): string {
  if (typeof window === "undefined") return `/p/${id}`;
  return `${window.location.origin}/p/${id}`;
}

export function appUrlForTab(tab: Tab): string {
  if (typeof window === "undefined") return `/?tab=${tab}`;
  return `${window.location.origin}/?tab=${tab}`;
}

export function appUrlForTag(tag: string): string {
  if (typeof window === "undefined") return `/?tab=search&t=${encodeURIComponent(tag)}`;
  return `${window.location.origin}/?tab=search&t=${encodeURIComponent(tag)}`;
}

export function appUrlForUser(handle: string): string {
  if (typeof window === "undefined") return `/?u=${encodeURIComponent(handle)}`;
  return `${window.location.origin}/?u=${encodeURIComponent(handle)}`;
}

/** Update the current URL without a navigation (so back button still works). */
export function updateUrl(updates: Record<string, string | null>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(updates)) {
    if (v == null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  window.history.replaceState(null, "", url.toString());
}
