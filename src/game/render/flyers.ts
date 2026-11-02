import type { Flyer } from "../core/types";
import { ballGrad, cartoonEye, gloss, hitFlash, ink, OUTLINE, shade, vGrad } from "./paint";

/**
 * A wing drawn pointing up from the shoulder at (0, 0) and rotated to flap.
 * Rotating (instead of squashing) keeps it readable in every frame.
 */
function wing(ctx: CanvasRenderingContext2D, angle: number, span: number, color: string, membrane: boolean): void {
  ctx.save();
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-5, 2);
  ctx.quadraticCurveTo(-span * 0.15, -span * 0.65, -span * 0.32, -span);
  if (membrane) {
    ctx.quadraticCurveTo(-span * 0.08, -span * 0.82, span * 0.12, -span * 0.86);
    ctx.quadraticCurveTo(span * 0.1, -span * 0.58, span * 0.3, -span * 0.52);
    ctx.quadraticCurveTo(span * 0.18, -span * 0.25, span * 0.34, -span * 0.12);
    ctx.quadraticCurveTo(span * 0.15, -span * 0.02, 6, 2);
  } else {
    // Trailing edge with three feather tips.
    ctx.quadraticCurveTo(-span * 0.12, -span * 0.86, -span * 0.04, -span * 0.84);
    ctx.lineTo(-span * 0.06, -span * 0.66);
    ctx.quadraticCurveTo(span * 0.05, -span * 0.64, span * 0.14, -span * 0.6);
    ctx.lineTo(span * 0.08, -span * 0.42);
    ctx.quadraticCurveTo(span * 0.18, -span * 0.38, span * 0.26, -span * 0.32);
    ctx.quadraticCurveTo(span * 0.18, -span * 0.08, 5, 2);
  }
  ctx.closePath();
  ink(ctx, vGrad(ctx, -span, 2, color, 35, -25), 2.2);
  ctx.strokeStyle = shade(color, -45);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (membrane) {
    ctx.moveTo(-span * 0.3, -span * 0.96);
    ctx.lineTo(span * 0.12, -span * 0.84);
    ctx.moveTo(-span * 0.22, -span * 0.7);
    ctx.lineTo(span * 0.3, -span * 0.5);
    ctx.moveTo(-span * 0.1, -span * 0.4);
    ctx.lineTo(span * 0.32, -span * 0.13);
  } else {
    ctx.moveTo(-span * 0.02, -span * 0.2);
    ctx.lineTo(-span * 0.12, -span * 0.7);
    ctx.moveTo(span * 0.08, -span * 0.16);
    ctx.lineTo(span * 0.04, -span * 0.48);
  }
  ctx.stroke();
  ctx.restore();
}

/** Flap angle: wings sweep from up-forward to back-down. */
function flapAngle(t: number, speed: number, phase: number): number {
  return -0.35 + Math.sin(t * speed + phase) * 1.05;
}

function drawBird(ctx: CanvasRenderingContext2D, t: number, f: Flyer): void {
  const a = flapAngle(t, 13, f.phase);
  ctx.save();
  ctx.translate(-2, -4);
  wing(ctx, a - 0.25, 20, "#0369a1", false);
  ctx.restore();
  // Tail feathers
  ctx.beginPath();
  ctx.moveTo(-13, -1);
  ctx.lineTo(-27, -7);
  ctx.lineTo(-24, 0);
  ctx.lineTo(-28, 6);
  ctx.closePath();
  ink(ctx, "#0369a1", 2);
  ctx.beginPath();
  ctx.ellipse(0, 1, 17, 13, 0, 0, Math.PI * 2);
  ink(ctx, ballGrad(ctx, 0, 1, 17, "#38bdf8", 50, -40), 2.6);
  ctx.fillStyle = "#e0f2fe";
  ctx.beginPath();
  ctx.ellipse(5, 6, 10, 6.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4, -11);
  ctx.quadraticCurveTo(-3, -19, 1, -13);
  ctx.quadraticCurveTo(4, -20, 5, -12);
  ink(ctx, "#38bdf8", 2);
  ctx.beginPath();
  ctx.moveTo(15, -4);
  ctx.lineTo(26, 0);
  ctx.lineTo(15, 4);
  ctx.closePath();
  ink(ctx, "#f59e0b", 2);
  cartoonEye(ctx, 8, -3, 3.6, 4.2, "#1e293b", 0.6);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(3, -9.5);
  ctx.lineTo(12.5, -6.5);
  ctx.stroke();
  ctx.save();
  ctx.translate(-3, -1);
  wing(ctx, a, 22, "#0ea5e9", false);
  ctx.restore();
}

