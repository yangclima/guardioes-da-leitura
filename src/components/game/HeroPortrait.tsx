"use client";

import { useEffect, useRef } from "react";
import { drawHero, type PoseState } from "@/game/render/drawHero";
import type { Hero } from "@/game/render/heroes";

interface HeroPortraitProps {
  hero: Hero;
  size?: number;
  animate?: boolean;
  state?: PoseState;
}

/** Live canvas preview of a hero, drawn with the same code the game uses. */
export function HeroPortrait({ hero, size = 120, animate = true, state = "idle" }: HeroPortraitProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const start = performance.now();
    const paint = (now: number) => {
      const t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const scale = size / 88;
      ctx.save();
      ctx.scale(scale, scale);
      drawHero(ctx, hero, 44, 84, { state, t, facing: 1, squash: 0 });
      ctx.restore();
      if (animate && !reduceMotion) raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [hero, size, animate, state]);

  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden="true" />;
}
