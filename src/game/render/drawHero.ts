import type { Hero } from "./heroes";
import { drawHairBack, drawHairFront } from "./heroHair";
import { drawGlasses, drawHeadgear, drawHeadgearBack, drawPack, drawShield, drawWeapon, WEAPON_REACH, WEAPON_REST } from "./heroGear";
import { ballGrad, dropShadow, LIGHT, pen, shade, SHADOW, softSpot, vGrad, WARM_INK } from "./paint";

export { OUTLINE } from "./paint";

export type PoseState = "idle" | "run" | "jump" | "fall" | "hurt";

export interface Pose {
  state: PoseState;
  /** Animation clock in seconds. */
  t: number;
  facing: 1 | -1;
  /** 0..1 landing squash. */
  squash: number;
  /** 0..1, arm stretched forward right after a magic shot. */
  cast?: number;
}

/** Joint angles: 0 points straight down, positive swings backward. */
interface Rig {
  thighF: number;
  kneeF: number;
  thighB: number;
  kneeB: number;
  armF: number;
  elbowF: number;
  armB: number;
  elbowB: number;
  lean: number;
  bob: number;
  mouth: "smile" | "grin" | "open" | "ouch";
  brow: number;
}

const HIP_Y = -25;
const THIGH = 11.5;
const SHIN = 11;
const UPPER_ARM = 9.5;
const FOREARM = 9;
const SHOULDER_F = { x: 4.5, y: -40 };
const SHOULDER_B = { x: -2.5, y: -40 };
export const HEAD = { x: 2, y: -57, r: 16.5 };

function rigFor(pose: Pose): Rig {
  const { state, t } = pose;
  const p = t * 13;
  switch (state) {
    case "run":
      return {
        thighF: -0.85 * Math.sin(p),
        kneeF: 0.15 + 1.35 * Math.max(0, Math.cos(p)),
        thighB: 0.85 * Math.sin(p),
        kneeB: 0.15 + 1.35 * Math.max(0, -Math.cos(p)),
        armF: -0.3 + 0.55 * Math.sin(p),
        elbowF: -1.0,
        armB: 0.2 - 0.5 * Math.sin(p),
        elbowB: -0.5,
        lean: 0.14,
        bob: -Math.abs(Math.sin(p)) * 2.4,
        mouth: "grin",
        brow: 0,
      };
    case "jump":
      return { thighF: -1.0, kneeF: 1.5, thighB: 0.35, kneeB: 0.9, armF: -1.9, elbowF: -0.35, armB: -1.2, elbowB: -0.4, lean: 0.05, bob: 0, mouth: "open", brow: -1 };
    case "fall":
      return { thighF: -0.35, kneeF: 0.4, thighB: 0.45, kneeB: 0.7, armF: -1.7, elbowF: -0.5, armB: -0.9, elbowB: -0.6, lean: -0.04, bob: 0, mouth: "open", brow: 1 };
    case "hurt":
      return { thighF: -0.5, kneeF: 0.6, thighB: 0.5, kneeB: 0.4, armF: -2.2, elbowF: 0.4, armB: 1.4, elbowB: -0.3, lean: -0.2, bob: 0, mouth: "ouch", brow: 1 };
    default: {
      const breathe = Math.sin(t * 2.6);
      return { thighF: -0.1, kneeF: 0.1, thighB: 0.12, kneeB: 0.08, armF: -0.35 + breathe * 0.04, elbowF: -0.9, armB: 0.25, elbowB: -0.3, lean: 0, bob: breathe * 0.9, mouth: "smile", brow: 0 };
    }
  }
}

/** Forward kinematics for a two-bone limb. */
function limbPoints(x: number, y: number, a: number, bend: number, l1: number, l2: number) {
  const jx = x - Math.sin(a) * l1;
  const jy = y + Math.cos(a) * l1;
  const ex = jx - Math.sin(a + bend) * l2;
  const ey = jy + Math.cos(a + bend) * l2;
  return { jx, jy, ex, ey };
}

/** A limb segment shaded across its width so it reads as a rounded volume. */
function roundLimb(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number, base: string): void {
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
  const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
  g.addColorStop(0, shade(base, 28));
  g.addColorStop(0.45, base);
  g.addColorStop(1, shade(base, -32));
  ctx.beginPath();
  ctx.roundRect(-w / 2, -w / 2, Math.hypot(x2 - x1, y2 - y1) + w, w, w / 2);
  pen(ctx, g);
  ctx.restore();
}

