import type { Hero } from "./heroes";
import { pen, vGrad, WARM_INK } from "./paint";

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
  ctx.lineWidth = 3.8;
  ctx.strokeStyle = WARM_INK;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

function shine(ctx: CanvasRenderingContext2D, x: number, y: number, len: number): void {
  ctx.strokeStyle = "rgba(255,240,215,0.3)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y + len, len, -Math.PI * 0.75, -Math.PI * 0.45);
  ctx.stroke();
}

function sway(t: number, running: boolean): number {
  return running ? Math.sin(t * 13) * 3 : Math.sin(t * 2) * 1.2;
}

/** Hair volume drawn behind the head (and behind any hood or helmet). */
export function drawHairBack(ctx: CanvasRenderingContext2D, hero: Hero, t: number, running: boolean): void {
  const hair = vGrad(ctx, HY - 22, HY + 16, hero.hair, 35, -25);
  const s = sway(t, running);

  switch (hero.hairStyle) {
    case "curly":
      blob(
        ctx,
        [
          [HX - 13, HY - 4, 9],
          [HX - 8, HY - 12, 9],
          [HX - 16, HY + 5, 8],
          [HX - 13, HY + 13, 7],
          [HX - 7, HY + 16, 5.5],
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
      pen(ctx, hair);
      ctx.beginPath();
      ctx.ellipse(HX - 13, HY - 5, 3, 4.2, 0.5, 0, Math.PI * 2);
      pen(ctx, hero.accent, 1.5);
      shine(ctx, HX - 22, HY + 2, 8);
      break;
    }
    case "bun": {
      ctx.beginPath();
      ctx.arc(HX - 17, HY - 7, 7.5, 0, Math.PI * 2);
      pen(ctx, hair);
      shine(ctx, HX - 19, HY - 12, 4.5);
      ctx.beginPath();
      ctx.ellipse(HX - 10, HY + 3, 9, 12, 0.2, 0, Math.PI * 2);
      pen(ctx, hair);
      break;
    }
    case "spiky": {
      ctx.beginPath();
      ctx.moveTo(HX - 8, HY - 10);
      ctx.lineTo(HX - 24 - s * 0.5, HY - 8);
      ctx.lineTo(HX - 15, HY - 3);
      ctx.lineTo(HX - 25 - s * 0.5, HY + 3);
      ctx.lineTo(HX - 14, HY + 5);
      ctx.lineTo(HX - 20, HY + 12);
      ctx.lineTo(HX - 8, HY + 9);
      ctx.closePath();
      pen(ctx, hair);
      break;
    }
    default: {
      ctx.beginPath();
      ctx.ellipse(HX - 7, HY + 1, 12, 13, 0.2, 0, Math.PI * 2);
      pen(ctx, hair);
    }
  }
}

/** Fringe over the forehead; the headgear covers its top, so it only peeks out below the rim. */
export function drawHairFront(ctx: CanvasRenderingContext2D, hero: Hero, t: number, running: boolean): void {
  const hair = vGrad(ctx, HY - 14, HY + 4, hero.hair, 40, -20);
  const s = sway(t, running) * 0.3;
  switch (hero.hairStyle) {
    case "curly":
      blob(
        ctx,
        [
          [HX - 8, HY - 6, 5.5],
          [HX - 1, HY - 8, 5.5],
          [HX + 6, HY - 7, 5],
          [HX + 12, HY - 5, 4.2],
          [HX - 11, HY + 1, 4.5],
        ],
        hair,
      );
      break;
    case "spiky": {
      ctx.beginPath();
      ctx.moveTo(HX - 13, HY + 2);
      ctx.lineTo(HX - 14, HY - 8);
      ctx.lineTo(HX + 16, HY - 8);
      ctx.lineTo(HX + 15 + s, HY - 1);
      ctx.lineTo(HX + 11, HY - 5);
      ctx.lineTo(HX + 8, HY - 1 + s);
      ctx.lineTo(HX + 4, HY - 5);
      ctx.lineTo(HX + 1, HY - 1);
      ctx.lineTo(HX - 3, HY - 5);
      ctx.quadraticCurveTo(HX - 9, HY - 4, HX - 9, HY + 3);
      ctx.closePath();
      pen(ctx, hair);
      break;
    }
    case "ponytail":
    case "bun": {
      ctx.beginPath();
      ctx.moveTo(HX - 14, HY + 5);
      ctx.bezierCurveTo(HX - 17, HY - 8, HX - 2, HY - 10, HX + 6, HY - 9);
      ctx.quadraticCurveTo(HX + 16, HY - 8, HX + 17, HY - 2);
      ctx.quadraticCurveTo(HX + 11, HY - 6, HX + 4, HY - 5);
      ctx.quadraticCurveTo(HX + 1, HY - 3, HX - 3, HY - 5);
      ctx.quadraticCurveTo(HX - 9, HY - 4, HX - 9, HY + 5);
      ctx.closePath();
      pen(ctx, hair);
      break;
    }
    default: {
      ctx.beginPath();
      ctx.moveTo(HX - 13, HY + 2);
      ctx.bezierCurveTo(HX - 15, HY - 8, HX - 2, HY - 10, HX + 9, HY - 9);
      ctx.quadraticCurveTo(HX + 17, HY - 7, HX + 16, HY - 3);
      ctx.lineTo(HX + 11, HY - 5);
      ctx.lineTo(HX + 8, HY - 3);
      ctx.lineTo(HX + 4, HY - 5);
      ctx.quadraticCurveTo(HX - 6, HY - 5, HX - 8, HY + 2);
      ctx.closePath();
      pen(ctx, hair);
    }
  }
}
