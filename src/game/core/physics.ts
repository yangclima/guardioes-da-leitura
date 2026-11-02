import type { Rect, Solid } from "./types";
import { VIEW_H } from "./types";

export const PLAYER_W = 26;
export const PLAYER_H = 48;

export const GRAVITY = 2300;
export const JUMP_VELOCITY = 840;
export const MAX_FALL = 1100;
export const RUN_SPEED = 290;
const GROUND_ACCEL = 2600;
const AIR_ACCEL = 1700;
const GROUND_FRICTION = 2800;
/** Grace time to still jump after walking off a ledge. */
export const COYOTE_TIME = 0.1;
/** A jump pressed slightly before landing still counts. */
export const JUMP_BUFFER = 0.13;
const DROP_THROUGH_TIME = 0.16;
/** Releasing jump early cuts the upward speed: short hop vs. full jump. */
const JUMP_CUT = 0.45;

export const FLY_SPEED = 330;
const FLY_ACCEL = 2200;
const FLY_DAMPING = 6;

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  /** True only on the frame jump was pressed. */
  jumpPressed: boolean;
  /** True only on the frame the power button was pressed. */
  powerPressed: boolean;
}

export interface Body extends Rect {
  vx: number;
  vy: number;
  onGround: boolean;
  coyote: number;
  jumpBuffer: number;
  facing: 1 | -1;
  /** Briefly disables one-way platform landing after pressing down. */
  dropThrough: number;
}

export interface StepEvents {
  jumped: boolean;
  landed: boolean;
  landingSpeed: number;
}

export function createBody(x: number, y: number): Body {
  return { x, y, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, onGround: false, coyote: 0, jumpBuffer: 0, facing: 1, dropThrough: 0 };
}

function approach(value: number, target: number, delta: number): number {
  if (value < target) return Math.min(value + delta, target);
  return Math.max(value - delta, target);
}

/** Moves the body along X, then Y, resolving against solids (mutates body for speed in the game loop). */
export function stepPlatformer(body: Body, input: InputState, solids: readonly Solid[], dt: number): StepEvents {
  const events: StepEvents = { jumped: false, landed: false, landingSpeed: 0 };
  body.dropThrough = Math.max(0, body.dropThrough - dt);
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) body.facing = dir > 0 ? 1 : -1;

  const accel = body.onGround ? (dir === 0 ? GROUND_FRICTION : GROUND_ACCEL) : AIR_ACCEL;
  body.vx = approach(body.vx, dir * RUN_SPEED, accel * dt);

  body.jumpBuffer = input.jumpPressed ? JUMP_BUFFER : Math.max(0, body.jumpBuffer - dt);
  body.coyote = body.onGround ? COYOTE_TIME : Math.max(0, body.coyote - dt);

  if (input.down && body.onGround) {
    body.dropThrough = DROP_THROUGH_TIME;
    body.onGround = false;
    body.coyote = 0;
    body.vy = Math.max(body.vy, 100);
  }

  if (body.jumpBuffer > 0 && body.coyote > 0) {
    body.vy = -JUMP_VELOCITY;
    body.jumpBuffer = 0;
    body.coyote = 0;
    body.onGround = false;
    events.jumped = true;
  }
  if (!input.jump && body.vy < 0) body.vy *= 1 - JUMP_CUT * Math.min(1, dt * 20);

  body.vy = Math.min(MAX_FALL, body.vy + GRAVITY * dt);

  body.x += body.vx * dt;
  for (const s of solids) {
    if (s.oneWay || !overlapsSolid(body, s)) continue;
    if (body.vx > 0) body.x = s.x - body.w;
    else if (body.vx < 0) body.x = s.x + s.w;
    body.vx = 0;
  }
  if (body.x < 0) {
    body.x = 0;
    body.vx = 0;
  }

  const prevBottom = body.y + body.h;
  body.y += body.vy * dt;
  const wasOnGround = body.onGround;
  body.onGround = false;
  for (const s of solids) {
    if (!overlapsSolid(body, s)) continue;
    if (body.vy >= 0 && (!s.oneWay || (body.dropThrough <= 0 && prevBottom <= s.y + 1))) {
      if (!wasOnGround) {
        events.landed = true;
        events.landingSpeed = body.vy;
      }
      body.y = s.y - body.h;
      body.vy = 0;
      body.onGround = true;
    } else if (body.vy < 0 && !s.oneWay) {
      body.y = s.y + s.h;
      body.vy = 0;
    }
  }
  return events;
}

function overlapsSolid(body: Rect, s: Solid): boolean {
  return body.x < s.x + s.w && body.x + body.w > s.x && body.y < s.y + s.h && body.y + body.h > s.y;
}

/** Free 2D movement for flight segments, kept inside the visible window. */
export function stepFlyer(body: Body, input: InputState, dt: number, viewLeft: number, viewWidth: number): void {
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up || input.jump ? 1 : 0);
  body.vx = approach(body.vx, dx * FLY_SPEED * 0.8, FLY_ACCEL * dt);
  body.vy = approach(body.vy, dy * FLY_SPEED, FLY_ACCEL * dt);
  if (dx === 0) body.vx *= Math.max(0, 1 - FLY_DAMPING * dt);
  if (dy === 0) body.vy *= Math.max(0, 1 - FLY_DAMPING * dt);

  body.x += body.vx * dt;
  body.y += body.vy * dt;
  const minX = viewLeft + 40;
  const maxX = viewLeft + viewWidth * 0.7;
  body.x = Math.max(minX, Math.min(maxX, body.x));
  const minY = 30;
  const maxY = VIEW_H - 70 - body.h;
  if (body.y < minY) {
    body.y = minY;
    body.vy = 0;
  }
  if (body.y > maxY) {
    body.y = maxY;
    body.vy = 0;
  }
}
