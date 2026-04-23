"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const ICONS = ["🌸", "🌈", "🍣", "🦋", "🌙", "🍑", "🐌", "🧸"];

type Card = { id: number; face: string; flipped: boolean; matched: boolean };

function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function deal(): Card[] {
  const faces = ICONS.slice(0, 6);
  const doubled = [...faces, ...faces].map((f, i) => ({
    id: i,
    face: f,
    flipped: false,
    matched: false,
  }));
  return shuffle(doubled);
}

export function MatchPair({ active }: { active: boolean }) {
  const [cards, setCards] = useState<Card[]>(() => deal());
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const done = useMemo(() => cards.every((c) => c.matched), [cards]);

  useEffect(() => {
    if (!active) {
      setCards(deal());
      setSelected([]);
      setMoves(0);
    }
  }, [active]);

  useEffect(() => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    const ca = cards.find((c) => c.id === a);
    const cb = cards.find((c) => c.id === b);
    if (!ca || !cb) return setSelected([]);
    setMoves((m) => m + 1);
    if (ca.face === cb.face) {
      setTimeout(() => {
        setCards((cs) =>
          cs.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c))
        );
        setSelected([]);
      }, 280);
    } else {
      setTimeout(() => {
        setCards((cs) =>
          cs.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c))
        );
        setSelected([]);
      }, 700);
    }
  }, [selected, cards]);

  const flip = (id: number) => {
    if (selected.length >= 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setSelected((s) => [...s, id]);
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden no-select px-5">
      <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 text-center">
        <div className="text-sm font-bold tracking-widest text-white/80">
          MATCH PAIRS
        </div>
        <div className="text-[11px] text-white/60">moves {moves}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => flip(c.id)}
            className="relative aspect-square w-[60px]"
            style={{ perspective: 600 }}
          >
            <motion.div
              animate={{ rotateY: c.flipped || c.matched ? 180 : 0 }}
              transition={{ duration: 0.35 }}
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/10 text-2xl shadow-md backdrop-blur"
                style={{ backfaceVisibility: "hidden" }}
              >
                ?
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-amber-400 text-2xl shadow-md"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  opacity: c.matched ? 0.55 : 1,
                }}
              >
                {c.face}
              </div>
            </motion.div>
          </button>
        ))}
      </div>
      {done && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-black"
        >
          🎉 cleared in {moves} moves — tap to replay
        </motion.div>
      )}
      {done && (
        <button
          onClick={() => {
            setCards(deal());
            setSelected([]);
            setMoves(0);
          }}
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black"
        >
          Play again
        </button>
      )}
    </div>
  );
}
