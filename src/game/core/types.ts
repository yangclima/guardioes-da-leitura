import type { SegmentMode, Theme } from "@/lib/types";

export const VIEW_W = 960;
export const VIEW_H = 540;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Solid extends Rect {
  /** Platforms can be jumped through from below. */
  oneWay: boolean;
}

export type WalkerKind = "slime" | "raptor" | "beetle" | "turtle";
export type SpikeKind = "thorns" | "cactus" | "ice" | "crystal" | "metal";
export type FlyerKind = "bird" | "ptero" | "bat" | "asteroid" | "storm" | "moth";

export interface Walker extends Rect {
  type: "walker";
  kind: WalkerKind;
  vx: number;
  minX: number;
  maxX: number;
  alive: boolean;
  /** Turtles become a shell after the first stomp. */
  shell: boolean;
  /** Seconds since squashed (for the poof animation). */
  deadT: number;
  /** Power hits left before defeat. */
  hp: number;
  /** Seconds left of the white "got hit" flash. */
  hitT: number;
}

export interface Spike extends Rect {
  type: "spike";
  kind: SpikeKind;
}

export interface Flyer {
  type: "flyer";
  kind: FlyerKind;
  x: number;
  baseY: number;
  y: number;
  r: number;
  /** Vertical bob amplitude and speed. */
  amp: number;
  freq: number;
  phase: number;
  vx: number;
  active: boolean;
  hp: number;
  hitT: number;
}

export interface PowerShot extends Rect {
  vx: number;
  life: number;
  /** Letter carried by the magic shot (reading theme). */
  glyph: string;
}

export type Hazard = Walker | Spike | Flyer;

export interface Star {
  x: number;
  y: number;
  taken: boolean;
}

export interface Segment {
  mode: SegmentMode;
  theme: Theme;
  length: number;
  solids: Solid[];
  hazards: Hazard[];
  stars: Star[];
  gate: Rect;
  spawn: { x: number; y: number };
  /** Auto-scroll speed for flight segments (px/s). */
  scrollSpeed: number;
}