function drawPtero(ctx: CanvasRenderingContext2D, t: number, f: Flyer): void {
  const a = flapAngle(t, 8, f.phase);
  const skin = "#ea580c";
  ctx.save();
  ctx.translate(-2, -3);
  wing(ctx, a - 0.3, 34, shade(skin, -35), true);
  ctx.restore();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.lineTo(-15, 13);
  ctx.moveTo(-3, 7);
  ctx.lineTo(-8, 15);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-3, 1, 14, 8, -0.1, 0, Math.PI * 2);
  ink(ctx, ballGrad(ctx, -3, 1, 14, skin, 40, -40));
  ctx.fillStyle = "#fed7aa";
  ctx.beginPath();
  ctx.ellipse(-1, 5, 9, 3.2, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Head: crest pointing back, long beak forward.
  ctx.beginPath();
  ctx.moveTo(9, -8);
  ctx.lineTo(-6, -19);
  ctx.lineTo(13, -12);
  ctx.closePath();
  ink(ctx, "#b91c1c", 2);
  ctx.beginPath();
  ctx.ellipse(13, -6, 7.5, 6.5, 0, 0, Math.PI * 2);
  ink(ctx, ballGrad(ctx, 13, -6, 7.5, skin, 40, -30), 2.2);
  ctx.beginPath();
  ctx.moveTo(18, -9);
  ctx.lineTo(37, -3);
  ctx.lineTo(18, -1);
  ctx.closePath();
  ink(ctx, "#fbbf24", 2);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(19, -4);
  ctx.lineTo(33, -3);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(14, -8, 2.6, 2.4, 0, 0, Math.PI * 2);
  ink(ctx, "#fde047", 1.4);
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(14.2, -10, 1.3, 4);
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(10, -12);
  ctx.lineTo(18, -10.5);
  ctx.stroke();
  ctx.save();
  ctx.translate(-4, -2);
  wing(ctx, a, 38, skin, true);
  ctx.restore();
}

