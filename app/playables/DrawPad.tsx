"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = [
  "#ff2d87",
  "#ffd23d",
  "#3dd9ff",
  "#9b5cff",
  "#6afd76",
  "#ffffff",
  "#111827",
];

/**
 * Free-draw pad. Finger/mouse paints with the chosen color + brush size.
 * Undo by timestamp (keeps last 30 strokes).
 */
export function DrawPad({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [color, setColor] = useState(COLORS[0]!);
  const [size, setSize] = useState(8);
  const strokesRef = useRef<ImageData[]>([]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (!active) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    // Fresh canvas when activated so you don't show last user's doodle.
    ctx.clearRect(0, 0, 9999, 9999);
  }, [active]);

  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const pushSnapshot = () => {
    const ctx = ctxRef.current;
    const c = canvasRef.current;
    if (!ctx || !c) return;
    const snap = ctx.getImageData(0, 0, c.width, c.height);
    const arr = strokesRef.current;
    arr.push(snap);
    if (arr.length > 30) arr.shift();
  };

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawing.current = true;
    last.current = { x, y };
    pushSnapshot();
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = ctxRef.current;
    if (!ctx || !last.current) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
  };

  const onUp = () => {
    drawing.current = false;
    last.current = null;
  };

  const undo = () => {
    const ctx = ctxRef.current;
    const snap = strokesRef.current.pop();
    if (!ctx || !snap) return;
    ctx.putImageData(snap, 0, 0);
  };

  const clear = () => {
    const ctx = ctxRef.current;
    const c = canvasRef.current;
    if (!ctx || !c) return;
    pushSnapshot();
    ctx.clearRect(0, 0, c.width, c.height);
  };

  return (
    <div className="relative h-full w-full overflow-hidden no-select">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      <div className="pointer-events-auto absolute left-1/2 top-24 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 p-1.5 backdrop-blur">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={c}
            className={`h-6 w-6 rounded-full transition ${
              color === c ? "ring-2 ring-white scale-110" : ""
            }`}
            style={{ background: c }}
          />
        ))}
      </div>

      <div className="pointer-events-auto absolute left-1/2 top-36 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-3 py-1 backdrop-blur">
        <span className="text-[10px] font-bold text-white/70">BRUSH</span>
        <input
          type="range"
          min={2}
          max={32}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="h-1 w-24 accent-pink-500"
        />
      </div>

      <div className="pointer-events-auto absolute bottom-40 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        <button
          onClick={undo}
          className="rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur"
        >
          ↶ undo
        </button>
        <button
          onClick={clear}
          className="rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur"
        >
          clear
        </button>
      </div>
    </div>
  );
}
