import type { Theme } from "@/lib/types";
import type { Solid } from "../core/types";
import { VIEW_H, VIEW_W } from "../core/types";
import { OUTLINE } from "./drawHero";

interface Palette {
  sky: [string, string];
  far: string;
  mid: string;
  near: string;
  groundTop: string;
  groundBody: string;
  groundDark: string;
  platform: string;
}

export const PALETTES: Record<Theme, Palette> = {
  floresta: { sky: ["#7cc8ff", "#e3f6ff"], far: "#9bd3b0", mid: "#4f9e6b", near: "#2f6f4a", groundTop: "#6fcf4a", groundBody: "#9a6440", groundDark: "#6e4429", platform: "#b07a4f" },
  deserto: { sky: ["#ff9f5a", "#ffe4a8"], far: "#f0b27a", mid: "#d9844a", near: "#b4622e", groundTop: "#f3d08a", groundBody: "#dba762", groundDark: "#b07c3e", platform: "#c0874a" },
  neve: { sky: ["#93b9f0", "#eef5ff"], far: "#dbe7f7", mid: "#a9c1e0", near: "#4f7a8f", groundTop: "#ffffff", groundBody: "#a5c8e8", groundDark: "#6f9cc4", platform: "#cfe3f5" },
  caverna: { sky: ["#151332", "#2f2a5c"], far: "#2a2552", mid: "#3a3270", near: "#4b3f87", groundTop: "#8b7fc7", groundBody: "#4b3f73", groundDark: "#2e2650", platform: "#6d5fb0" },
  ceu: { sky: ["#3f5f8f", "#a7bcd9"], far: "#8aa0c0", mid: "#6b84a8", near: "#506a90", groundTop: "#7ed36b", groundBody: "#7a5c46", groundDark: "#523b2b", platform: "#a98a6c" },
  espaco: { sky: ["#070720", "#28195a"], far: "#3b2a7a", mid: "#2b2160", near: "#1c1645", groundTop: "#c4c9de", groundBody: "#7d84a3", groundDark: "#565c7a", platform: "#9aa1bf" },
};

function noise(x: number, seed: number): number {
  return Math.sin(x * 0.0123 + seed) * 0.5 + Math.sin(x * 0.0311 + seed * 2.1) * 0.3 + Math.sin(x * 0.071 + seed * 3.7) * 0.2;
}

