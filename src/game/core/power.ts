import type { FlyerKind, Hazard, WalkerKind } from "./types";

/**
 * Magic-shot balance. The shot is a tool, not the main way to win:
 * few charges, short range and a cooldown keep jumping and dodging
 * as the core skill, and reading well (right answers) refills it.
 */
export const POWER_COOLDOWN = 0.8;
export const POWER_SPEED = 620;
/** ~310px of range: about a third of the screen, no sniping off-screen. */
export const POWER_LIFE = 0.5;
export const POWER_MAX_CHARGES: Record<1 | 2 | 3, number> = { 1: 3, 2: 3, 3: 2 };
/** Charges recovered for each star picked up. */
export const CHARGE_PER_STAR = 1;
/** Charges recovered for each right answer at a gate. */
export const CHARGE_PER_RIGHT_ANSWER = 1;
/** Asteroids this big shrug off the shot. */
export const ASTEROID_IMMUNE_RADIUS = 32;
export const HIT_FLASH = 0.18;

/** Power hits needed to defeat each enemy; 0 means immune. */
const WALKER_HP: Record<WalkerKind, number> = { slime: 1, beetle: 1, raptor: 2, turtle: 1 };
const FLYER_HP: Record<FlyerKind, number> = { bird: 1, bat: 1, moth: 1, ptero: 2, storm: 0, asteroid: 1 };

export function initialHp(kind: WalkerKind | FlyerKind, radius = 0): number {
  if (kind === "asteroid") return radius >= ASTEROID_IMMUNE_RADIUS ? 0 : 1;
  if (kind in WALKER_HP) return WALKER_HP[kind as WalkerKind];
  return FLYER_HP[kind as FlyerKind];
}

export type PowerHitResult = "immune" | "hurt" | "shell" | "defeated";

/** What a shot does to a hazard (spikes, storms and big rocks are immune). */
export function powerHitResult(h: Hazard): PowerHitResult {
  if (h.type === "spike" || h.hp <= 0) return "immune";
  if (h.type === "walker" && h.kind === "turtle" && !h.shell) return "shell";
  return h.hp > 1 ? "hurt" : "defeated";
}

export function maxCharges(difficulty: 1 | 2 | 3): number {
  return POWER_MAX_CHARGES[difficulty];
}

export function addCharges(current: number, amount: number, max: number): number {
  return Math.max(0, Math.min(max, current + amount));
}
