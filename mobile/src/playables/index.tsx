import type { PlayableKind } from "../lib/types";
import { BubblePop } from "./BubblePop";
import { StubPlayable } from "./Stub";

// Dispatcher. Mirrors app/playables/index.tsx on the web.
// Each kind that has a native impl is wired here; the rest fall
// through to StubPlayable until they're ported.

export function PlayableRenderer({
  kind,
  active,
}: {
  kind: PlayableKind;
  active: boolean;
  src?: string;
}) {
  switch (kind) {
    case "bubble-pop":
      return <BubblePop active={active} />;
    default:
      return <StubPlayable kind={kind} />;
  }
}