function ridge(ctx: CanvasRenderingContext2D, camX: number, factor: number, base: number, amp: number, color: string, seed: number, sharp: boolean): void {
  const offset = camX * factor;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  const step = sharp ? 48 : 24;
  const start = Math.floor(offset / step) * step - step;
  for (let wx = start; wx <= offset + VIEW_W + step; wx += step) {
    const n = sharp ? Math.abs(noise(wx, seed)) * 1.6 - 0.3 : noise(wx, seed);
    ctx.lineTo(wx - offset, base - n * amp);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
  ctx.fill();
}

function repeating(camX: number, factor: number, spacing: number, draw: (sx: number, i: number) => void): void {
  const offset = camX * factor;
  const first = Math.floor(offset / spacing) - 1;
  for (let i = first; i < first + Math.ceil(VIEW_W / spacing) + 3; i++) {
    draw(i * spacing - offset, i);
  }
}

function hash(i: number): number {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function tree(ctx: CanvasRenderingContext2D, x: number, base: number, size: number, color: string, snowy: boolean): void {
  ctx.fillStyle = "#5b3a24";
  ctx.fillRect(x - size * 0.08, base - size * 0.35, size * 0.16, size * 0.35);
  ctx.fillStyle = color;
  for (let k = 0; k < 3; k++) {
    const w = size * (0.55 - k * 0.12);
    const y = base - size * (0.3 + k * 0.25);
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x, y - size * 0.4);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
    if (snowy) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(x - w * 0.35, y - size * 0.26);
      ctx.lineTo(x, y - size * 0.4);
      ctx.lineTo(x + w * 0.35, y - size * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
    }
  }
}

export function drawBackground(ctx: CanvasRenderingContext2D, theme: Theme, camX: number, t: number): void {
  const p = PALETTES[theme];
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, p.sky[0]);
  sky.addColorStop(1, p.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  switch (theme) {
    case "floresta": {
      sun(ctx, 790, 90, 46, "#fff6b0");
      clouds(ctx, camX, t, "rgba(255,255,255,0.9)");
      ridge(ctx, camX, 0.1, 330, 60, p.far, 1, false);
      repeating(camX, 0.3, 70, (sx, i) => tree(ctx, sx + hash(i) * 30, 400, 90 + hash(i + 3) * 50, p.mid, false));
      repeating(camX, 0.55, 120, (sx, i) => bush(ctx, sx + hash(i) * 40, 470, 40 + hash(i + 9) * 25, p.near));
      break;
    }
    case "deserto": {
      sun(ctx, 200, 120, 60, "#fff1c2");
      ridge(ctx, camX, 0.08, 330, 40, p.far, 4, false);
      repeating(camX, 0.22, 420, (sx, i) => mesa(ctx, sx + hash(i) * 120, 390, 120 + hash(i + 1) * 120, 70 + hash(i + 2) * 60, p.mid));
      repeating(camX, 0.5, 260, (sx, i) => cactusSilhouette(ctx, sx + hash(i) * 120, 470, 40 + hash(i + 5) * 30, p.near));
      break;
    }
    case "neve": {
      ridge(ctx, camX, 0.08, 320, 140, p.far, 2, true);
      ridge(ctx, camX, 0.2, 380, 90, p.mid, 5, true);
      repeating(camX, 0.45, 90, (sx, i) => tree(ctx, sx + hash(i) * 40, 470, 80 + hash(i + 4) * 40, p.near, true));
      snow(ctx, t, camX);
      break;
    }
    case "caverna": {
      repeating(camX, 0.15, 80, (sx, i) => stalactite(ctx, sx + hash(i) * 30, 0, 50 + hash(i + 1) * 90, p.far));
      ridge(ctx, camX, 0.25, 420, 70, p.mid, 3, true);
      repeating(camX, 0.35, 230, (sx, i) => crystal(ctx, sx + hash(i) * 80, 440, 24 + hash(i + 2) * 30, i, t));
      repeating(camX, 0.5, 60, (sx, i) => stalactite(ctx, sx + hash(i) * 20, 0, 20 + hash(i + 7) * 50, p.near));
      break;
    }
    case "ceu": {
      clouds(ctx, camX * 0.5, t, "rgba(220,228,240,0.5)");
      ridge(ctx, camX, 0.12, 480, 30, p.far, 6, false);
      clouds(ctx, camX, t, "rgba(240,244,250,0.85)");
      rain(ctx, t);
      break;
    }
    case "espaco": {
      starfield(ctx, camX, t);
      planet(ctx, 760 - ((camX * 0.03) % 1200), 130, 60, "#f472b6", "#a21caf");
      planet(ctx, 260 - ((camX * 0.06) % 1400) + 700, 360, 28, "#38bdf8", "#1d4ed8");
      break;
    }
  }
}

function sun(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.2);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function clouds(ctx: CanvasRenderingContext2D, camX: number, t: number, color: string): void {
  ctx.fillStyle = color;
  repeating(camX + t * 12, 0.15, 320, (sx, i) => {
    const y = 50 + hash(i) * 120;
    const s = 0.7 + hash(i + 2) * 0.6;
    ctx.beginPath();
    for (const [dx, dy, rx, ry] of [[0, 0, 50, 18], [30, -12, 32, 22], [-26, -6, 26, 16]]) {
      ctx.moveTo(sx + (dx + rx) * s, y + dy * s);
      ctx.ellipse(sx + dx * s, y + dy * s, rx * s, ry * s, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  });
}

function bush(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, 0);
  ctx.arc(x + r * 0.9, y + 4, r * 0.7, Math.PI, 0);
  ctx.fill();
}

function mesa(ctx: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 20, base + 40);
  ctx.lineTo(x - w / 2, base - h);
  ctx.lineTo(x + w / 2, base - h);
  ctx.lineTo(x + w / 2 + 20, base + 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(x - w / 2, base - h, w, 8);
}

function cactusSilhouette(ctx: CanvasRenderingContext2D, x: number, base: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 6, base - h, 12, h, 6);
  ctx.roundRect(x - 18, base - h * 0.7, 8, h * 0.35, 4);
  ctx.roundRect(x - 18, base - h * 0.45, 14, 7, 3);
  ctx.roundRect(x + 10, base - h * 0.8, 8, h * 0.3, 4);
  ctx.roundRect(x + 4, base - h * 0.55, 14, 7, 3);
  ctx.fill();
}

function snow(ctx: CanvasRenderingContext2D, t: number, camX: number): void {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = 0; i < 70; i++) {
    const x = (hash(i) * VIEW_W * 1.5 - camX * 0.6 + Math.sin(t + i) * 20) % VIEW_W;
    const y = (hash(i + 50) * VIEW_H + t * (30 + hash(i + 9) * 40)) % VIEW_H;
    ctx.beginPath();
    ctx.arc(x < 0 ? x + VIEW_W : x, y, 1.2 + hash(i + 3) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function rain(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.strokeStyle = "rgba(220,235,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 80; i++) {
    const x = (hash(i) * VIEW_W + t * 120) % VIEW_W;
    const y = (hash(i + 40) * VIEW_H + t * 700) % VIEW_H;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y + 16);
  }
  ctx.stroke();
}

function stalactite(ctx: CanvasRenderingContext2D, x: number, top: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - h * 0.25, top);
  ctx.lineTo(x, top + h);
  ctx.lineTo(x + h * 0.25, top);
  ctx.closePath();
  ctx.fill();
}

