import type { Hero, Weapon } from "./heroes";
import { LIGHT, pen, shade, softSpot, vGrad, WARM_INK } from "./paint";

const HX = 2;
const HY = -57;

const STEEL = "#a7afb6";
const WOOD = "#8a5a32";

/** Resting angle of each weapon in the hand (radians, 0 = pointing forward). */
export const WEAPON_REST: Record<Weapon, number> = {
  dagger: -0.7,
  sword: -1.0,
  axe: -1.25,
  spear: -1.3,
  staff: -1.45,
};

/** Distance from the hand to the weapon's business end. */
export const WEAPON_REACH: Record<Weapon, number> = {
  dagger: 15,
  sword: 24,
  axe: 22,
  spear: 34,
  staff: 30,
};

function steelGrad(ctx: CanvasRenderingContext2D, y0: number, y1: number): CanvasGradient {
  return vGrad(ctx, y0, y1, STEEL, 55, -45);
}

function shaft(ctx: CanvasRenderingContext2D, from: number, to: number, w: number, color: string): void {
  ctx.beginPath();
  ctx.roundRect(from, -w / 2, to - from, w, w / 2);
  pen(ctx, vGrad(ctx, -w / 2, w / 2, color, 30, -30), 1.6);
}

function blade(ctx: CanvasRenderingContext2D, from: number, len: number, half: number): void {
  ctx.beginPath();
  ctx.moveTo(from, -half);
  ctx.lineTo(from + len, -half);
  ctx.lineTo(from + len + half * 2.2, 0);
  ctx.lineTo(from + len, half);
  ctx.lineTo(from, half);
  ctx.closePath();
  pen(ctx, steelGrad(ctx, -half, half), 1.6);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(from + 1.5, -0.4);
  ctx.lineTo(from + len, -0.4);
  ctx.stroke();
}

function sword(ctx: CanvasRenderingContext2D, hero: Hero, len: number): void {
  shaft(ctx, -6, 2, 3.2, hero.leather);
  ctx.beginPath();
  ctx.arc(-7, 0, 2.3, 0, Math.PI * 2);
  pen(ctx, hero.accent, 1.4);
  blade(ctx, 4, len, 2.3);
  ctx.beginPath();
  ctx.roundRect(2, -5, 3, 10, 1.2);
  pen(ctx, hero.accent, 1.4);
}

function axe(ctx: CanvasRenderingContext2D): void {
  shaft(ctx, -9, 22, 3.2, WOOD);
  ctx.beginPath();
  ctx.moveTo(14, -1.5);
  ctx.quadraticCurveTo(17, -6, 15, -11);
  ctx.quadraticCurveTo(22, -8, 24, -1);
  ctx.quadraticCurveTo(22, 6, 15, 9);
  ctx.quadraticCurveTo(17, 4, 14, 1.5);
  ctx.closePath();
  pen(ctx, steelGrad(ctx, -11, 9), 1.6);
}

function spear(ctx: CanvasRenderingContext2D, hero: Hero): void {
  shaft(ctx, -13, 30, 3, WOOD);
  ctx.beginPath();
  ctx.moveTo(29, -3);
  ctx.quadraticCurveTo(35, -3.5, 40, 0);
  ctx.quadraticCurveTo(35, 3.5, 29, 3);
  ctx.closePath();
  pen(ctx, steelGrad(ctx, -3.5, 3.5), 1.5);
  ctx.beginPath();
  ctx.roundRect(26, -2.6, 3.5, 5.2, 1);
  pen(ctx, hero.accent, 1.2);
}

function staff(ctx: CanvasRenderingContext2D, hero: Hero): void {
  shaft(ctx, -14, 27, 3.4, "#6e4a2a");
  ctx.strokeStyle = shade("#6e4a2a", -35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, -1.7);
  ctx.lineTo(6, 1.7);
  ctx.moveTo(14, -1.7);
  ctx.lineTo(16, 1.7);
  ctx.stroke();
  softSpot(ctx, 31, 0, 9, [255, 236, 170], 0.55);
  ctx.beginPath();
  ctx.moveTo(26, 0);
  ctx.lineTo(30.5, -4);
  ctx.lineTo(35, 0);
  ctx.lineTo(30.5, 4);
  ctx.closePath();
  pen(ctx, vGrad(ctx, -4, 4, hero.accent, 60, -30), 1.4);
}

/** Weapon held in a fist at (x, y), rotated to `angle`. */
export function drawWeapon(ctx: CanvasRenderingContext2D, hero: Hero, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  switch (hero.weapon) {
    case "dagger":
      sword(ctx, hero, 9);
      break;
    case "sword":
      sword(ctx, hero, 17);
      break;
    case "axe":
      axe(ctx);
      break;
    case "spear":
      spear(ctx, hero);
      break;
    case "staff":
      staff(ctx, hero);
      break;
  }
  ctx.restore();
}

