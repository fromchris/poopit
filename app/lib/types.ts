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
    avatar: string; // emoji
    avatarBg: string; // tailwind gradient class
    isFollowing: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    remixes: number;
    plays: number;
  };
  tags: string[];
  /** theme gradient for the card background */
  theme: string;
  /** for interactive-drama: URL of the self-contained HTML bundle */
  src?: string;
  liked?: boolean;
};
