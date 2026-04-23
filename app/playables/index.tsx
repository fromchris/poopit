import type { PlayableKind } from "@/app/lib/types";
import { BubblePop } from "./BubblePop";
import { SquishyBlob } from "./SquishyBlob";
import { RhythmTap } from "./RhythmTap";
import { ColorSplat } from "./ColorSplat";
import { FidgetSpinner } from "./FidgetSpinner";
import { InteractiveDrama } from "./InteractiveDrama";
import { TapRain } from "./TapRain";
import { MatchPair } from "./MatchPair";
import { DrawPad } from "./DrawPad";
import { ShakeMix } from "./ShakeMix";
import { EmojiStamp } from "./EmojiStamp";
import { LlmBundle } from "./LlmBundle";

export function Playable({
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
    case "squishy-blob":
      return <SquishyBlob active={active} />;
    case "rhythm-tap":
      return <RhythmTap active={active} />;
    case "color-splat":
      return <ColorSplat active={active} />;
    case "fidget-spinner":
      return <FidgetSpinner active={active} />;
    case "interactive-drama":
      return <InteractiveDrama active={active} src={src ?? ""} />;
    case "tap-rain":
      return <TapRain active={active} />;
    case "match-pair":
      return <MatchPair active={active} />;
    case "draw-pad":
      return <DrawPad active={active} />;
    case "shake-mix":
      return <ShakeMix active={active} />;
    case "emoji-stamp":
      return <EmojiStamp active={active} />;
    case "llm-bundle":
      return <LlmBundle active={active} src={src ?? ""} />;
  }
}
