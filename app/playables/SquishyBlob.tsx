"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function SquishyBlob({ active }: { active: boolean }) {
  const [pressing, setPressing] = useState(false);
  const squish = useMotionValue(1);
  const scaleX = useSpring(squish, { stiffness: 260, damping: 12, mass: 0.6 });
  const scaleY = useTransform(scaleX, (v) => 2 - v);
  const rotate = useMotionValue(0);
  const wobble = useSpring(rotate, { stiffness: 60, damping: 6, mass: 1 });
  const eyeShift = useMotionValue(0);
  const eyeX = useSpring(eyeShift, { stiffness: 120, damping: 12 });

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) squish.set(1);
  }, [active, squish]);

  const handleDown = (x: number) => {
    setPressing(true);
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (x - rect.left - rect.width / 2) / (rect.width / 2); // -1..1
    squish.set(1.45);
    rotate.set(relX * 18);
    eyeShift.set(relX * 12);
  };
  const handleUp = () => {
    setPressing(false);
    squish.set(1);
    rotate.set(0);
    eyeShift.set(0);
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden no-select flex items-center justify-center"
      onPointerDown={(e) => handleDown(e.clientX)}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      onPointerCancel={handleUp}
    >
      {/* sparkles */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        {[...Array(18)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-white/80"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }}
            transition={{ duration: 2 + (i % 4) * 0.3, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>

      <motion.div
        style={{ scaleX, scaleY, rotate: wobble }}
        className="relative h-64 w-64 cursor-grab active:cursor-grabbing"
      >
        <div
          className="absolute inset-0 rounded-[45%_55%_48%_52%] shadow-[inset_-20px_-30px_60px_rgba(0,0,0,0.35),0_30px_80px_rgba(255,80,180,0.5)]"
          style={{
            background:
              "radial-gradient(circle at 32% 30%, #ffd3ea 0%, #ff7ac6 40%, #c23fff 100%)",
          }}
        />
        {/* cheeks */}
        <div className="absolute left-10 top-36 h-6 w-10 rounded-full bg-rose-400/70 blur-md" />
        <div className="absolute right-10 top-36 h-6 w-10 rounded-full bg-rose-400/70 blur-md" />
        {/* eyes */}
        <motion.div
          style={{ x: eyeX }}
          className="absolute left-1/2 top-24 flex -translate-x-1/2 gap-10"
        >
          <motion.div
            animate={{ scaleY: pressing ? 0.15 : 1 }}
            className="h-6 w-6 origin-center rounded-full bg-black"
          >
            <div className="absolute h-2 w-2 translate-x-1 translate-y-1 rounded-full bg-white" />
          </motion.div>
          <motion.div
            animate={{ scaleY: pressing ? 0.15 : 1 }}
            className="h-6 w-6 origin-center rounded-full bg-black"
          >
            <div className="absolute h-2 w-2 translate-x-1 translate-y-1 rounded-full bg-white" />
          </motion.div>
        </motion.div>
        {/* mouth */}
        <motion.div
          animate={{ scaleX: pressing ? 1.4 : 1, scaleY: pressing ? 0.6 : 1 }}
          className="absolute left-1/2 top-44 h-4 w-10 -translate-x-1/2 rounded-b-full bg-black"
        />
      </motion.div>

      <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 rounded-full bg-black/30 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/90 backdrop-blur">
        {pressing ? "squiiish~" : "press & hold"}
      </div>
    </div>
  );
}
