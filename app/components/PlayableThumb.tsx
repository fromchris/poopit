"use client";

import type { PlayableKind } from "@/app/lib/types";

/**
 * Tiny static illustration for each playable kind. Used as grid poster so
 * the search/profile/author views don't all look like empty gradient squares.
 * We avoid rendering the real (possibly animated) playable here — expensive
 * and racy inside small thumbnails.
 */
export function PlayableThumb({
  kind,
  className = "",
  theme,
}: {
  kind: PlayableKind | string;
  className?: string;
  theme?: string;
}) {
  const bgClass = theme ? `bg-gradient-to-br ${theme}` : "";
  return (
    <div className={`relative h-full w-full overflow-hidden ${bgClass} ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.22),transparent_55%)]" />
      {kind === "bubble-pop" && <BubbleThumb />}
      {kind === "squishy-blob" && <SquishyThumb />}
      {kind === "rhythm-tap" && <RhythmThumb />}
      {kind === "color-splat" && <SplatThumb />}
      {kind === "fidget-spinner" && <SpinnerThumb />}
      {kind === "interactive-drama" && <DramaThumb />}
      {kind === "tap-rain" && <TapRainThumb />}
      {kind === "match-pair" && <MatchPairThumb />}
      {kind === "draw-pad" && <DrawPadThumb />}
      {kind === "shake-mix" && <ShakeMixThumb />}
      {kind === "emoji-stamp" && <EmojiStampThumb />}
      {kind === "llm-bundle" && <LlmBundleThumb />}
    </div>
  );
}

function BubbleThumb() {
  const bubbles = [
    { x: 22, y: 68, r: 14, h: 200 },
    { x: 58, y: 42, r: 20, h: 320 },
    { x: 72, y: 78, r: 10, h: 280 },
    { x: 40, y: 22, r: 12, h: 40 },
    { x: 80, y: 30, r: 8, h: 160 },
  ];
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      {bubbles.map((b, i) => (
        <circle
          key={i}
          cx={b.x}
          cy={b.y}
          r={b.r}
          fill={`hsla(${b.h},90%,75%,0.85)`}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={0.6}
        />
      ))}
    </svg>
  );
}

function SquishyThumb() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      <ellipse cx="50" cy="52" rx="32" ry="28" fill="url(#sq)" />
      <defs>
        <radialGradient id="sq" cx="0.35" cy="0.3">
          <stop offset="0%" stopColor="#ffd3ea" />
          <stop offset="60%" stopColor="#ff7ac6" />
          <stop offset="100%" stopColor="#c23fff" />
        </radialGradient>
      </defs>
      <circle cx="42" cy="46" r="3" fill="#111" />
      <circle cx="58" cy="46" r="3" fill="#111" />
      <path d="M42 60 Q50 68 58 60" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="36" cy="58" rx="4" ry="2" fill="rgba(255,80,130,0.55)" />
      <ellipse cx="64" cy="58" rx="4" ry="2" fill="rgba(255,80,130,0.55)" />
    </svg>
  );
}

function RhythmThumb() {
  const lanes = [
    { x: 15, fill: "#ff2d87" },
    { x: 38, fill: "#ffd23d" },
    { x: 61, fill: "#3dd9ff" },
    { x: 84, fill: "#9b5cff" },
  ];
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      {lanes.map((l, i) => (
        <g key={i}>
          <rect x={l.x - 8} y={78} width={16} height={10} rx={3} fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.35)" strokeWidth={0.6} />
          {[30, 50, 70].map((yy, j) => (
            <rect
              key={j}
              x={l.x - 6}
              y={yy - 3 + (i + j) * 2}
              width={12}
              height={4}
              rx={2}
              fill={l.fill}
              opacity={0.88}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

function SplatThumb() {
  const blobs = [
    { x: 32, y: 62, r: 18, h: 350 },
    { x: 58, y: 44, r: 22, h: 180 },
    { x: 50, y: 70, r: 14, h: 60 },
    { x: 70, y: 28, r: 10, h: 280 },
    { x: 20, y: 30, r: 12, h: 100 },
  ];
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      {blobs.map((b, i) => (
        <circle
          key={i}
          cx={b.x}
          cy={b.y}
          r={b.r}
          fill={`hsla(${b.h},90%,60%,0.55)`}
        />
      ))}
    </svg>
  );
}

function SpinnerThumb() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      <g transform="translate(50 50)">
        {[0, 120, 240].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <circle cx={0} cy={-22} r={11} fill="url(#sp)" />
            <circle cx={0} cy={-22} r={4} fill="#18181b" />
          </g>
        ))}
        <circle r={9} fill="url(#sp)" />
        <circle r={3} fill="#18181b" />
      </g>
      <defs>
        <radialGradient id="sp" cx="0.35" cy="0.3">
          <stop offset="0%" stopColor="#fafafa" />
          <stop offset="60%" stopColor="#a1a1aa" />
          <stop offset="100%" stopColor="#3f3f46" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function TapRainThumb() {
  const items = [
    { x: 20, y: 28, e: "🍓" },
    { x: 52, y: 18, e: "🍒" },
    { x: 78, y: 38, e: "🍎" },
    { x: 32, y: 58, e: "🥝" },
    { x: 68, y: 66, e: "🍇" },
  ];
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      {items.map((it, i) => (
        <text
          key={i}
          x={it.x}
          y={it.y}
          fontSize="14"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {it.e}
        </text>
      ))}
    </svg>
  );
}

function MatchPairThumb() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          {[0, 1].map((j) => (
            <rect
              key={j}
              x={10 + i * 21}
              y={22 + j * 33}
              width={18}
              height={26}
              rx={3}
              fill="rgba(255,255,255,0.12)"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.6"
            />
          ))}
        </g>
      ))}
      <text x="19" y="44" fontSize="9" textAnchor="middle" dominantBaseline="middle">🌸</text>
      <text x="61" y="78" fontSize="9" textAnchor="middle" dominantBaseline="middle">🌸</text>
    </svg>
  );
}

function DrawPadThumb() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      <path
        d="M12 70 C 22 55, 35 65, 45 50 S 70 45, 82 35"
        stroke="#ff2d87"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M20 85 C 32 72, 50 78, 68 62"
        stroke="#3dd9ff"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="80" cy="22" r="5" fill="#ffd23d" />
    </svg>
  );
}

function ShakeMixThumb() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      <rect x="36" y="18" width="28" height="12" rx="3" fill="rgba(255,255,255,0.6)" />
      <rect x="28" y="30" width="44" height="60" rx="10" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
      <rect x="30" y="56" width="40" height="32" rx="8" fill="url(#mxg)" />
      <defs>
        <linearGradient id="mxg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff82c0" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <circle cx="42" cy="64" r="2" fill="rgba(255,255,255,0.85)" />
      <circle cx="56" cy="70" r="1.6" fill="rgba(255,255,255,0.85)" />
      <circle cx="48" cy="76" r="2.5" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

function EmojiStampThumb() {
  const items = [
    { x: 22, y: 30, e: "🌟", r: -12 },
    { x: 56, y: 22, e: "💖", r: 8 },
    { x: 78, y: 40, e: "🦄", r: -20 },
    { x: 38, y: 60, e: "🌈", r: 18 },
    { x: 66, y: 72, e: "🍒", r: -8 },
    { x: 20, y: 80, e: "🔥", r: 14 },
  ];
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      {items.map((it, i) => (
        <text
          key={i}
          x={it.x}
          y={it.y}
          fontSize="15"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(${it.r} ${it.x} ${it.y})`}
        >
          {it.e}
        </text>
      ))}
    </svg>
  );
}