function drawBootFoot(ctx: CanvasRenderingContext2D, leather: string, x: number, y: number, tilt: number): void {
  ctx.save();
  ctx.translate(x, y + 1);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.moveTo(-5.5, -5);
  ctx.quadraticCurveTo(2, -6.5, 7, -3.5);
  ctx.quadraticCurveTo(12, -2, 11.5, 1.5);
  ctx.lineTo(11, 3.5);
  ctx.lineTo(-6, 3.5);
  ctx.quadraticCurveTo(-7.5, -1, -5.5, -5);
  ctx.closePath();
  pen(ctx, vGrad(ctx, -6, 4, leather, 25, -30));
  ctx.fillStyle = shade(leather, -50);
  ctx.fillRect(-6, 1.6, 17, 2);
  softSpot(ctx, 5, -3, 4, LIGHT, 0.35);
  ctx.restore();
}

function drawLeg(ctx: CanvasRenderingContext2D, hero: Hero, hipX: number, thigh: number, knee: number, back: boolean): void {
  const dim = back ? -26 : 0;
  const leather = shade(hero.leather, dim);
  const { jx, jy, ex, ey } = limbPoints(hipX, HIP_Y, thigh, knee, THIGH, SHIN);
  roundLimb(ctx, hipX, HIP_Y, jx, jy, 9.5, shade(hero.trousers, dim));
  // Chunky leather boot from just under the knee.
  const bx = jx + (ex - jx) * 0.2;
  const by = jy + (ey - jy) * 0.2;
  roundLimb(ctx, bx, by, ex, ey, 9.5, leather);
  drawBootFoot(ctx, leather, ex, ey, -(thigh + knee) * 0.35);
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(Math.atan2(ey - by, ex - bx) - Math.PI / 2);
  ctx.beginPath();
  ctx.roundRect(-6.2, -2.5, 12.4, 4.6, 2);
  pen(ctx, shade(leather, 18), 1.5);
  ctx.restore();
}

/** Sleeve, leather bracer and hand. Returns the hand position. */
function drawArm(ctx: CanvasRenderingContext2D, hero: Hero, sx: number, sy: number, arm: number, elbow: number, back: boolean): { hx: number; hy: number } {
  const dim = back ? -28 : 0;
  const { jx, jy, ex, ey } = limbPoints(sx, sy, arm, elbow, UPPER_ARM, FOREARM);
  roundLimb(ctx, jx, jy, ex, ey, 7, shade(hero.leather, dim + 8));
  roundLimb(ctx, sx, sy, jx, jy, 8.5, shade(hero.tunic, dim));
  ctx.beginPath();
  ctx.arc(ex, ey + 0.5, 4.1, 0, Math.PI * 2);
  pen(ctx, ballGrad(ctx, ex, ey, 4.1, shade(hero.skin, dim), 25, -30));
  return { hx: ex, hy: ey };
}

function tunicPath(ctx: CanvasRenderingContext2D, flare: number): void {
  ctx.beginPath();
  ctx.moveTo(-9.5, -41);
  ctx.quadraticCurveTo(1, -46, 11, -41);
  ctx.quadraticCurveTo(13, -33, 11.5, -27);
  ctx.quadraticCurveTo(14 + flare, -21, 14.5 + flare, -16);
  ctx.quadraticCurveTo(1.5, -13.5, -11.5 - flare, -16);
  ctx.quadraticCurveTo(-11.5 - flare, -21, -9, -27);
  ctx.quadraticCurveTo(-11.5, -33, -9.5, -41);
  ctx.closePath();
}

function drawTorso(ctx: CanvasRenderingContext2D, hero: Hero, flare: number): void {
  ctx.beginPath();
  ctx.roundRect(-3, -47, 8, 7, 3);
  pen(ctx, shade(hero.skin, -20));

  tunicPath(ctx, flare);
  pen(ctx, vGrad(ctx, -45, -15, hero.tunic, 26, -34));
  ctx.save();
  ctx.clip();
  softSpot(ctx, -12, -30, 11, SHADOW, 0.35);
  softSpot(ctx, 7, -38, 8, LIGHT, 0.28);
  softSpot(ctx, 3, -42, 8, SHADOW, 0.3);
  // Trim along the hem
  ctx.fillStyle = shade(hero.accent, -15);
  ctx.fillRect(-16, -18.5, 34, 2.6);
  // Laced collar
  ctx.fillStyle = shade(hero.tunic, -38);
  ctx.beginPath();
  ctx.moveTo(-3, -44);
  ctx.lineTo(1.5, -36);
  ctx.lineTo(6, -44);
  ctx.fill();
  ctx.strokeStyle = shade(hero.accent, 20);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-0.5, -41.5);
  ctx.lineTo(3.5, -40);
  ctx.moveTo(3.5, -41.5);
  ctx.lineTo(-0.5, -40);
  ctx.stroke();
  ctx.restore();

  // Belt, buckle and a little pouch
  ctx.beginPath();
  ctx.roundRect(-10, -28.5, 22.5, 4.6, 2);
  pen(ctx, vGrad(ctx, -28.5, -24, shade(hero.leather, -15), 20, -25), 1.6);
  ctx.beginPath();
  ctx.roundRect(5, -28.2, 4.2, 4, 1);
  pen(ctx, hero.accent, 1.2);
  ctx.beginPath();
  ctx.roundRect(-8.5, -25.5, 6, 6.5, [1, 1, 3, 3]);
  pen(ctx, vGrad(ctx, -25.5, -19, hero.leather, 20, -30), 1.4);
}

