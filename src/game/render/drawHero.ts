import type { Hero } from "./heroes";
import { drawHairBack, drawHairFront, drawHeadgear } from "./heroHair";
import { ballGrad, capsule, cartoonEye, dropShadow, ink, OUTLINE, shade, vGrad } from "./paint";

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
        armF: 0.75 * Math.sin(p),
        elbowF: -0.95,
        armB: -0.75 * Math.sin(p),
        elbowB: -0.95,
        lean: 0.14,
        bob: -Math.abs(Math.sin(p)) * 2.4,
        mouth: "grin",
        brow: 0,
      };
    case "jump":
      return { thighF: -1.0, kneeF: 1.5, thighB: 0.35, kneeB: 0.9, armF: -1.9, elbowF: -0.35, armB: -2.5, elbowB: -0.4, lean: 0.05, bob: 0, mouth: "open", brow: -1 };
    case "fall":
      return { thighF: -0.35, kneeF: 0.4, thighB: 0.45, kneeB: 0.7, armF: -1.9, elbowF: -0.5, armB: -1.3, elbowB: -0.6, lean: -0.04, bob: 0, mouth: "open", brow: 1 };
    case "hurt":
      return { thighF: -0.5, kneeF: 0.6, thighB: 0.5, kneeB: 0.4, armF: -2.4, elbowF: 0.4, armB: 2.2, elbowB: -0.3, lean: -0.2, bob: 0, mouth: "ouch", brow: 1 };
    default: {
      const breathe = Math.sin(t * 2.6);
      return { thighF: -0.06, kneeF: 0.08, thighB: 0.08, kneeB: 0.08, armF: 0.12 + breathe * 0.04, elbowF: -0.25, armB: -0.08, elbowB: -0.3, lean: 0, bob: breathe * 0.9, mouth: "smile", brow: 0 };
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

function drawLeg(ctx: CanvasRenderingContext2D, hero: Hero, hipX: number, thigh: number, knee: number, back: boolean): void {
  const pants = back ? shade(hero.pants, -28) : hero.pants;
  const { jx, jy, ex, ey } = limbPoints(hipX, HIP_Y, thigh, knee, THIGH, SHIN);
  capsule(ctx, hipX, HIP_Y, jx, jy, 9.5, pants);
  capsule(ctx, jx, jy, ex, ey, 8.5, shade(pants, back ? 0 : -8));
  // Sneaker: stays mostly level so the foot reads clearly.
  const shoe = back ? shade(hero.shoes, -35) : hero.shoes;
  ctx.save();
  ctx.translate(ex, ey + 1);
  ctx.rotate(-(thigh + knee) * 0.35);
  ctx.beginPath();
  ctx.moveTo(-5, -4.5);
  ctx.quadraticCurveTo(3, -6.5, 8, -2.5);
  ctx.quadraticCurveTo(11.5, 0, 10, 3);
  ctx.lineTo(-5.5, 3);
  ctx.quadraticCurveTo(-7, -1, -5, -4.5);
  ctx.closePath();
  ink(ctx, shoe, 2.3);
  ctx.fillStyle = back ? "#cbd5e1" : "#ffffff";
  ctx.fillRect(-5, 1, 15, 2);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-5.5, 3);
  ctx.lineTo(10, 3);
  ctx.moveTo(0, -5);
  ctx.lineTo(2, -2.5);
  ctx.moveTo(3, -5.5);
  ctx.lineTo(5, -3);
  ctx.stroke();
  ctx.restore();
}

function drawArm(ctx: CanvasRenderingContext2D, hero: Hero, sx: number, sy: number, arm: number, elbow: number, back: boolean, cast: number): { hx: number; hy: number } {
  const sleeve = back ? shade(hero.shirt, -32) : hero.shirt;
  const skin = back ? shade(hero.skin, -22) : hero.skin;
  const { jx, jy, ex, ey } = limbPoints(sx, sy, arm, elbow, UPPER_ARM, FOREARM);
  capsule(ctx, jx, jy, ex, ey, 6.5, skin);
  capsule(ctx, sx, sy, jx, jy, 8, sleeve);
  ctx.beginPath();
  ctx.arc(ex, ey + 0.5, cast > 0 && !back ? 4.6 : 3.9, 0, Math.PI * 2);
  ink(ctx, skin, 2.2);
  return { hx: ex, hy: ey };
}