function LlmBundleThumb() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="llmg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2d87" />
          <stop offset="50%" stopColor="#ffd23d" />
          <stop offset="100%" stopColor="#3dd9ff" />
        </linearGradient>
      </defs>
      <path
        d="M50 18 L58 42 L82 50 L58 58 L50 82 L42 58 L18 50 L42 42 Z"
        fill="url(#llmg)"
      />
      <text x="50" y="53" fontSize="8" textAnchor="middle" fontWeight="800" fill="white">
        AI
      </text>
    </svg>
  );
}

function DramaThumb() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      <rect x="10" y="18" width="80" height="64" rx="4" fill="#1f140a" stroke="#c9a34f" strokeOpacity={0.4} strokeWidth={0.8} />
      <circle cx="50" cy="42" r="12" fill="#d4a85a" opacity={0.25} />
      <path d="M46 39 L58 45 L46 51 Z" fill="#c9a34f" />
      <g>
        <rect x="16" y="68" width="32" height="8" rx="2" fill="rgba(201,163,79,0.2)" stroke="rgba(201,163,79,0.45)" strokeWidth={0.4} />
        <rect x="52" y="68" width="32" height="8" rx="2" fill="rgba(201,163,79,0.2)" stroke="rgba(201,163,79,0.45)" strokeWidth={0.4} />
      </g>
      <text x="18" y="26" fontSize="5.5" fill="#c9a34f" fontWeight="700">互动剧集</text>
    </svg>
  );
}
