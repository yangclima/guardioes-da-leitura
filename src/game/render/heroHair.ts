import type { Hero } from "./heroes";
import { ink, OUTLINE, shade, vGrad } from "./paint";

const HX = 2;
const HY = -57;

type Circle = readonly [number, number, number];

/** Fills a set of circles as one shape with a single outer outline. */
function blob(ctx: CanvasRenderingContext2D, circles: readonly Circle[], fill: string | CanvasGradient): void {
  ctx.beginPath();
  for (const [x, y, r] of circles) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

function shine(ctx: CanvasRenderingContext2D, x: number, y: number, len: number): void {
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y + len, len, -Math.PI * 0.75, -Math.PI * 0.45);
  ctx.stroke();
}

function sway(t: number, running: boolean): number {
  return running ? Math.sin(t * 13) * 3 : Math.sin(t * 2) * 1.2;
}

/** Hair volume and back accessories, drawn behind the head and torso. */
export function drawHairBack(ctx: CanvasRenderingContext2D, hero: Hero, t: number, running: boolean): void {
  const hair = vGrad(ctx, HY - 22, HY + 16, hero.hair, 35, -25);
  const s = sway(t, running);

  if (hero.accessory === "scarf") {
    const wave = Math.sin(t * (running ? 15 : 3));
    const flow = running ? 1 : 0.4;
    ctx.beginPath();
    ctx.moveTo(-4, -45);
    ctx.bezierCurveTo(-14, -46 + wave * 3 * flow, -22, -40 - wave * 4 * flow, -30 * flow - 8, -36 + wave * 5 * flow);
    ctx.lineTo(-28 * flow - 8, -30 + wave * 4 * flow);
    ctx.bezierCurveTo(-18, -34 - wave * 2 * flow, -12, -39, -4, -40);
    ctx.closePath();
    ink(ctx, vGrad(ctx, -46, -30, hero.accent));
  }
  if (hero.accessory === "backpack") {
    ctx.beginPath();
    ctx.roundRect(-19, -45, 13, 20, 5);
    ink(ctx, vGrad(ctx, -45, -25, hero.accent, 35, -40));
    ctx.beginPath();
    ctx.roundRect(-19, -45, 13, 7, [5, 5, 2, 2]);
    ink(ctx, shade(hero.accent, -30), 2);
    ctx.beginPath();
    ctx.arc(-12.5, -38, 1.6, 0, Math.PI * 2);
    ink(ctx, "#facc15", 1.2);
  }

  switch (hero.hairStyle) {
    case "curly":
      blob(
        ctx,
        [
          [HX - 12, HY - 6, 9],
          [HX - 6, HY - 14, 10],
          [HX + 4, HY - 17, 10],
          [HX + 13, HY - 13, 8],
          [HX - 15, HY + 4, 8],
          [HX - 12, HY + 12, 7],
          [HX - 4, HY - 21, 7],
        ],
        hair,
      );
      break;
    case "ponytail": {
      ctx.beginPath();
      ctx.moveTo(HX - 12, HY - 9);
      ctx.bezierCurveTo(HX - 30, HY - 12 + s, HX - 30 + s, HY + 10, HX - 22 + s * 1.5, HY + 26);
      ctx.bezierCurveTo(HX - 18 + s, HY + 14, HX - 16, HY + 2, HX - 9, HY - 1);
      ctx.closePath();
      ink(ctx, hair);
      ctx.beginPath();
      ctx.ellipse(HX - 13, HY - 6, 3.2, 4.5, 0.5, 0, Math.PI * 2);
      ink(ctx, hero.accent, 2);
      shine(ctx, HX - 22, HY + 2, 8);
      break;
    }
    case "bun": {
      ctx.beginPath();
      ctx.arc(HX - 7, HY - 20, 8.5, 0, Math.PI * 2);
      ink(ctx, hair);
      ctx.beginPath();
      ctx.ellipse(HX - 6, HY - 13.5, 6, 2.6, -0.3, 0, Math.PI * 2);
      ink(ctx, hero.accent, 2);
      shine(ctx, HX - 9, HY - 25, 5);
      ctx.beginPath();
      ctx.ellipse(HX - 10, HY + 2, 9, 13, 0.2, 0, Math.PI * 2);
      ink(ctx, hair);
      break;
    }
    case "spiky": {
      ctx.beginPath();
      ctx.moveTo(HX - 6, HY - 16);
      ctx.lineTo(HX - 26 - s * 0.5, HY - 14);
      ctx.lineTo(HX - 15, HY - 7);
      ctx.lineTo(HX - 28 - s * 0.5, HY - 2);
      ctx.lineTo(HX - 15, HY + 2);
      ctx.lineTo(HX - 23, HY + 10);
      ctx.lineTo(HX - 9, HY + 8);
      ctx.closePath();
      ink(ctx, hair);
      break;
    }
    default: {
      ctx.beginPath();
      ctx.ellipse(HX - 6, HY - 1, 13, 14, 0.2, 0, Math.PI * 2);
      ink(ctx, hair);
    }
  }
}