function drawTorso(ctx: CanvasRenderingContext2D, hero: Hero): void {
  // Neck
  ctx.beginPath();
  ctx.roundRect(-3, -47, 8, 7, 3);
  ink(ctx, shade(hero.skin, -18), 2);

  ctx.beginPath();
  ctx.moveTo(-9.5, -41);
  ctx.quadraticCurveTo(1, -46, 11, -41);
  ctx.quadraticCurveTo(12.5, -33, 10, -25);
  ctx.quadraticCurveTo(0.5, -22.5, -8.5, -25);
  ctx.quadraticCurveTo(-11, -33, -9.5, -41);
  ctx.closePath();
  ink(ctx, vGrad(ctx, -45, -24, hero.shirt, 28, -30));

  ctx.save();
  ctx.clip();
  // Cel shadow on the back half, rim light on the front.
  ctx.fillStyle = "rgba(20,10,50,0.18)";
  ctx.fillRect(-14, -48, 8, 30);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(7, -44, 3, 18);
  // Collar
  ctx.fillStyle = shade(hero.shirt, -40);
  ctx.beginPath();
  ctx.moveTo(-5, -43);
  ctx.quadraticCurveTo(1, -36, 7, -43);
  ctx.lineTo(7, -45);
  ctx.lineTo(-5, -45);
  ctx.fill();
  // Emblem: an open book, the guardian symbol.
  ctx.fillStyle = hero.accent;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(1, -34);
  ctx.quadraticCurveTo(4, -36, 7, -35);
  ctx.lineTo(7, -29.5);
  ctx.quadraticCurveTo(4, -30.5, 1, -28.5);
  ctx.quadraticCurveTo(-2, -30.5, -5, -29.5);
  ctx.lineTo(-5, -35);
  ctx.quadraticCurveTo(-2, -36, 1, -34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, -34);
  ctx.lineTo(1, -28.5);
  ctx.stroke();
  ctx.restore();

  // Belt
  ctx.beginPath();
  ctx.roundRect(-9, -27.5, 19.5, 5, 2);
  ink(ctx, shade(hero.pants, -30), 2);
  ctx.beginPath();
  ctx.roundRect(4, -27, 4, 4, 1);
  ink(ctx, "#facc15", 1.2);
}