function drawBat(ctx: CanvasRenderingContext2D, t: number, f: Flyer): void {
  const a = Math.sin(t * 16 + f.phase) * 0.55;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.translate(5, -2);
    wing(ctx, 1.25 + a, 26, "#4c1d95", true);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(-7, -7);
  ctx.lineTo(-9, -18);
  ctx.lineTo(-2, -10);
  ctx.moveTo(7, -7);
  ctx.lineTo(9, -18);
  ctx.lineTo(2, -10);
  ink(ctx, "#6d28d9", 2);
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 11, 0, 0, Math.PI * 2);
  ink(ctx, ballGrad(ctx, 0, 0, 11, "#7c3aed", 40, -40), 2.4);
  ctx.fillStyle = "#c4b5fd";
  ctx.beginPath();
  ctx.ellipse(0, 4, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const glow = 0.7 + Math.sin(t * 6 + f.phase) * 0.3;
  for (const ex of [-3.8, 3.8]) {
    ctx.fillStyle = `rgba(248,113,113,${glow})`;
    ctx.beginPath();
    ctx.ellipse(ex, -2, 2.6, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(ex - 0.5, -3, 1, 1);
  }
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(-3, 3);
  ctx.lineTo(-2, 6.5);
  ctx.lineTo(-1, 3);
  ctx.moveTo(1, 3);
  ctx.lineTo(2, 6.5);
  ctx.lineTo(3, 3);
  ctx.fill();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, t: number, f: Flyer): void {
  const heavy = f.hp <= 0;
  const base = heavy ? "#57534e" : "#a8805a";
  ctx.save();
  ctx.rotate(t * (heavy ? 0.3 : 0.7) + f.phase);
  ctx.beginPath();
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = f.r * (1.05 + Math.sin(i * 2.7 + f.phase * 3) * 0.12);
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ink(ctx, ballGrad(ctx, 0, 0, f.r, base, 45, -55), 2.8);
  ctx.clip();
  for (const [cx, cy, cr] of [[-0.35, -0.2, 0.26], [0.35, 0.3, 0.2], [0.05, 0.5, 0.13], [0.4, -0.4, 0.12]] as const) {
    ctx.fillStyle = shade(base, -40);
    ctx.beginPath();
    ctx.arc(cx * f.r, cy * f.r, cr * f.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = shade(base, 35);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx * f.r, cy * f.r, cr * f.r, 0.2, Math.PI * 0.9);
    ctx.stroke();
  }
  if (heavy) {
    // Metal veins mark the rocks the magic cannot break.
    ctx.strokeStyle = "rgba(148,163,184,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-f.r * 0.8, f.r * 0.1);
    ctx.lineTo(-f.r * 0.2, -f.r * 0.05);
    ctx.lineTo(f.r * 0.3, f.r * 0.2);
    ctx.lineTo(f.r * 0.9, -f.r * 0.1);
    ctx.stroke();
  }
  ctx.restore();
  gloss(ctx, -f.r * 0.35, -f.r * 0.45, f.r * 0.22, f.r * 0.1, -0.6, 0.35);
}

function drawStorm(ctx: CanvasRenderingContext2D, t: number, f: Flyer): void {
  const flash = Math.sin(t * 5 + f.phase) > 0.55;
  if (flash) {
    const g = ctx.createRadialGradient(0, 30, 4, 0, 30, 46);
    g.addColorStop(0, "rgba(253,224,71,0.5)");
    g.addColorStop(1, "rgba(253,224,71,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 30, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, 16);
    ctx.lineTo(-9, 36);
    ctx.lineTo(1, 34);
    ctx.lineTo(-6, 56);
    ctx.lineTo(13, 28);
    ctx.lineTo(3, 30);
    ctx.lineTo(11, 16);
    ctx.closePath();
    ink(ctx, "#fde047", 1.8);
  }
  ctx.strokeStyle = "rgba(186,230,253,0.7)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const dx = -24 + i * 12;
    const dy = 18 + ((t * 90 + i * 13) % 26);
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx - 3, dy + 7);
  }
  ctx.stroke();
  const puffs: [number, number, number][] = [[-24, 4, 17], [-8, -9, 21], [13, -6, 19], [27, 6, 14], [0, 9, 18], [-16, 11, 13], [17, 11, 13]];
  ctx.beginPath();
  for (const [x, y, r] of puffs) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = vGrad(ctx, -30, 26, "#64748b", 45, -40);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.ellipse(-10, -16, 12, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Grumpy face
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.ellipse(-7, 1, 3, 3.6, 0, 0, Math.PI * 2);
  ctx.ellipse(7, 1, 3, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.lineTo(-3, -3);
  ctx.moveTo(12, -6);
  ctx.lineTo(3, -3);
  ctx.moveTo(-5, 10);
  ctx.quadraticCurveTo(0, 6, 5, 10);
  ctx.stroke();
}

function drawMoth(ctx: CanvasRenderingContext2D, t: number, f: Flyer): void {
  const beat = 0.7 + Math.abs(Math.sin(t * 12 + f.phase)) * 0.5;
  const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, f.r + 14);
  halo.addColorStop(0, "rgba(253,230,138,0.45)");
  halo.addColorStop(1, "rgba(253,230,138,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, f.r + 14, 0, Math.PI * 2);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(1, -2);
    ctx.bezierCurveTo(10, -26 * beat, 30, -24 * beat, 27, -6 * beat);
    ctx.quadraticCurveTo(22, 2, 2, 2);
    ctx.closePath();
    ink(ctx, vGrad(ctx, -24, 2, "#f59e0b", 40, -30), 2.2);
    ctx.beginPath();
    ctx.moveTo(2, 3);
    ctx.quadraticCurveTo(18, 4, 18, 15 * beat);
    ctx.quadraticCurveTo(8, 17 * beat, 2, 8);
    ctx.closePath();
    ink(ctx, vGrad(ctx, 2, 17, "#d97706"), 2);
    ctx.beginPath();
    ctx.arc(16, -11 * beat, 4.5, 0, Math.PI * 2);
    ink(ctx, "#fef3c7", 1.4);
    ctx.fillStyle = "#7c2d12";
    ctx.beginPath();
    ctx.arc(16, -11 * beat, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(2, -10);
    ctx.quadraticCurveTo(6, -21, 10, -24);
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(0, 2, 6, 13, 0, 0, Math.PI * 2);
  ink(ctx, vGrad(ctx, -11, 15, "#92400e", 30, -30), 2.2);
  ctx.strokeStyle = "rgba(254,243,199,0.7)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (const y of [3, 7, 11]) {
    ctx.moveTo(-5, y);
    ctx.lineTo(5, y);
  }
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-2.4, -7, 1.6, 0, Math.PI * 2);
  ctx.arc(2.4, -7, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

/** Flyers face left: they come at the player. */
export function drawFlyer(ctx: CanvasRenderingContext2D, f: Flyer, t: number): void {
  ctx.save();
  ctx.translate(f.x, f.y);
  hitFlash(ctx, f.hitT);
  switch (f.kind) {
    case "asteroid":
      drawAsteroid(ctx, t, f);
      break;
    case "storm":
      drawStorm(ctx, t, f);
      break;
    case "moth":
      drawMoth(ctx, t, f);
      break;
    case "bat":
      drawBat(ctx, t, f);
      break;
    case "ptero":
      ctx.scale(-1, 1);
      drawPtero(ctx, t, f);
      break;
    default:
      ctx.scale(-1, 1);
      drawBird(ctx, t, f);
  }
  ctx.restore();
}