/** Round wooden shield with a painted band, iron rim and boss. */
export function drawShield(ctx: CanvasRenderingContext2D, hero: Hero, x: number, y: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, 9.5, 12.5, 0, 0, Math.PI * 2);
  pen(ctx, vGrad(ctx, y - 12, y + 12, WOOD, 30, -35), 1.9);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = hero.accent;
  ctx.fillRect(x - 3, y - 13, 6, 26);
  ctx.strokeStyle = "rgba(60,30,10,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 13);
  ctx.lineTo(x - 6, y + 13);
  ctx.moveTo(x + 6, y - 13);
  ctx.lineTo(x + 6, y + 13);
  ctx.stroke();
  softSpot(ctx, x - 3, y - 5, 8, LIGHT, 0.3);
  ctx.restore();
  ctx.strokeStyle = shade(STEEL, -30);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, 8.4, 11.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 3.2, 0, Math.PI * 2);
  pen(ctx, steelGrad(ctx, y - 3, y + 3), 1.4);
}

/** Travel pack with a rolled blanket on top, worn on the back. */
export function drawPack(ctx: CanvasRenderingContext2D, hero: Hero): void {
  ctx.beginPath();
  ctx.roundRect(-20, -44, 13, 19, 4);
  pen(ctx, vGrad(ctx, -44, -25, hero.leather, 25, -35));
  ctx.beginPath();
  ctx.roundRect(-20, -44, 13, 7, [4, 4, 2, 2]);
  pen(ctx, shade(hero.leather, -18), 1.5);
  ctx.beginPath();
  ctx.roundRect(-23, -51, 17, 8, 4);
  pen(ctx, vGrad(ctx, -51, -43, hero.accent, 30, -35), 1.7);
  ctx.strokeStyle = WARM_INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-18, -51);
  ctx.lineTo(-18, -43);
  ctx.moveTo(-11, -51);
  ctx.lineTo(-11, -43);
  ctx.stroke();
}

/** Hood drape behind the head and down to the shoulders. */
export function drawHeadgearBack(ctx: CanvasRenderingContext2D, hero: Hero): void {
  if (hero.headgear !== "hood") return;
  ctx.beginPath();
  ctx.ellipse(HX - 3, HY - 1, 19, 19.5, 0, 0, Math.PI * 2);
  pen(ctx, shade(hero.hat, -30));
  ctx.beginPath();
  ctx.moveTo(HX - 18, HY + 4);
  ctx.quadraticCurveTo(-16, -38, -11, -37);
  ctx.lineTo(10, -39);
  ctx.quadraticCurveTo(HX + 12, HY + 14, HX - 18, HY + 4);
  ctx.closePath();
  pen(ctx, shade(hero.hat, -20));
}

function hood(ctx: CanvasRenderingContext2D, hero: Hero): void {
  ctx.beginPath();
  ctx.moveTo(HX - 11, HY + 15);
  ctx.bezierCurveTo(HX - 22, HY + 4, HX - 22, HY - 14, HX - 16, HY - 24);
  ctx.quadraticCurveTo(HX - 2, HY - 25, HX + 9, HY - 20);
  ctx.quadraticCurveTo(HX + 18, HY - 14, HX + 18, HY - 4);
  ctx.bezierCurveTo(HX + 13, HY - 13, HX + 1, HY - 14, HX - 5, HY - 7);
  ctx.quadraticCurveTo(HX - 9, HY + 2, HX - 6, HY + 14);
  ctx.closePath();
  pen(ctx, vGrad(ctx, HY - 25, HY + 15, hero.hat, 30, -30));
  ctx.save();
  ctx.clip();
  softSpot(ctx, HX - 4, HY - 18, 12, LIGHT, 0.3);
  ctx.restore();
}

function metalDome(ctx: CanvasRenderingContext2D, color: string, lift: number): void {
  ctx.beginPath();
  ctx.moveTo(HX - 17, HY - 3 - lift);
  ctx.bezierCurveTo(HX - 19, HY - 27, HX + 19, HY - 28, HX + 18, HY - 4 - lift);
  ctx.quadraticCurveTo(HX, HY - 8 - lift, HX - 17, HY - 3 - lift);
  ctx.closePath();
  pen(ctx, vGrad(ctx, HY - 22, HY - 4, color, 45, -40));
  ctx.save();
  ctx.clip();
  softSpot(ctx, HX - 3, HY - 18, 10, LIGHT, 0.55);
  ctx.restore();
}

