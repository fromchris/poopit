"use client";

import { useEffect, useRef } from "react";

type Splat = { x: number; y: number; r: number; hue: number; life: number };

export function ColorSplat({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const splatsRef = useRef<Splat[]>([]);
  const lastRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const hueRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const tick = () => {
      ctx.fillStyle = "rgba(0,0,0,0.045)";
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      const keep: Splat[] = [];
      for (const s of splatsRef.current) {
        const alpha = Math.min(1, s.life / 60);
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue},90%,60%,${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        s.life -= 1;
        s.r += 0.4;
        if (s.life > 0) keep.push(s);
      }
      splatsRef.current = keep;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (!active) splatsRef.current = [];
  }, [active]);

  const addSplat = (x: number, y: number, speed: number) => {
    hueRef.current = (hueRef.current + 11) % 360;
    const count = 1 + Math.floor(speed / 30);
    for (let i = 0; i < count; i++) {
      splatsRef.current.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        r: 18 + Math.random() * 18,
        hue: (hueRef.current + i * 40) % 360,
        life: 120 + Math.random() * 60,
      });
    }
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!e.buttons && e.pointerType === "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    const last = lastRef.current;
    const speed = last ? Math.hypot(x - last.x, y - last.y) / Math.max(1, now - last.t) * 16 : 0;
    addSplat(x, y, speed);
    lastRef.current = { x, y, t: now };
  };

  return (
    <div className="relative h-full w-full overflow-hidden no-select">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const rect = e.currentTarget.getBoundingClientRect();
          addSplat(e.clientX - rect.left, e.clientY - rect.top, 50);
          lastRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() };
        }}
        onPointerMove={handleMove}
        onPointerUp={() => (lastRef.current = null)}
      />
      <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
        drag to paint · flick to splat
      </div>
    </div>
  );
}