function drawFace(ctx: CanvasRenderingContext2D, hero: Hero, rig: Rig, t: number): void {
  const { x: hx, y: hy } = HEAD;
  const blink = t % 3.6 > 3.48;
  const hurt = rig.mouth === "ouch";

  // Cheeks
  ctx.fillStyle = "rgba(255,105,120,0.35)";
  ctx.beginPath();
  ctx.ellipse(hx + 12.5, hy + 6, 3.4, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(hx - 2.5, hy + 6, 2.6, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (three-quarter view: the far eye is a bit narrower)
  const eyeY = hy + 0.5;
  if (hurt) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    for (const [ex, s] of [[hx + 9.5, 3], [hx + 1, 2.4]] as const) {
      ctx.beginPath();
      ctx.moveTo(ex - s, eyeY - s);
      ctx.lineTo(ex + s, eyeY + s);
      ctx.moveTo(ex + s, eyeY - s);
      ctx.lineTo(ex - s, eyeY + s);
      ctx.stroke();
    }
  } else if (blink) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx + 9.5, eyeY - 1, 3, 0.2, Math.PI - 0.2);
    ctx.moveTo(hx + 3.3, eyeY);
    ctx.arc(hx + 1, eyeY - 1, 2.4, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    cartoonEye(ctx, hx + 1, eyeY, 2.5, 3.9, hero.eyes, 0.5);
    cartoonEye(ctx, hx + 9.5, eyeY, 3.1, 4.2, hero.eyes, 0.45);
  }

  // Brows show the mood.
  ctx.strokeStyle = shade(hero.hair, -10);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(hx + 6.5, hy - 5.5 + rig.brow * 0.6);
  ctx.quadraticCurveTo(hx + 9.5, hy - 7.5 - rig.brow * 0.4, hx + 12.5, hy - 5.8 - rig.brow * 0.6);
  ctx.moveTo(hx - 1.5, hy - 5.2 - rig.brow * 0.6);
  ctx.quadraticCurveTo(hx + 1, hy - 6.8 - rig.brow * 0.4, hx + 3.5, hy - 5.5 + rig.brow * 0.6);
  ctx.stroke();

  // Nose
  ctx.strokeStyle = shade(hero.skin, -45);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hx + 15.5, hy + 1);
  ctx.quadraticCurveTo(hx + 17.5, hy + 4, hx + 14.5, hy + 4.5);
  ctx.stroke();

  // Mouth
  const mx = hx + 9.5;
  const my = hy + 9;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (rig.mouth === "smile") {
    ctx.arc(mx, my - 2.5, 3.2, 0.25, Math.PI - 0.35);
    ctx.stroke();
  } else if (rig.mouth === "grin") {
    ctx.moveTo(mx - 3.8, my - 1);
    ctx.quadraticCurveTo(mx, my - 1.8, mx + 3.8, my - 1.4);
    ctx.quadraticCurveTo(mx + 1, my + 4, mx - 3.8, my - 1);
    ctx.closePath();
    ink(ctx, "#7f1d1d", 1.6);
    ctx.fillStyle = "#fff";
    ctx.fillRect(mx - 2.6, my - 1.2, 5, 1.4);
  } else if (rig.mouth === "open") {
    ctx.ellipse(mx, my, 2.2, 2.8, 0, 0, Math.PI * 2);
    ink(ctx, "#7f1d1d", 1.6);
  } else {
    ctx.moveTo(mx - 3.5, my);
    ctx.quadraticCurveTo(mx - 1.7, my - 2, mx, my);
    ctx.quadraticCurveTo(mx + 1.7, my + 2, mx + 3.5, my);
    ctx.stroke();
  }
}

