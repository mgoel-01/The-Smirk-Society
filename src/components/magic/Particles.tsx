"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type Particle = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

/**
 * Suspended gold dust on a canvas, drifting upward and leaning towards the
 * pointer — the flecks of gulal and mirror-work that hang in the light over a
 * garba floor. Canvas rather than DOM nodes: a few hundred of these as
 * elements would thrash layout, whereas one canvas is a single composite.
 */
export function Particles({
  className,
  quantity = 90,
  staticity = 46,
  ease = 46,
  size = 0.5,
  color = "#e0b872",
  vy = -0.12,
}: {
  className?: string;
  quantity?: number;
  /** Higher = particles resist the pointer more. */
  staticity?: number;
  /** Higher = they drift back to rest more slowly. */
  ease?: number;
  size?: number;
  color?: string;
  /** Baseline vertical drift. Negative floats upward. */
  vy?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const frameRef = useRef(0);
  const reduced = useReducedMotion();

  const makeParticle = useCallback((): Particle => {
    const { w, h } = sizeRef.current;
    return {
      x: Math.floor(Math.random() * w),
      y: Math.floor(Math.random() * h),
      translateX: 0,
      translateY: 0,
      size: Math.floor(Math.random() * 2) + size,
      alpha: 0,
      targetAlpha: Number((Math.random() * 0.55 + 0.12).toFixed(2)),
      dx: (Math.random() - 0.5) * 0.14,
      dy: (Math.random() - 0.5) * 0.14,
      magnetism: 0.1 + Math.random() * 4,
    };
  }, [size]);

  const resize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!container || !canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { offsetWidth: w, offsetHeight: h } = container;
    sizeRef.current = { w, h };
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    particlesRef.current = Array.from({ length: quantity }, makeParticle);
  }, [quantity, makeParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;
    contextRef.current = canvas.getContext("2d");
    const rgb = hexToRgb(color).join(", ");
    resize();

    const onPointer = (event: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Offset from the centre, so dust near the pointer leans towards it.
      mouseRef.current = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
    };

    const observer = new ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("pointermove", onPointer, { passive: true });

    const draw = () => {
      const ctx = contextRef.current;
      const { w, h } = sizeRef.current;
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        // Fade in until the particle reaches its own ceiling, then dim as it
        // approaches any edge so nothing pops out of existence.
        const edge = Math.min(
          p.x + p.translateX,
          w - p.x - p.translateX,
          p.y + p.translateY,
          h - p.y - p.translateY,
        );
        const closeness = clamp(Number((edge / 20).toFixed(2)), 0, 1);
        p.alpha =
          closeness > 1
            ? Math.min(p.alpha + 0.02, p.targetAlpha)
            : p.targetAlpha * closeness;

        p.x += p.dx;
        p.y += p.dy + vy;
        p.translateX += (mouseRef.current.x / (staticity / p.magnetism) - p.translateX) / ease;
        p.translateY += (mouseRef.current.y / (staticity / p.magnetism) - p.translateY) / ease;

        ctx.save();
        ctx.translate(p.translateX, p.translateY);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${p.alpha})`;
        ctx.fill();
        ctx.restore();

        // Recycle anything that has drifted off the canvas.
        if (
          p.x < -p.size ||
          p.x > w + p.size ||
          p.y < -p.size ||
          p.y > h + p.size
        ) {
          Object.assign(p, makeParticle(), { y: vy < 0 ? h + p.size : -p.size });
        }
      }

      frameRef.current = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("pointermove", onPointer);
      observer.disconnect();
    };
  }, [resize, makeParticle, reduced, ease, staticity, vy, color]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string): number[] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