function drawEyes(ctx: CanvasRenderingContext2D, hero: Hero, rig: Rig, t: number): void {
  const { x: hx, y: hy } = HEAD;
  const eyeY = hy + 2;
  const blink = t % 3.6 > 3.48;
  ctx.strokeStyle = WARM_INK;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  if (rig.mouth === "ouch") {
    ctx.beginPath();
    for (const [ex, d] of [[hx + 10, -1], [hx + 1.5, 1]] as const) {
      ctx.moveTo(ex - 2.2 * d, eyeY - 2.2);
      ctx.lineTo(ex + 1.8 * d, eyeY);
      ctx.lineTo(ex - 2.2 * d, eyeY + 2.2);
    }
    ctx.stroke();
  } else if (blink) {
    ctx.beginPath();
    ctx.moveTo(hx + 8, eyeY + 0.5);
    ctx.quadraticCurveTo(hx + 10, eyeY + 1.8, hx + 12, eyeY + 0.5);
    ctx.moveTo(hx, eyeY + 0.5);
    ctx.quadraticCurveTo(hx + 1.5, eyeY + 1.6, hx + 3, eyeY + 0.5);
    ctx.stroke();
  } else {
    // Small painted eyes: dark iris, one catch-light.
    for (const [ex, rx, ry] of [[hx + 1.5, 1.8, 2.5], [hx + 10, 2.2, 2.9]] as const) {
      ctx.fillStyle = shade(hero.eyes, -25);
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff8ec";
      ctx.beginPath();
      ctx.arc(ex + rx * 0.3, eyeY - ry * 0.4, rx * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Thick brows carry the mood.
  ctx.strokeStyle = shade(hero.hair, -10);
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(hx + 7, hy - 3 + rig.brow * 0.7);
  ctx.quadraticCurveTo(hx + 10, hy - 4.8 - rig.brow * 0.3, hx + 13, hy - 3.2 - rig.brow * 0.7);
  ctx.moveTo(hx - 1, hy - 2.8 - rig.brow * 0.7);
  ctx.quadraticCurveTo(hx + 1.5, hy - 4.4 - rig.brow * 0.3, hx + 4, hy - 3 + rig.brow * 0.7);
  ctx.stroke();
}

function drawMouth(ctx: CanvasRenderingContext2D, rig: Rig): void {
  const mx = HEAD.x + 10.5;
  const my = HEAD.y + 10.5;
  ctx.strokeStyle = WARM_INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (rig.mouth === "smile") {
    ctx.arc(mx, my - 2, 2.6, 0.3, Math.PI - 0.4);
    ctx.stroke();
  } else if (rig.mouth === "grin") {
    ctx.moveTo(mx - 3.3, my - 1);
    ctx.quadraticCurveTo(mx, my - 1.6, mx + 3.3, my - 1.3);
    ctx.quadraticCurveTo(mx + 1, my + 3.5, mx - 3.3, my - 1);
    ctx.closePath();
    pen(ctx, "#7a2a1e", 1.3);
  } else if (rig.mouth === "open") {
    ctx.ellipse(mx, my, 1.9, 2.4, 0, 0, Math.PI * 2);
    pen(ctx, "#7a2a1e", 1.3);
  } else {
    ctx.moveTo(mx - 3, my);
    ctx.quadraticCurveTo(mx - 1.5, my - 1.8, mx, my);
    ctx.quadraticCurveTo(mx + 1.5, my + 1.8, mx + 3, my);
    ctx.stroke();
  }
}

function drawFace(ctx: CanvasRenderingContext2D, hero: Hero, rig: Rig, t: number): void {
  const { x: hx, y: hy } = HEAD;
  softSpot(ctx, hx + 12.5, hy + 7.5, 4.5, [235, 110, 90], 0.4);
  softSpot(ctx, hx - 1, hy + 7, 3.5, [235, 110, 90], 0.3);
  drawEyes(ctx, hero, rig, t);
  // Round button nose poking past the cheek.
  ctx.beginPath();
  ctx.ellipse(hx + 15, hy + 5, 2.5, 2.2, 0, 0, Math.PI * 2);
  pen(ctx, ballGrad(ctx, hx + 15, hy + 5, 2.5, shade(hero.skin, -4), 35, -25), 1.1);
  softSpot(ctx, hx + 15, hy + 5.5, 2.2, [230, 100, 80], 0.2);
  drawMouth(ctx, rig);
}

function drawHead(ctx: CanvasRenderingContext2D, hero: Hero, rig: Rig, t: number, running: boolean): void {
  const { x: hx, y: hy, r } = HEAD;
  ctx.beginPath();
  ctx.ellipse(hx, hy, r, r * 0.96, 0, 0, Math.PI * 2);
  pen(ctx, ballGrad(ctx, hx + 5, hy + 1, r, hero.skin, 28, -34), 2);
  ctx.save();
  ctx.clip();
  softSpot(ctx, hx - 10, hy + 4, 13, SHADOW, 0.25);
  softSpot(ctx, hx + 2, hy + 18, 10, SHADOW, 0.2);
  ctx.restore();
  // Ear
  ctx.beginPath();
  ctx.ellipse(hx - 6.5, hy + 3, 3.5, 4.5, 0.1, 0, Math.PI * 2);
  pen(ctx, shade(hero.skin, -12), 1.6);
  ctx.strokeStyle = shade(hero.skin, -50);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(hx - 6.2, hy + 3, 1.7, -1.2, 1.4);
  ctx.stroke();

  drawFace(ctx, hero, rig, t);
  drawHairFront(ctx, hero, t, running);
  drawHeadgear(ctx, hero);
  if (hero.glasses) drawGlasses(ctx);
}

function castGlow(ctx: CanvasRenderingContext2D, x: number, y: number, cast: number, color: string): void {
  if (cast <= 0) return;
  const r = 9 + cast * 9;
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, "rgba(255,252,235,0.95)");
  g.addColorStop(0.4, color);
  g.addColorStop(1, "rgba(255,210,120,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Everything behind the body: pack, hair volume, hood drape, shield arm. */
function drawBackLayer(ctx: CanvasRenderingContext2D, hero: Hero, rig: Rig, pose: Pose, running: boolean): void {
  ctx.save();
  ctx.translate(0, HIP_Y);
  ctx.rotate(rig.lean);
  ctx.translate(0, -HIP_Y);
  if (hero.pack) drawPack(ctx, hero);
  drawHairBack(ctx, hero, pose.t, running);
  drawHeadgearBack(ctx, hero);
  const hand = drawArm(ctx, hero, SHOULDER_B.x, SHOULDER_B.y, rig.armB, rig.elbowB, true);
  if (hero.shield) drawShield(ctx, hero, hand.hx - 4, hand.hy - 3);
  ctx.restore();
}

/** Draws a hero with its feet at (x, y). */
export function drawHero(ctx: CanvasRenderingContext2D, hero: Hero, x: number, y: number, pose: Pose): void {
  const rig = rigFor(pose);
  const cast = pose.cast ?? 0;
  const castK = Math.min(1, cast * 1.6);
  if (cast > 0 && pose.state !== "hurt") {
    // Arm snaps forward when the shot leaves the weapon.
    rig.armF = -1.5 * castK + rig.armF * (1 - castK);
    rig.elbowF = rig.elbowF * (1 - cast);
    rig.brow = -1;
  }
  const running = pose.state === "run";
  const sx = 1 + pose.squash * 0.16;
  const sy = 1 - pose.squash * 0.2;

  ctx.save();
  ctx.translate(x, y);
  dropShadow(ctx, 0, 0, 16, 0.24);
  ctx.scale(pose.facing * sx, sy);
  ctx.translate(0, rig.bob);

  drawBackLayer(ctx, hero, rig, pose, running);
  drawLeg(ctx, hero, -3, rig.thighB, rig.kneeB, true);
  drawLeg(ctx, hero, 3.5, rig.thighF, rig.kneeF, false);

  // Upper body leans from the hips.
  ctx.translate(0, HIP_Y);
  ctx.rotate(rig.lean + (pose.state === "hurt" ? -0.12 : 0));
  ctx.translate(0, -HIP_Y);
  drawTorso(ctx, hero, running ? Math.sin(pose.t * 13) * 1.2 : 0);

  const elbow = limbPoints(SHOULDER_F.x, SHOULDER_F.y, rig.armF, rig.elbowF, UPPER_ARM, FOREARM);
  const rest = WEAPON_REST[hero.weapon] + rig.armF * 0.3;
  const angle = rest * (1 - castK) - 0.1 * castK;
  drawWeapon(ctx, hero, elbow.ex, elbow.ey, angle);
  // The arm goes under the head so a raised hand never hides the face.
  const hand = drawArm(ctx, hero, SHOULDER_F.x, SHOULDER_F.y, rig.armF, rig.elbowF, false);
  drawHead(ctx, hero, rig, pose.t, running);
  const reach = WEAPON_REACH[hero.weapon];
  castGlow(ctx, hand.hx + Math.cos(angle) * reach, hand.hy + Math.sin(angle) * reach, cast, hero.accent);
  ctx.restore();
}

/** Hero flying a little plane, nose at +x. */
export function drawHeroPlane(ctx: CanvasRenderingContext2D, hero: Hero, x: number, y: number, t: number, tilt: number, hurt: boolean, cast = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  // Engine trail
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.55 - i * 0.1})`;
    ctx.beginPath();
    ctx.arc(-40 - i * 8, 3 + Math.sin(t * 22 + i) * 1.5, 4.5 - i * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far wing
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.lineTo(-16, -15);
  ctx.quadraticCurveTo(-8, -18, -2, -15);
  ctx.lineTo(10, -3);
  ctx.closePath();
  pen(ctx, shade(hero.tunic, -40));

  // Pilot (head + shoulders) in the cockpit
  ctx.save();
  ctx.translate(-4, 2);
  ctx.scale(0.72, 0.72);
  const rig: Rig = { ...rigFor({ state: "idle", t, facing: 1, squash: 0 }), mouth: hurt ? "ouch" : cast > 0 ? "open" : "grin", brow: hurt ? 1 : -0.5 };
  ctx.beginPath();
  ctx.roundRect(-10, -44, 22, 20, 8);
  pen(ctx, vGrad(ctx, -44, -24, hero.tunic));
  drawHairBack(ctx, hero, t, true);
  drawHeadgearBack(ctx, hero);
  drawHead(ctx, hero, rig, t, true);
  ctx.restore();

  // Fuselage
  ctx.beginPath();
  ctx.moveTo(-36, -3);
  ctx.quadraticCurveTo(-32, -11, -14, -10);
  ctx.lineTo(-10, -10);
  ctx.quadraticCurveTo(-4, -2, 8, -10);
  ctx.lineTo(20, -10);
  ctx.quadraticCurveTo(36, -9, 38, 2);
  ctx.quadraticCurveTo(36, 14, 16, 14);
  ctx.lineTo(-22, 12);
  ctx.quadraticCurveTo(-36, 8, -36, -3);
  ctx.closePath();
  pen(ctx, vGrad(ctx, -12, 14, hero.accent, 40, -45));
  ctx.save();
  ctx.clip();
  ctx.fillStyle = hero.tunic;
  ctx.fillRect(-40, 3, 80, 4);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.roundRect(10, -7, 18, 3, 1.5);
  ctx.fill();
  ctx.restore();
  // Tail fin
  ctx.beginPath();
  ctx.moveTo(-31, -5);
  ctx.lineTo(-42, -23);
  ctx.quadraticCurveTo(-35, -25, -30, -22);
  ctx.lineTo(-20, -8);
  ctx.closePath();
  pen(ctx, vGrad(ctx, -25, -5, hero.tunic));
  // Near wing
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.lineTo(-24, 23);
  ctx.quadraticCurveTo(-14, 26, -6, 23);
  ctx.lineTo(14, 6);
  ctx.closePath();
  pen(ctx, vGrad(ctx, 6, 25, hero.tunic));
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(-12, 9, 18, 2.5);
  // Nose cone + propeller blur
  ctx.beginPath();
  ctx.arc(38, 2, 5, 0, Math.PI * 2);
  pen(ctx, ballGrad(ctx, 38, 2, 5, "#94a3b8"), 2);
  const blade = 4 + Math.abs(Math.sin(t * 45)) * 15;
  ctx.fillStyle = "rgba(30,30,50,0.45)";
  ctx.beginPath();
  ctx.ellipse(42, 2, 2.6, blade, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(42, 2, 3, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  castGlow(ctx, 46, 2, cast, hero.accent);
  ctx.restore();
}
