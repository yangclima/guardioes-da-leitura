import type { PowerShot, Rect } from "../core/types";
import { ink, OUTLINE } from "./paint";

export { drawSpike, drawWalker } from "./enemies";
export { drawFlyer } from "./flyers";

function fs(ctx: CanvasRenderingContext2D, fill: string, line = 2.2): void {
  ink(ctx, fill, line);
}

/** The magic shot: a glowing letter with a short comet tail. */
export function drawPower(ctx: CanvasRenderingContext2D, power: PowerShot, t: number): void {
  const dir = Math.sign(power.vx) || 1;
  const cx = power.x + power.w / 2;
  const cy = power.y + power.h / 2;
  const fade = Math.min(1, power.life * 6);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(cx, cy);
  const tail = ctx.createLinearGradient(0, 0, -dir * 46, 0);
  tail.addColorStop(0, "rgba(253,224,71,0.85)");
  tail.addColorStop(0.5, "rgba(196,181,253,0.45)");
  tail.addColorStop(1, "rgba(196,181,253,0)");
  ctx.fillStyle = tail;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.quadraticCurveTo(-dir * 30, -5, -dir * 46, 0);
  ctx.quadraticCurveTo(-dir * 30, 5, 0, 9);
  ctx.closePath();
  ctx.fill();
  const pulse = 1 + Math.sin(t * 20) * 0.1;
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 20 * pulse);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.45, "rgba(250,204,21,0.8)");
  glow.addColorStop(1, "rgba(167,139,250,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(Math.sin(t * 10) * 0.25);
  ctx.font = "900 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(power.glyph, 0, 1);
  ctx.fillStyle = "#fff7c2";
  ctx.fillText(power.glyph, 0, 1);
  ctx.restore();
}

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, seed: number): void {
  const bob = Math.sin(t * 3 + seed) * 4;
  const spin = Math.cos(t * 2.5 + seed);
  ctx.save();
  ctx.translate(x, y + bob);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
  glow.addColorStop(0, "rgba(255,230,120,0.65)");
  glow.addColorStop(1, "rgba(255,230,120,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.scale(0.35 + Math.abs(spin) * 0.65, 1);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 13 : 6;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  fs(ctx, spin > 0 ? "#facc15" : "#f59e0b", 2);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(-3, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The question gate: a stone arch (platform) or a glowing ring (flight). */
export function drawGate(ctx: CanvasRenderingContext2D, g: Rect, t: number, flight: boolean): void {
  const cx = g.x + g.w / 2;
  ctx.save();
  const swirl = ctx.createRadialGradient(cx, g.y + g.h / 2, 4, cx, g.y + g.h / 2, g.h / 2);
  swirl.addColorStop(0, "rgba(255,255,255,0.95)");
  swirl.addColorStop(0.4, "rgba(129,140,248,0.85)");
  swirl.addColorStop(1, "rgba(76,29,149,0.6)");
  if (flight) {
    ctx.beginPath();
    ctx.ellipse(cx, g.y + g.h / 2, g.w / 2 + 10, g.h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = swirl;
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#fbbf24";
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(g.x - 14, g.y + g.h);
    ctx.lineTo(g.x - 14, g.y + 40);
    ctx.arc(cx, g.y + 40, g.w / 2 + 14, Math.PI, 0);
    ctx.lineTo(g.x + g.w + 14, g.y + g.h);
    ctx.lineTo(g.x + g.w, g.y + g.h);
    ctx.lineTo(g.x + g.w, g.y + 40);
    ctx.arc(cx, g.y + 40, g.w / 2, 0, Math.PI, true);
    ctx.lineTo(g.x, g.y + g.h);
    ctx.closePath();
    fs(ctx, "#a8a29e", 2.5);
    ctx.beginPath();
    ctx.moveTo(g.x, g.y + g.h);
    ctx.lineTo(g.x, g.y + 40);
    ctx.arc(cx, g.y + 40, g.w / 2, Math.PI, 0);
    ctx.lineTo(g.x + g.w, g.y + g.h);
    ctx.closePath();
    ctx.fillStyle = swirl;
    ctx.fill();
  }
  ctx.translate(cx, g.y + g.h / 2 + (flight ? 0 : 10));
  ctx.rotate(t * 1.5);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, 12 + i * 10, i * 2, i * 2 + 2.2);
    ctx.stroke();
  }
  ctx.rotate(-t * 1.5);
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText("?", 0, Math.sin(t * 3) * 3);
  ctx.fillStyle = "#fde047";
  ctx.fillText("?", 0, Math.sin(t * 3) * 3);
  ctx.restore();
}
