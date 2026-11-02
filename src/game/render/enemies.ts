import type { Spike, Walker } from "../core/types";
import { ballGrad, capsule, cartoonEye, dropShadow, gloss, hitFlash, ink, OUTLINE, shade, vGrad } from "./paint";

const SLIME_COLORS: Record<string, string> = { floresta: "#4ade80", neve: "#7dd3fc", ceu: "#a78bfa", espaco: "#f472b6" };

function angryBrows(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, size: number): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1 - size, y - size * 0.5);
  ctx.lineTo(x1 + size, y + size * 0.2);
  ctx.moveTo(x2 - size, y + size * 0.2);
  ctx.lineTo(x2 + size, y - size * 0.5);
  ctx.stroke();
}

function drawSlime(ctx: CanvasRenderingContext2D, t: number, seed: number, theme: string): void {
  const color = SLIME_COLORS[theme] ?? "#4ade80";
  const hop = Math.abs(Math.sin(t * 5 + seed));
  const lift = hop * 7;
  const squash = hop < 0.25 ? (0.25 - hop) * 0.9 : -hop * 0.06;
  dropShadow(ctx, 0, 0, 18 - lift * 0.8, 0.25);
  ctx.translate(0, -lift);
  ctx.scale(1 + squash, 1 - squash);
  ctx.beginPath();
  ctx.moveTo(-21, 0);
  ctx.bezierCurveTo(-25, -16, -14, -33, 1, -33);
  ctx.bezierCurveTo(16, -33, 26, -17, 21, 0);
  ctx.quadraticCurveTo(14, 3, 8, 0);
  ctx.quadraticCurveTo(0, 3, -7, 0);
  ctx.quadraticCurveTo(-14, 3, -21, 0);
  ctx.closePath();
  ink(ctx, ballGrad(ctx, 0, -16, 24, color, 55, -55), 2.8);
  // Core and bubbles seen through the jelly.
  ctx.fillStyle = shade(color, -35);
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(-3, -9, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  for (const [bx, by, br] of [[-12, -8, 2.2], [13, -12, 1.6], [-6, -4, 1.2]] as const) {
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }
  gloss(ctx, -9, -24, 6, 3.2);
  gloss(ctx, -2, -28, 2, 1.4, 0, 0.7);
  cartoonEye(ctx, 2, -17, 4.2, 5, "#1e293b", 0.6);
  cartoonEye(ctx, 12.5, -17, 3.6, 4.6, "#1e293b", 0.6);
  angryBrows(ctx, 2, 12.5, -24, 3.5);
  ctx.beginPath();
  ctx.moveTo(4, -9);
  ctx.quadraticCurveTo(8, -7, 13, -9);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(10, -8.6);
  ctx.lineTo(11.5, -5.5);
  ctx.lineTo(12.5, -8.8);
  ctx.closePath();
  ctx.fill();
}

function drawRaptor(ctx: CanvasRenderingContext2D, t: number, seed: number, theme: string): void {
  const desert = theme === "deserto";
  const skin = desert ? "#f59e0b" : "#84cc16";
  const stripe = desert ? "#9a3412" : "#3f6212";
  const belly = desert ? "#fef3c7" : "#ecfccb";
  const p = t * 11 + seed;
  const bob = Math.abs(Math.sin(p)) * 2;
  dropShadow(ctx, 0, 0, 22, 0.22);
  ctx.translate(0, -bob);

  const leg = (hipX: number, a: number, back: boolean) => {
    const color = back ? shade(skin, -35) : shade(skin, -10);
    const kx = hipX - Math.sin(a) * 9;
    const ky = -17 + Math.cos(a) * 9;
    const fx = kx + 4 - Math.sin(a) * 2;
    const fy = -1 + bob;
    capsule(ctx, hipX, -19, kx, ky, 8, color, 2.3);
    capsule(ctx, kx, ky, fx, fy, 5, color, 2.2);
    ctx.beginPath();
    ctx.moveTo(fx - 4, fy + 1);
    ctx.lineTo(fx + 8, fy + 1);
    ctx.lineTo(fx + 6, fy - 3);
    ctx.closePath();
    ink(ctx, color, 2);
  };
  leg(-4, -Math.sin(p) * 0.7, true);

  // Tail swings for balance.
  const swing = Math.sin(p * 0.5) * 3;
  ctx.beginPath();
  ctx.moveTo(-12, -30);
  ctx.quadraticCurveTo(-28, -32 + swing, -38, -27 + swing * 1.5);
  ctx.quadraticCurveTo(-26, -21 + swing, -10, -19);
  ctx.closePath();
  ink(ctx, vGrad(ctx, -34, -18, skin));

  // Body
  ctx.beginPath();
  ctx.ellipse(-2, -26, 16, 10, -0.15, 0, Math.PI * 2);
  ink(ctx, vGrad(ctx, -36, -16, skin, 35, -35));
  ctx.save();
  ctx.clip();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(1, -18, 14, 6, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = stripe;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-14 + i * 7, -37);
    ctx.lineTo(-10 + i * 7, -37);
    ctx.lineTo(-12 + i * 7, -28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Neck + head with a chomping jaw.
  const chomp = Math.max(0, Math.sin(t * 6 + seed)) * 0.35;
  ctx.beginPath();
  ctx.moveTo(6, -33);
  ctx.quadraticCurveTo(14, -40, 18, -42);
  ctx.lineTo(20, -32);
  ctx.quadraticCurveTo(14, -26, 9, -22);
  ctx.closePath();
  ink(ctx, vGrad(ctx, -42, -22, skin));
  ctx.save();
  ctx.translate(20, -38);
  ctx.save();
  ctx.rotate(chomp);
  ctx.beginPath();
  ctx.moveTo(-2, 2);
  ctx.lineTo(14, 3);
  ctx.quadraticCurveTo(15, 6, 12, 7);
  ctx.lineTo(-1, 7);
  ctx.closePath();
  ink(ctx, shade(skin, -15), 2.2);
  ctx.restore();
  ctx.fillStyle = "#7f1d1d";
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(13, 3);
  ctx.lineTo(0, 2 + chomp * 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.quadraticCurveTo(-2, -10, 8, -8);
  ctx.quadraticCurveTo(17, -6, 18, 0);
  ctx.quadraticCurveTo(18, 3, 14, 3);
  ctx.lineTo(-3, 3);
  ctx.quadraticCurveTo(-7, 2, -6, -2);
  ctx.closePath();
  ink(ctx, vGrad(ctx, -9, 3, skin, 40, -25));
  ctx.fillStyle = "#fff";
  for (const tx of [5, 9, 13]) {
    ctx.beginPath();
    ctx.moveTo(tx - 1.6, 3);
    ctx.lineTo(tx, 6);
    ctx.lineTo(tx + 1.6, 3);
    ctx.closePath();
    ctx.fill();
  }
  // Reptile eye with a slit pupil and a heavy brow.
  ctx.beginPath();
  ctx.ellipse(4, -3, 3.4, 3, 0, 0, Math.PI * 2);
  ink(ctx, "#fde047", 1.6);
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(4.2, -5.6, 1.4, 5.2);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -6.5);
  ctx.lineTo(8, -5);
  ctx.stroke();
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(15, -3, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Tiny arm with claws
  capsule(ctx, 8, -26, 13, -21, 4, shade(skin, -8), 2);
  leg(2, Math.sin(p) * 0.7, false);
}

function drawBeetle(ctx: CanvasRenderingContext2D, t: number, seed: number, theme: string): void {
  const shell = theme === "espaco" ? "#94a3b8" : "#7c3aed";
  const step = t * 16 + seed;
  dropShadow(ctx, 0, 0, 20, 0.22);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 3; i++) {
    const phase = Math.sin(step + i * 2.1) * 3;
    const lx = -10 + i * 9;
    ctx.beginPath();
    ctx.moveTo(lx, -7);
    ctx.lineTo(lx + 3 + phase, -3);
    ctx.lineTo(lx + 1 + phase, 0);
    ctx.stroke();
  }
  // Head with a rhino horn
  ctx.beginPath();
  ctx.ellipse(16, -9, 7, 6, 0, 0, Math.PI * 2);
  ink(ctx, "#1e1b4b");
  ctx.beginPath();
  ctx.moveTo(18, -13);
  ctx.quadraticCurveTo(26, -17, 27, -25);
  ctx.quadraticCurveTo(22, -18, 15, -15);
  ctx.closePath();
  ink(ctx, vGrad(ctx, -25, -12, "#475569"), 2);
  const glow = 0.6 + Math.sin(t * 4 + seed) * 0.3;
  ctx.fillStyle = `rgba(253,224,71,${glow})`;
  ctx.beginPath();
  ctx.arc(19, -9.5, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(19.6, -10.2, 0.9, 0, Math.PI * 2);
  ctx.fill();
  // Carapace
  ctx.beginPath();
  ctx.moveTo(-19, -5);
  ctx.bezierCurveTo(-20, -24, 12, -27, 14, -6);
  ctx.closePath();
  ink(ctx, ballGrad(ctx, -2, -14, 18, shell, 55, -50), 2.8);
  ctx.strokeStyle = shade(shell, -55);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-3, -21);
  ctx.lineTo(-2, -6);
  ctx.stroke();
  gloss(ctx, -9, -17, 5, 2.2, -0.6);
  gloss(ctx, 4, -18, 3, 1.4, -0.4, 0.4);
  ctx.beginPath();
  ctx.roundRect(-19, -7, 33, 3, 1.5);
  ink(ctx, shade(shell, -45), 1.6);
}

function drawTurtle(ctx: CanvasRenderingContext2D, w: Walker, t: number, seed: number): void {
  const shellGrad = ballGrad(ctx, -3, -16, 22, "#22c55e", 50, -55);
  if (w.shell) {
    dropShadow(ctx, 0, 0, 21, 0.25);
    const rolling = Math.abs(w.vx) > 0;
    if (rolling) {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-28 - i * 5, -6 - i * 5);
        ctx.lineTo(-38 - i * 5, -6 - i * 5);
        ctx.stroke();
      }
    }
    const spin = rolling ? t * 14 * Math.sign(w.vx) : Math.sin(t * 3) * 0.05;
    ctx.save();
    ctx.translate(0, -11);
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
    ink(ctx, shellGrad, 2.8);
    ctx.clip();
    ctx.strokeStyle = "#14532d";
    ctx.lineWidth = 1.8;
    const off = ((spin * 8) % 16) - 16;
    for (let x = off; x < 26; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, -12);
      ctx.lineTo(x + 5, 0);
      ctx.lineTo(x, 12);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(0, -4, 22, 4, 0, 0, Math.PI);
    ink(ctx, "#fde68a", 2);
    gloss(ctx, -8, -16, 6, 2.4);
    return;
  }
  const step = Math.sin(t * 10 + seed);
  dropShadow(ctx, 0, 0, 22, 0.22);
  for (const [lx, a, back] of [[-12, step, true], [10, -step, true], [-8, -step, false], [14, step, false]] as const) {
    ctx.save();
    ctx.translate(lx, -6);
    ctx.rotate(a * 0.25);
    ctx.beginPath();
    ctx.roundRect(-4.5, -1, 9, 8, 4);
    ink(ctx, back ? "#4d7c0f" : "#84cc16", 2.2);
    ctx.restore();
  }
  // Head
  ctx.beginPath();
  ctx.ellipse(24, -16, 9, 8, -0.1, 0, Math.PI * 2);
  ink(ctx, ballGrad(ctx, 24, -16, 9, "#a3e635", 40, -40));
  ctx.beginPath();
  ctx.moveTo(18, -21);
  ctx.quadraticCurveTo(25, -25, 32, -21);
  ctx.lineTo(32, -18);
  ctx.quadraticCurveTo(25, -21, 18, -18);
  ctx.closePath();
  ink(ctx, "#f97316", 1.6);
  ctx.beginPath();
  ctx.moveTo(18, -20);
  ctx.lineTo(13, -24 + step * 2);
  ctx.lineTo(14, -18);
  ctx.closePath();
  ink(ctx, "#f97316", 1.4);
  cartoonEye(ctx, 27, -16, 2.6, 3, "#1e293b", 0.7);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(26, -11);
  ctx.quadraticCurveTo(29, -10, 31, -12);
  ctx.stroke();
  // Shell dome with plates
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-22, -7);
  ctx.bezierCurveTo(-24, -34, 18, -34, 18, -7);
  ctx.closePath();
  ink(ctx, shellGrad, 2.8);
  ctx.clip();
  ctx.strokeStyle = "#14532d";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-8, -28);
  ctx.lineTo(-11, -17);
  ctx.lineTo(-2, -12);
  ctx.lineTo(6, -17);
  ctx.lineTo(4, -28);
  ctx.moveTo(-11, -17);
  ctx.lineTo(-22, -15);
  ctx.moveTo(6, -17);
  ctx.lineTo(18, -15);
  ctx.moveTo(-2, -12);
  ctx.lineTo(-2, -6);
  ctx.stroke();
  ctx.restore();
  gloss(ctx, -9, -24, 6, 2.6);
  ctx.beginPath();
  ctx.roundRect(-23, -9, 42, 5, 2.5);
  ink(ctx, "#fde68a", 2);
}

