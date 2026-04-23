"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Note = { id: string; lane: number; spawnedAt: number };

const LANES = 4;
const LANE_COLORS = ["#ff2d87", "#ffd23d", "#3dd9ff", "#9b5cff"];
const BEAT_MS = 600;
const TRAVEL_MS = 1800;

export function RhythmTap({ active }: { active: boolean }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [judge, setJudge] = useState<"PERFECT" | "GOOD" | "MISS" | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setNotes([]);
      setScore(0);
      setCombo(0);
      return;
    }
    const t = setInterval(() => {
      setNotes((n) => [
        ...n,
        {
          id: `n-${Date.now()}-${idRef.current++}`,
          lane: Math.floor(Math.random() * LANES),
          spawnedAt: performance.now(),
        },
      ]);
    }, BEAT_MS);
    return () => clearInterval(t);
  }, [active]);

  // Auto-miss notes that passed the hit line
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      const now = performance.now();
      setNotes((n) => {
        const expired = n.filter((x) => now - x.spawnedAt > TRAVEL_MS + 250);
        if (expired.length) {
          setCombo(0);
          setJudge("MISS");
        }
        return n.filter((x) => now - x.spawnedAt <= TRAVEL_MS + 250);
      });
    }, 120);
    return () => clearInterval(t);
  }, [active]);

  const tap = useCallback((lane: number) => {
    const now = performance.now();
    setNotes((n) => {
      const hittable = n
        .filter((x) => x.lane === lane)
        .sort((a, b) => Math.abs(TRAVEL_MS - (now - a.spawnedAt)) - Math.abs(TRAVEL_MS - (now - b.spawnedAt)));
      if (!hittable.length) return n;
      const best = hittable[0];
      const age = now - best.spawnedAt;
      const delta = Math.abs(age - TRAVEL_MS);
      if (delta > 300) return n; // too far
      if (delta < 120) {
        setScore((s) => s + 100);
        setCombo((c) => c + 1);
        setJudge("PERFECT");
      } else {
        setScore((s) => s + 40);
        setCombo((c) => c + 1);
        setJudge("GOOD");
      }
      return n.filter((x) => x.id !== best.id);
    });
  }, []);

  useEffect(() => {
    if (!judge) return;
    const t = setTimeout(() => setJudge(null), 450);
    return () => clearTimeout(t);
  }, [judge]);

  return (
    <div className="relative h-full w-full overflow-hidden no-select">
      {/* HUD */}
      <div className="pointer-events-none absolute left-0 right-0 top-20 flex flex-col items-center">
        <div className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]">
          {score.toLocaleString()}
        </div>
        {combo > 2 && (
          <div className="mt-1 rounded-full bg-black/30 px-3 py-0.5 text-xs font-bold text-white backdrop-blur">
            {combo} COMBO
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {judge && (
            <motion.div
              key={judge + score}
              initial={{ y: 8, scale: 0.6, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`mt-2 text-2xl font-black tracking-wider drop-shadow-md ${
                judge === "PERFECT"
                  ? "text-yellow-300"
                  : judge === "GOOD"
                  ? "text-cyan-200"
                  : "text-rose-300"
              }`}
            >
              {judge}!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* lanes — keep pads above caption (~11rem) + tab bar (5rem) */}
      <div className="absolute bottom-52 left-2 right-2 top-44 flex">
        {[...Array(LANES)].map((_, lane) => (
          <div
            key={lane}
            className="relative flex-1 border-r border-white/5 last:border-r-0"
          >
            <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/5 to-transparent" />
            {/* hit line */}
            <div
              className="absolute inset-x-2 bottom-20 h-1 rounded-full opacity-70"
              style={{ background: LANE_COLORS[lane] }}
            />
            <AnimatePresence>
              {notes
                .filter((n) => n.lane === lane)
                .map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ top: "-10%", opacity: 0 }}
                    animate={{ top: "calc(100% - 5rem - 14px)", opacity: 1 }}
                    exit={{ scale: 1.6, opacity: 0 }}
                    transition={{ top: { duration: TRAVEL_MS / 1000, ease: "linear" }, default: { duration: 0.15 } }}
                    className="absolute left-1/2 h-7 w-16 -translate-x-1/2 rounded-full shadow-lg"
                    style={{
                      background: `linear-gradient(180deg, ${LANE_COLORS[lane]}ff 0%, ${LANE_COLORS[lane]}99 100%)`,
                      boxShadow: `0 0 24px ${LANE_COLORS[lane]}88`,
                    }}
                  />
                ))}
            </AnimatePresence>
            {/* tap button */}
            <button
              onPointerDown={() => tap(lane)}
              className="absolute inset-x-2 bottom-2 h-14 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md active:scale-95 transition"
              style={{ boxShadow: `inset 0 0 24px ${LANE_COLORS[lane]}55` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
