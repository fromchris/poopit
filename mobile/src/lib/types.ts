// Mirror of app/lib/types.ts — kept byte-identical so the wire format
// matches what the Next.js backend serializes. Don't drift.

export type PlayableKind =
  | "bubble-pop"
  | "squishy-blob"
  | "rhythm-tap"
  | "color-splat"
  | "fidget-spinner"
  | "interactive-drama"
  | "tap-rain"
  | "match-pair"
  | "draw-pad"
  | "shake-mix"
  | "emoji-stamp"
  | "llm-bundle";

export type Playable = {
  id: string;
  kind: PlayableKind;
  title: string;
  description: string;
  author: {
    handle: string;
    avatar: string;
    avatarBg: string;
    isFollowing: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    remixes: number;
    plays: number;
  };
  tags: string[];
  theme: string;
  src?: string;
  liked?: boolean;
};