export function drawWalker(ctx: CanvasRenderingContext2D, w: Walker, t: number, theme: string): void {
  const dir = w.vx >= 0 ? 1 : -1;
  const cx = w.x + w.w / 2;
  const by = w.y + w.h;
  const seed = w.minX * 0.013;
  ctx.save();
  ctx.translate(cx, by);
  if (!w.alive) {
    const k = Math.min(1, w.deadT / 0.35);
    ctx.globalAlpha = 1 - k;
    ctx.scale(1 + k * 0.6, Math.max(0.15, 1 - k * 1.5));
  }
  hitFlash(ctx, w.hitT);
  if (!(w.kind === "turtle" && w.shell)) ctx.scale(dir, 1);
  switch (w.kind) {
    case "slime":
      drawSlime(ctx, t, seed, theme);
      break;
    case "raptor":
      drawRaptor(ctx, t, seed, theme);
      break;
    case "turtle":
      drawTurtle(ctx, w, t, seed);
      break;
    default:
      drawBeetle(ctx, t, seed, theme);
  }
  ctx.restore();
}

function spikeTeeth(ctx: CanvasRenderingContext2D, s: Spike, fill: string | CanvasGradient, tall: number, lean = 0): void {
  const teeth = Math.max(2, Math.round(s.w / 12));
  const tw = s.w / teeth;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y + s.h);
  for (let i = 0; i < teeth; i++) {
    const h = i % 2 === 0 ? tall : tall * 0.75;
    ctx.lineTo(s.x + i * tw + tw / 2 + lean, s.y + s.h - h);
    ctx.lineTo(s.x + (i + 1) * tw, s.y + s.h);
  }
  ctx.closePath();
  ink(ctx, fill, 2.4);
}