function crystal(ctx: CanvasRenderingContext2D, x: number, base: number, h: number, i: number, t: number): void {
  const hue = [190, 280, 320][Math.abs(i) % 3];
  const glow = 0.5 + Math.sin(t * 2 + i) * 0.2;
  ctx.fillStyle = `hsla(${hue},90%,65%,${glow})`;
  ctx.beginPath();
  ctx.moveTo(x - h * 0.3, base);
  ctx.lineTo(x - h * 0.15, base - h);
  ctx.lineTo(x + h * 0.1, base - h * 1.2);
  ctx.lineTo(x + h * 0.3, base);
  ctx.closePath();
  ctx.fill();
}

function starfield(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  for (let layer = 1; layer <= 3; layer++) {
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 60; i++) {
      const seed = i + layer * 100;
      let x = (hash(seed) * VIEW_W * 2 - camX * 0.05 * layer) % VIEW_W;
      if (x < 0) x += VIEW_W;
      const y = hash(seed + 7) * VIEW_H;
      ctx.globalAlpha = 0.35 + Math.abs(Math.sin(t * (1 + hash(seed) * 2) + seed)) * 0.65;
      ctx.fillRect(x, y, layer * 0.8, layer * 0.8);
    }
  }
  ctx.globalAlpha = 1;
}

function planet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, light: string, dark: string): void {
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.6, r * 0.35, -0.3, 0, Math.PI * 2);
  ctx.stroke();
}

/** Ground blocks and floating platforms in world space (camera already applied). */
export function drawSolids(ctx: CanvasRenderingContext2D, theme: Theme, solids: readonly Solid[], camX: number): void {
  const p = PALETTES[theme];
  for (const s of solids) {
    if (s.x + s.w < camX - 20 || s.x > camX + VIEW_W + 20) continue;
    if (s.oneWay) {
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, 7);
      ctx.fillStyle = p.platform;
      ctx.fill();
      ctx.fillStyle = p.groundTop;
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, 7, [7, 7, 0, 0]);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = OUTLINE;
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, 7);
      ctx.stroke();
      continue;
    }
    const h = VIEW_H - s.y + 10;
    ctx.fillStyle = p.groundBody;
    ctx.fillRect(s.x, s.y, s.w, h);
    ctx.fillStyle = p.groundDark;
    for (let gx = Math.floor(s.x / 40) * 40; gx < s.x + s.w - 10; gx += 40) {
      if (gx < s.x) continue;
      for (let gy = s.y + 30; gy < VIEW_H; gy += 34) {
        const off = (gy / 34) % 2 === 0 ? 0 : 18;
        ctx.beginPath();
        ctx.arc(gx + off + 10, gy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = p.groundTop;
    ctx.fillRect(s.x, s.y, s.w, 12);
    for (let gx = s.x; gx < s.x + s.w; gx += 16) {
      ctx.beginPath();
      ctx.arc(gx + 8, s.y + 12, 8, 0, Math.PI);
      ctx.fill();
    }
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(s.x, VIEW_H + 10);
    ctx.lineTo(s.x, s.y);
    ctx.lineTo(s.x + s.w, s.y);
    ctx.lineTo(s.x + s.w, VIEW_H + 10);
    ctx.stroke();
  }
}

/** Decorative ground strip for flight segments. */
export function drawFlightFloor(ctx: CanvasRenderingContext2D, theme: Theme, camX: number): void {
  if (theme === "espaco" || theme === "ceu") return;
  const p = PALETTES[theme];
  ridge(ctx, camX, 1, VIEW_H - 40, 18, p.groundTop, 9, false);
}