/** Fringe and top of the hair, drawn over the forehead (never over the eyes). */
export function drawHairFront(ctx: CanvasRenderingContext2D, hero: Hero, t: number, running: boolean): void {
  const hair = vGrad(ctx, HY - 20, HY + 4, hero.hair, 40, -20);
  const s = sway(t, running) * 0.3;
  switch (hero.hairStyle) {
    case "curly":
      blob(
        ctx,
        [
          [HX - 9, HY - 10, 7],
          [HX - 2, HY - 14, 7.5],
          [HX + 6, HY - 13, 6.5],
          [HX + 13, HY - 9, 5.5],
          [HX - 12, HY - 1, 5.5],
        ],
        hair,
      );
      shine(ctx, HX - 1, HY - 19, 6);
      break;
    case "spiky": {
      ctx.beginPath();
      ctx.moveTo(HX - 14, HY + 2);
      ctx.lineTo(HX - 15, HY - 10);
      ctx.lineTo(HX - 14, HY - 24 + s);
      ctx.lineTo(HX - 6, HY - 16);
      ctx.lineTo(HX - 2, HY - 28 + s);
      ctx.lineTo(HX + 4, HY - 17);
      ctx.lineTo(HX + 11, HY - 26 + s);
      ctx.lineTo(HX + 12, HY - 14);
      ctx.lineTo(HX + 21, HY - 15 + s);
      ctx.lineTo(HX + 16, HY - 8);
      ctx.lineTo(HX + 14, HY - 5);
      ctx.lineTo(HX + 9, HY - 9);
      ctx.lineTo(HX + 5, HY - 5);
      ctx.lineTo(HX + 1, HY - 9);
      ctx.lineTo(HX - 3, HY - 6);
      ctx.quadraticCurveTo(HX - 9, HY - 6, HX - 9, HY + 3);
      ctx.closePath();
      ink(ctx, hair);
      shine(ctx, HX - 4, HY - 20, 6);
      break;
    }
    case "ponytail":
    case "bun": {
      ctx.beginPath();
      ctx.moveTo(HX - 14, HY + 5);
      ctx.bezierCurveTo(HX - 19, HY - 14, HX - 4, HY - 22, HX + 6, HY - 18);
      ctx.bezierCurveTo(HX + 14, HY - 16, HX + 19, HY - 8, HX + 17.5, HY - 3);
      ctx.quadraticCurveTo(HX + 11, HY - 9, HX + 4, HY - 8);
      ctx.quadraticCurveTo(HX + 1, HY - 5, HX - 3, HY - 7);
      ctx.quadraticCurveTo(HX - 9, HY - 6, HX - 9, HY + 5);
      ctx.closePath();
      ink(ctx, hair);
      shine(ctx, HX - 3, HY - 17, 7);
      break;
    }
    default: {
      ctx.beginPath();
      ctx.moveTo(HX - 13, HY + 2);
      ctx.bezierCurveTo(HX - 17, HY - 14, HX - 2, HY - 21, HX + 9, HY - 17);
      ctx.quadraticCurveTo(HX + 18, HY - 12, HX + 16, HY - 5);
      ctx.lineTo(HX + 11, HY - 9);
      ctx.lineTo(HX + 8, HY - 6);
      ctx.lineTo(HX + 4, HY - 9);
      ctx.quadraticCurveTo(HX - 6, HY - 8, HX - 8, HY + 2);
      ctx.closePath();
      ink(ctx, hair);
    }
  }
}