export function drawSpike(ctx: CanvasRenderingContext2D, s: Spike): void {
  switch (s.kind) {
    case "cactus": {
      const count = Math.max(1, Math.round(s.w / 36));
      for (let i = 0; i < count; i++) {
        const x = s.x + (i + 0.5) * (s.w / count);
        const top = s.y - 10;
        const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0);
        g.addColorStop(0, "#4ade80");
        g.addColorStop(0.5, "#16a34a");
        g.addColorStop(1, "#14532d");
        ctx.beginPath();
        ctx.roundRect(x - 16, s.y + 1, 9, 13, 4.5);
        ink(ctx, g, 2.2);
        ctx.beginPath();
        ctx.roundRect(x - 8, top, 16, s.h + 10, [8, 8, 2, 2]);
        ink(ctx, g, 2.4);
        ctx.strokeStyle = "rgba(20,83,45,0.7)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - 3, top + 4);
        ctx.lineTo(x - 3, s.y + s.h);
        ctx.moveTo(x + 3, top + 4);
        ctx.lineTo(x + 3, s.y + s.h);
        ctx.stroke();
        ctx.strokeStyle = "#fefce8";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const sy = top + 6 + k * 6;
          ctx.moveTo(x - 8, sy);
          ctx.lineTo(x - 12, sy - 2);
          ctx.moveTo(x + 8, sy + 3);
          ctx.lineTo(x + 12, sy + 1);
        }
        ctx.stroke();
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          ctx.moveTo(x, top);
          ctx.ellipse(x + Math.cos(a) * 3.2, top - 1 + Math.sin(a) * 3.2, 2.6, 2.6, 0, 0, Math.PI * 2);
        }
        ink(ctx, "#f472b6", 1.2);
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(x, top - 1, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case "ice": {
      const g = ctx.createLinearGradient(0, s.y - 8, 0, s.y + s.h);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, "#bae6fd");
      g.addColorStop(1, "#38bdf8");
      spikeTeeth(ctx, s, g, s.h + 8, 2);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.4;
      const teeth = Math.max(2, Math.round(s.w / 12));
      ctx.beginPath();
      for (let i = 0; i < teeth; i += 2) {
        const tx = s.x + (i + 0.5) * (s.w / teeth);
        ctx.moveTo(tx - 1, s.y + s.h - 4);
        ctx.lineTo(tx + 1, s.y);
      }
      ctx.stroke();
      return;
    }
    case "crystal": {
      const teeth = Math.max(2, Math.round(s.w / 14));
      const tw = s.w / teeth;
      for (let i = 0; i < teeth; i++) {
        const x = s.x + i * tw + tw / 2;
        const h = s.h + (i % 2 === 0 ? 10 : 2);
        const tilt = (i - teeth / 2) * 2;
        ctx.beginPath();
        ctx.moveTo(x - tw / 2, s.y + s.h);
        ctx.lineTo(x - tw / 2 + 1, s.y + s.h - h * 0.6);
        ctx.lineTo(x + tilt, s.y + s.h - h);
        ctx.lineTo(x + tw / 2 - 1, s.y + s.h - h * 0.6);
        ctx.lineTo(x + tw / 2, s.y + s.h);
        ctx.closePath();
        ink(ctx, "#c026d3", 2.2);
        ctx.fillStyle = "#f0abfc";
        ctx.beginPath();
        ctx.moveTo(x - tw / 2 + 1, s.y + s.h - h * 0.6);
        ctx.lineTo(x + tilt, s.y + s.h - h);
        ctx.lineTo(x, s.y + s.h);
        ctx.lineTo(x - tw / 2 + 1, s.y + s.h);
        ctx.closePath();
        ctx.fill();
      }
      return;
    }
    case "metal": {
      const g = ctx.createLinearGradient(s.x, 0, s.x + s.w, 0);
      g.addColorStop(0, "#e2e8f0");
      g.addColorStop(0.5, "#94a3b8");
      g.addColorStop(1, "#475569");
      spikeTeeth(ctx, { ...s, h: s.h - 5 }, g, s.h - 2);
      ctx.beginPath();
      ctx.roundRect(s.x - 2, s.y + s.h - 6, s.w + 4, 6, 2);
      ink(ctx, "#334155", 2);
      ctx.fillStyle = "#cbd5e1";
      for (let x = s.x + 5; x < s.x + s.w; x += 12) {
        ctx.beginPath();
        ctx.arc(x, s.y + s.h - 3, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    default: {
      // Bramble: a twisted vine full of curved thorns.
      ctx.beginPath();
      ctx.moveTo(s.x - 2, s.y + s.h);
      for (let x = s.x; x <= s.x + s.w; x += 6) ctx.lineTo(x, s.y + s.h - 7 - Math.sin(x * 0.4) * 3);
      ctx.lineTo(s.x + s.w + 2, s.y + s.h);
      ctx.closePath();
      ink(ctx, vGrad(ctx, s.y + 8, s.y + s.h, "#3f6212"), 2.2);
      const thorns = Math.max(3, Math.round(s.w / 10));
      for (let i = 0; i < thorns; i++) {
        const x = s.x + (i + 0.5) * (s.w / thorns);
        const up = i % 2 === 0;
        ctx.beginPath();
        ctx.moveTo(x - 4, s.y + s.h - 6);
        ctx.quadraticCurveTo(x - 1, s.y + (up ? -2 : 4), x + (up ? 3 : -3), s.y + (up ? -4 : 3));
        ctx.quadraticCurveTo(x + 1, s.y + 6, x + 4, s.y + s.h - 6);
        ctx.closePath();
        ink(ctx, up ? "#b91c1c" : "#9a3412", 1.8);
      }
      ctx.fillStyle = "#65a30d";
      ctx.beginPath();
      ctx.ellipse(s.x + 4, s.y + s.h - 9, 4, 2.2, -0.6, 0, Math.PI * 2);
      ctx.ellipse(s.x + s.w - 5, s.y + s.h - 10, 4, 2.2, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