function rimBand(ctx: CanvasRenderingContext2D, color: string, y: number): void {
  ctx.beginPath();
  ctx.moveTo(HX - 17.5, y + 1);
  ctx.quadraticCurveTo(HX, y - 5.5, HX + 18.5, y);
  ctx.lineCap = "round";
  ctx.lineWidth = 5.5;
  ctx.strokeStyle = WARM_INK;
  ctx.stroke();
  ctx.lineWidth = 3.3;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function nasalHelm(ctx: CanvasRenderingContext2D, hero: Hero): void {
  metalDome(ctx, hero.hat, 0);
  rimBand(ctx, shade(hero.hat, -20), HY - 4);
  ctx.beginPath();
  ctx.roundRect(HX + 12, HY - 8, 3.4, 11, 1.5);
  pen(ctx, vGrad(ctx, HY - 8, HY + 3, hero.hat, 30, -30), 1.4);
  ctx.fillStyle = shade(hero.hat, -45);
  for (const rx of [HX - 10, HX - 1, HX + 8]) {
    ctx.beginPath();
    ctx.arc(rx, HY - 7.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function kettleHat(ctx: CanvasRenderingContext2D, hero: Hero): void {
  ctx.beginPath();
  ctx.ellipse(HX + 1, HY - 5, 22, 4.6, -0.04, 0, Math.PI * 2);
  pen(ctx, vGrad(ctx, HY - 10, HY, hero.hat, 25, -40));
  ctx.beginPath();
  ctx.moveTo(HX - 14, HY - 6);
  ctx.bezierCurveTo(HX - 15, HY - 27, HX + 17, HY - 27, HX + 16, HY - 6);
  ctx.quadraticCurveTo(HX + 1, HY - 9, HX - 14, HY - 6);
  ctx.closePath();
  pen(ctx, vGrad(ctx, HY - 24, HY - 5, hero.hat, 40, -35));
  ctx.save();
  ctx.clip();
  softSpot(ctx, HX - 3, HY - 18, 9, LIGHT, 0.5);
  ctx.restore();
}

function featherCap(ctx: CanvasRenderingContext2D, hero: Hero): void {
  ctx.beginPath();
  ctx.moveTo(HX - 10, HY - 10);
  ctx.bezierCurveTo(HX - 21, HY - 13, HX - 25, HY - 21, HX - 21, HY - 27);
  ctx.bezierCurveTo(HX - 15, HY - 21, HX - 11, HY - 16, HX - 10, HY - 10);
  ctx.closePath();
  pen(ctx, vGrad(ctx, HY - 27, HY - 10, "#c2412d", 40, -30), 1.5);
  ctx.beginPath();
  ctx.moveTo(HX - 16.5, HY - 4);
  ctx.bezierCurveTo(HX - 16, HY - 22, HX + 2, HY - 25, HX + 23, HY - 14);
  ctx.quadraticCurveTo(HX + 20, HY - 8, HX + 17, HY - 5);
  ctx.quadraticCurveTo(HX, HY - 9, HX - 16.5, HY - 4);
  ctx.closePath();
  pen(ctx, vGrad(ctx, HY - 22, HY - 4, hero.hat, 35, -35));
  ctx.beginPath();
  ctx.moveTo(HX - 19, HY - 1);
  ctx.lineTo(HX - 21, HY - 13);
  ctx.quadraticCurveTo(HX - 12, HY - 10, HX - 6, HY - 7);
  ctx.quadraticCurveTo(HX - 12, HY - 2, HX - 19, HY - 1);
  ctx.closePath();
  pen(ctx, shade(hero.hat, -18));
  rimBand(ctx, hero.accent, HY - 5);
}

function leatherCap(ctx: CanvasRenderingContext2D, hero: Hero): void {
  metalDome(ctx, hero.hat, 0);
  ctx.strokeStyle = shade(hero.hat, -45);
  ctx.lineWidth = 1;
  ctx.setLineDash([1.6, 1.6]);
  ctx.beginPath();
  ctx.moveTo(HX + 1, HY - 8);
  ctx.quadraticCurveTo(HX - 2, HY - 15, HX - 2, HY - 22);
  ctx.stroke();
  ctx.setLineDash([]);
  rimBand(ctx, shade(hero.hat, -25), HY - 4);
  ctx.beginPath();
  ctx.roundRect(HX - 11.5, HY - 5, 8, 11, [2, 2, 4, 4]);
  pen(ctx, vGrad(ctx, HY - 5, HY + 6, hero.hat, 20, -30), 1.6);
}

/** Hat, hood or helmet, drawn over the hair. */
export function drawHeadgear(ctx: CanvasRenderingContext2D, hero: Hero): void {
  switch (hero.headgear) {
    case "hood":
      hood(ctx, hero);
      break;
    case "nasal":
      nasalHelm(ctx, hero);
      break;
    case "kettle":
      kettleHat(ctx, hero);
      break;
    case "feather":
      featherCap(ctx, hero);
      break;
    case "leather":
      leatherCap(ctx, hero);
      break;
  }
}

/** Little round reading glasses. */
export function drawGlasses(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#5b3a1e";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(HX + 10, HY + 2, 4.2, 0, Math.PI * 2);
  ctx.moveTo(HX + 5, HY + 2);
  ctx.arc(HX + 1.5, HY + 2, 3.5, 0, Math.PI * 2);
  ctx.moveTo(HX + 5, HY + 1.4);
  ctx.lineTo(HX + 5.8, HY + 1.4);
  ctx.moveTo(HX - 2, HY + 1.5);
  ctx.lineTo(HX - 6, HY);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(HX + 10, HY + 2, 4, 0, Math.PI * 2);
  ctx.fill();
}
