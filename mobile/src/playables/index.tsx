// Dispatcher: kind → component. Mirrors app/playables/index.tsx.

import type { PlayableKind } from "../lib/types";
import { BubblePop } from "./BubblePop";
import { ColorSplat } from "./ColorSplat";
import { DrawPad } from "./DrawPad";
import { EmojiStamp } from "./EmojiStamp";
import { FidgetSpinner } from "./FidgetSpinner";
import { InteractiveDrama, LlmBundle } from "./InteractiveDrama";
import { MatchPair } from "./MatchPair";
import { RhythmTap } from "./RhythmTap";
import { ShakeMix } from "./ShakeMix";
import { SquishyBlob } from "./SquishyBlob";
import { StubPlayable } from "./Stub";
import { TapRain } from "./TapRain";

export function PlayableRenderer({
  kind,
  active,
  src,
}: {
  kind: PlayableKind;
  active: boolean;
  src?: string;
}) {
  switch (kind) {
    case "bubble-pop":
      return <BubblePop active={active} />;
    case "color-splat":
      return <ColorSplat />;
    case "draw-pad":
      return <DrawPad />;
    case "emoji-stamp":
      return <EmojiStamp />;
    case "fidget-spinner":
      return <FidgetSpinner />;
    case "interactive-drama":
      return <InteractiveDrama src={src} active={active} />;
    case "llm-bundle":
      return <LlmBundle src={src} active={active} />;
    case "match-pair":
      return <MatchPair />;
    case "rhythm-tap":
      return <RhythmTap active={active} />;
    case "shake-mix":
      return <ShakeMix active={active} />;
    case "squishy-blob":
      return <SquishyBlob />;
    case "tap-rain":
      return <TapRain active={active} />;
    default:
      return <StubPlayable kind={kind} />;
  }
}
