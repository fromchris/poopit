"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shake-the-cocktail. Drag up/down rapidly to "shake" the shaker — the
 * mixer inside bubbles up & changes color. On desktop, rapid up/down mouse
 * drag works the same. Devicemotion on mobile can also drive shake energy.
 */
export function ShakeMix({ active }: { active: boolean }) {
  const [energy, setEnergy] = useState(0);
  const lastY = useRef<number | null>(null);
  const lastT = useRef<number>(0);
  const energyDecayRef = useRef<number>(0);
  const y = useMotionValue(0);
  const yS = useSpring(y, { stiffness: 220, damping: 12 });

  // Passive decay.
  useEffect(() => {
    const iv = setInterval(() => {
      setEnergy((e) => {
        const next = Math.max(0, e - 0.04);
        energyDecayRef.current = next;
        return next;
      });
    }, 120);
    return () => clearInterval(iv);
  }, []);

  // Optional devicemotion-based shaking (mobile).
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined" || !("ondevicemotion" in window)) return;
    const h = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.min(1, Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) / 20);
      setEnergy((v) => Math.min(1, v + mag * 0.1));
    };
    window.addEventListener("devicemotion", h);
    return () => window.removeEventListener("devicemotion", h);
  }, [active]);

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    lastY.current = e.clientY;
    lastT.current = performance.now();
  };
  const onMove = (e: React.PointerEvent) => {
    if (lastY.current == null) return;
    const dy = e.clientY - lastY.current;
    const dt = Math.max(1, performance.now() - lastT.current);
    const v = Math.abs(dy) / dt;
    setEnergy((val) => Math.min(1, val + v * 0.08));
    y.set(Math.max(-30, Math.min(30, dy * 0.4)));
    lastY.current = e.clientY;
    lastT.current = performance.now();
  };
  const onUp = () => {
    lastY.current = null;
    y.set(0);
  };

  const hue = Math.floor(energy * 280) + 40; // 40 → 320 range
  const fillPct = 35 + energy * 60;

  const bubbles = useBubbles(energy);

  const mix = useCallback(() => {
    setEnergy((e) => Math.min(1, e + 0.12));
  }, []);

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden no-select"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 text-center">
        <div className="text-[11px] font-bold tracking-widest text-white/70">SHAKE IT</div>
        <div className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-white/15">
          <motion.div
            animate={{ width: `${energy * 100}%` }}
            className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-amber-400"
          />
        </div>
      </div>

      <motion.div
        style={{ y: yS }}
        className="relative h-[340px] w-[180px]"
        onDoubleClick={mix}
      >
        {/* shaker body */}
        <div
          className="absolute inset-x-0 bottom-0 h-[70%] overflow-hidden rounded-3xl border-2 border-white/30"
          style={{
            background: `linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.05))`,
            boxShadow: "inset 0 -30px 40px rgba(0,0,0,0.35), 0 10px 40px rgba(0,0,0,0.4)",
          }}
        >
          {/* liquid */}
          <motion.div
            animate={{ height: `${fillPct}%` }}
            transition={{ type: "spring", damping: 14, stiffness: 120 }}
            className="absolute inset-x-0 bottom-0"
            style={{
              background: `linear-gradient(180deg, hsla(${hue},85%,70%,0.85), hsla(${hue},85%,45%,0.95))`,
            }}
          />
          {bubbles.map((b) => (
            <motion.span
              key={b.id}
              initial={{ bottom: "0%", opacity: 0 }}
              animate={{ bottom: "90%", opacity: [0, 1, 0] }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute h-2 w-2 rounded-full bg-white/80"
              style={{ left: `${b.x}%` }}
            />
          ))}
        </div>
        {/* shaker neck + cap */}
        <div className="absolute inset-x-[22%] top-10 h-14 rounded-t-xl border-2 border-white/30 bg-white/10 backdrop-blur" />
        <div className="absolute left-1/2 top-2 h-8 w-24 -translate-x-1/2 rounded-xl bg-white/30 shadow-md" />
      </motion.div>

      <div className="pointer-events-none absolute bottom-40 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
        drag up/down · or shake your phone
      </div>
    </div>
  );
}

function useBubbles(energy: number) {
  const [b, setB] = useState<{ id: number; x: number }[]>([]);
  const idRef = useRef(0);
  useEffect(() => {
    if (energy <= 0.05) return;
    const ivMs = Math.max(80, 320 - energy * 240);
    const iv = setInterval(() => {
      setB((cur) => [
        ...cur.slice(-9),
        { id: idRef.current++, x: 10 + Math.random() * 80 },
      ]);
    }, ivMs);
    return () => clearInterval(iv);
  }, [energy]);
  return b;
}