function drawHead(ctx: CanvasRenderingContext2D, hero: Hero, rig: Rig, t: number, running: boolean): void {
  const { x: hx, y: hy, r } = HEAD;
  ctx.beginPath();
  ctx.ellipse(hx, hy, r, r * 0.96, 0, 0, Math.PI * 2);
  ink(ctx, ballGrad(ctx, hx + 4, hy, r, hero.skin, 30, -30));
  // Jaw shadow under the hair line keeps the head from looking flat.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(60,20,30,0.12)";
  ctx.beginPath();
  ctx.ellipse(hx - 9, hy + 2, 9, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Ear
  ctx.beginPath();
  ctx.ellipse(hx - 6.5, hy + 2, 3.6, 4.6, 0.1, 0, Math.PI * 2);
  ink(ctx, shade(hero.skin, -10), 2);
  ctx.strokeStyle = shade(hero.skin, -45);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(hx - 6.2, hy + 2, 1.8, -1.2, 1.4);
  ctx.stroke();

  drawFace(ctx, hero, rig, t);
  drawHairFront(ctx, hero, t, running);
  drawHeadgear(ctx, hero);
}

function castGlow(ctx: CanvasRenderingContext2D, x: number, y: number, cast: number, color: string): void {
  if (cast <= 0) return;
  const r = 9 + cast * 9;
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.4, color);
  g.addColorStop(1, "rgba(167,139,250,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Draws a hero with its feet at (x, y). */
export function drawHero(ctx: CanvasRenderingContext2D, hero: Hero, x: number, y: number, pose: Pose): void {
  const rig = rigFor(pose);
  const cast = pose.cast ?? 0;
  if (cast > 0 && pose.state !== "hurt") {
    // Arm snaps forward when the shot leaves the hand.
    rig.armF = -1.5 * Math.min(1, cast * 1.6) + rig.armF * (1 - Math.min(1, cast * 1.6));
    rig.elbowF = rig.elbowF * (1 - cast);
    rig.brow = -1;
  }
  const running = pose.state === "run";
  const sx = 1 + pose.squash * 0.16;
  const sy = 1 - pose.squash * 0.2;

  ctx.save();
  ctx.translate(x, y);
  dropShadow(ctx, 0, 0, 15, 0.22);
  ctx.scale(pose.facing * sx, sy);
  ctx.translate(0, rig.bob);

  // Back layer
  ctx.save();
  ctx.translate(0, HIP_Y);
  ctx.rotate(rig.lean);
  ctx.translate(0, -HIP_Y);
  drawHairBack(ctx, hero, pose.t, running);
  drawArm(ctx, hero, -2.5, -40, rig.armB, rig.elbowB, true, 0);
  ctx.restore();

  drawLeg(ctx, hero, -3, rig.thighB, rig.kneeB, true);
  drawLeg(ctx, hero, 3.5, rig.thighF, rig.kneeF, false);

  // Upper body leans from the hips.
  ctx.translate(0, HIP_Y);
  ctx.rotate(rig.lean + (pose.state === "hurt" ? -0.12 : 0));
  ctx.translate(0, -HIP_Y);
  drawTorso(ctx, hero);
  // The arm goes under the head so a raised hand never hides the face.
  const hand = drawArm(ctx, hero, 4.5, -40, rig.armF, rig.elbowF, false, cast);
  drawHead(ctx, hero, rig, pose.t, running);
  castGlow(ctx, hand.hx + 4, hand.hy, cast, hero.accent);
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
  ink(ctx, shade(hero.shirt, -40));

  // Pilot (head + shoulders) in the cockpit
  ctx.save();
  ctx.translate(-4, 2);
  ctx.scale(0.72, 0.72);
  const rig: Rig = { ...rigFor({ state: "idle", t, facing: 1, squash: 0 }), mouth: hurt ? "ouch" : cast > 0 ? "open" : "grin", brow: hurt ? 1 : -0.5 };
  ctx.beginPath();
  ctx.roundRect(-10, -44, 22, 20, 8);
  ink(ctx, vGrad(ctx, -44, -24, hero.shirt));
  drawHairBack(ctx, hero, t, true);
  drawHead(ctx, hero, rig, t, true);
  // Flight goggles pushed up on the forehead
  ctx.beginPath();
  ctx.ellipse(HEAD.x + 4, HEAD.y - 9, 12, 3, 0, 0, Math.PI * 2);
  ink(ctx, "#78350f", 1.6);
  for (const gx of [HEAD.x + 1, HEAD.x + 9]) {
    ctx.beginPath();
    ctx.arc(gx, HEAD.y - 9, 3.6, 0, Math.PI * 2);
    ink(ctx, "#7dd3fc", 1.6);
  }
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
  ink(ctx, vGrad(ctx, -12, 14, hero.accent, 40, -45));
  ctx.save();
  ctx.clip();
  ctx.fillStyle = hero.shirt;
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
  ink(ctx, vGrad(ctx, -25, -5, hero.shirt));
  // Near wing
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.lineTo(-24, 23);
  ctx.quadraticCurveTo(-14, 26, -6, 23);
  ctx.lineTo(14, 6);
  ctx.closePath();
  ink(ctx, vGrad(ctx, 6, 25, hero.shirt));
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(-12, 9, 18, 2.5);
  // Nose cone + propeller blur
  ctx.beginPath();
  ctx.arc(38, 2, 5, 0, Math.PI * 2);
  ink(ctx, ballGrad(ctx, 38, 2, 5, "#94a3b8"), 2);
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
