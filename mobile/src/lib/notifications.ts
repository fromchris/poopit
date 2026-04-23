// SSE subscriber for /api/notifications/stream. Uses react-native-sse
// (which works under Hermes, unlike the browser's EventSource which
// isn't part of RN core). On each event we refresh the notifications
// list + unread count from the store.

import EventSource from "react-native-sse";
import { backendUrl } from "./api";
import { useStore } from "./store";

let es: EventSource | null = null;

export function subscribeNotifications(): () => void {
  const base = backendUrl();
  if (!base) return () => {};

  const me = useStore.getState().me;
  if (!me) return () => {};

  close();
  es = new EventSource(`${base}/api/notifications/stream`, {
    withCredentials: true,
  });
  const seen = new Set<string>();

  es.addEventListener("message", (evt) => {
    try {
      const data = JSON.parse((evt as { data?: string }).data ?? "null");
      if (data && data.id && !seen.has(data.id)) {
        seen.add(data.id);
        const { loadNotifications, toast } = useStore.getState();
        loadNotifications().catch(() => {});
        if (data.type === "generation_ready") {
          toast("Your playable is ready");
        } else if (data.type === "generation_failed") {
          toast("Generation failed");
        }
      }
    } catch {}
  });

  es.addEventListener("error", () => {
    // react-native-sse auto-reconnects on transient errors.
  });

  return close;
}

function close() {
  if (es) {
    try {
      es.close();
    } catch {}
    es = null;
  }
}
