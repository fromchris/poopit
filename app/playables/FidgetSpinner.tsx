"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function FidgetSpinner({ active }: { active: boolean }) {
  const rotation = useMotionValue(0);
  const angVelRef = useRef(0);
  const lastAngleRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const draggingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [rpm, setRpm] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (!draggingRef.current) {
        rotation.set(rotation.get() + angVelRef.current);
        // friction
        angVelRef.current *= 0.988;
        if (Math.abs(angVelRef.current) < 0.002) angVelRef.current = 0;
      }
      setRpm(Math.round(Math.abs(angVelRef.current) * 9.55));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rotation]);

  useEffect(() => {
    if (!active) angVelRef.current = 0;
  }, [active]);

  const angleFromPointer = (x: number, y: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(y - cy, x - cx);
  };

  const handleDown = (x: number, y: number) => {
    draggingRef.current = true;
    lastAngleRef.current = angleFromPointer(x, y);
    lastTimeRef.current = performance.now();
  };
  const handleMove = (x: number, y: number) => {
    if (!draggingRef.current) return;
    const a = angleFromPointer(x, y);
    if (lastAngleRef.current === null) {
      lastAngleRef.current = a;
      return;
    }
    let d = a - lastAngleRef.current;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    rotation.set(rotation.get() + (d * 180) / Math.PI);
    angVelRef.current = ((d * 180) / Math.PI) * (16 / dt); // deg per frame
    lastAngleRef.current = a;
    lastTimeRef.current = now;
  };
  const handleUp = () => {
    draggingRef.current = false;
    lastAngleRef.current = null;
  };

  const bg = useTransform(rotation, (r) => `conic-gradient(from ${r}deg, #3dd9ff, #9b5cff, #ff2d87, #ffd23d, #3dd9ff)`);

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden no-select flex items-center justify-center"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handleDown(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      {/* ambient glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: bg }}
      />

      <motion.div
        style={{ rotate: rotation }}
        className="relative h-72 w-72 touch-none"
      >
        {/* three arms */}
        {[0, 120, 240].map((deg) => (
          <div
            key={deg}
            className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-72px)`,
              background:
                "radial-gradient(circle at 35% 30%, #f4f4f5 0%, #a1a1aa 55%, #3f3f46 100%)",
              boxShadow:
                "inset -6px -8px 16px rgba(0,0,0,0.55), inset 6px 6px 14px rgba(255,255,255,0.5), 0 12px 32px rgba(0,0,0,0.55)",
            }}
          >
            <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 ring-2 ring-zinc-700" />
          </div>
        ))}
        {/* center hub */}
        <div
          className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #ffffff 0%, #9ca3af 60%, #27272a 100%)",
            boxShadow:
              "inset -4px -6px 14px rgba(0,0,0,0.55), inset 4px 4px 10px rgba(255,255,255,0.7), 0 10px 24px rgba(0,0,0,0.6)",
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 ring-2 ring-zinc-600" />
        </div>
      </motion.div>

      <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-white/95 backdrop-blur">
        {rpm > 0 ? `${rpm} RPM` : "flick to spin"}
      </div>
    </div>
  );
}