/** Headband, cap, glasses, scarf knot and backpack strap. */
export function drawHeadgear(ctx: CanvasRenderingContext2D, hero: Hero): void {
  switch (hero.accessory) {
    case "headband": {
      ctx.beginPath();
      ctx.moveTo(HX - 15, HY - 7);
      ctx.quadraticCurveTo(HX + 2, HY - 17, HX + 17, HY - 7.5);
      ctx.lineWidth = 7.5;
      ctx.strokeStyle = OUTLINE;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = hero.accent;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(HX - 15, HY - 7);
      ctx.lineTo(HX - 21, HY - 1);
      ctx.moveTo(HX - 15, HY - 7);
      ctx.lineTo(HX - 22, HY - 7);
      ctx.lineWidth = 4;
      ctx.strokeStyle = shade(hero.accent, -40);
      ctx.stroke();
      break;
    }
    case "cap": {
      ctx.beginPath();
      ctx.moveTo(HX - 16.5, HY - 3);
      ctx.bezierCurveTo(HX - 18, HY - 24, HX + 18, HY - 24, HX + 17, HY - 5);
      ctx.quadraticCurveTo(HX, HY - 9, HX - 16.5, HY - 3);
      ctx.closePath();
      ink(ctx, vGrad(ctx, HY - 22, HY - 3, "#2563eb", 40, -40));
      ctx.beginPath();
      ctx.moveTo(HX + 10, HY - 8);
      ctx.quadraticCurveTo(HX + 22, HY - 10, HX + 29, HY - 5);
      ctx.quadraticCurveTo(HX + 22, HY - 3, HX + 12, HY - 4);
      ctx.closePath();
      ink(ctx, "#1e3a8a", 2.2);
      ctx.beginPath();
      ctx.arc(HX, HY - 19.5, 2.2, 0, Math.PI * 2);
      ink(ctx, hero.accent, 1.5);
      ctx.fillStyle = hero.accent;
      ctx.beginPath();
      ctx.arc(HX + 6, HY - 13, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "glasses": {
      ctx.strokeStyle = "#4c1d95";
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.arc(HX + 9.5, HY + 0.5, 5.2, 0, Math.PI * 2);
      ctx.moveTo(HX + 5.6, HY + 0.5);
      ctx.arc(HX + 1, HY + 0.5, 4.4, 0, Math.PI * 2);
      ctx.moveTo(HX + 4.2, HY - 0.5);
      ctx.lineTo(HX + 5.5, HY - 0.5);
      ctx.moveTo(HX - 3.4, HY);
      ctx.lineTo(HX - 7, HY - 1);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.arc(HX + 9.5, HY + 0.5, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "scarf": {
      ctx.beginPath();
      ctx.roundRect(-9, -44, 21, 7, 3.5);
      ink(ctx, vGrad(ctx, -44, -37, hero.accent), 2.2);
      ctx.strokeStyle = shade(hero.accent, -45);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-4, -43);
      ctx.lineTo(-2, -37.5);
      ctx.moveTo(3, -43);
      ctx.lineTo(5, -37.5);
      ctx.stroke();
      break;
    }
    case "backpack": {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-6, -42);
      ctx.quadraticCurveTo(-1, -35, -3, -26);
      ctx.stroke();
      ctx.strokeStyle = shade(hero.accent, -35);
      ctx.lineWidth = 2.6;
      ctx.stroke();
      break;
    }
  }
}
