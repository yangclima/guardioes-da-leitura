import { STARS_PER_SEGMENT } from "@/lib/gameRules";
import type { Mode, SegmentMode, Theme } from "@/lib/types";
import { initialHp } from "./power";
import { createRng, type Rng } from "./rng";
import type { FlyerKind, Hazard, Rect, Segment, Solid, SpikeKind, Star, WalkerKind } from "./types";
import { VIEW_H } from "./types";

export const GROUND_TOP = 430;
const GROUND_DEPTH = VIEW_H - GROUND_TOP + 200;
const MIN_GROUND_TOP = 340;
const MAX_GROUND_TOP = 450;
/** Comfortable gap below the theoretical max jump reach (~210px). */
const MAX_GAP = 150;

const WALKER_BY_THEME: Record<Theme, WalkerKind> = {
  floresta: "slime",
  deserto: "raptor",
  neve: "slime",
  caverna: "beetle",
  ceu: "slime",
  espaco: "beetle",
};

const SPIKE_BY_THEME: Record<Theme, SpikeKind> = {
  floresta: "thorns",
  deserto: "cactus",
  neve: "ice",
  caverna: "crystal",
  ceu: "metal",
  espaco: "metal",
};

const FLYERS_BY_THEME: Record<Theme, FlyerKind[]> = {
  floresta: ["bird", "moth"],
  deserto: ["ptero", "moth"],
  neve: ["bird", "moth"],
  caverna: ["bat", "moth"],
  ceu: ["storm", "bird", "moth"],
  espaco: ["asteroid", "moth"],
};

export function segmentModeFor(mode: Mode, index: number): SegmentMode {
  if (mode === "misto") return index % 2 === 0 ? "plataforma" : "voo";
  return mode;
}

export interface SegmentOptions {
  seed: string;
  index: number;
  mode: Mode;
  theme: Theme;
  difficulty: 1 | 2 | 3;
}

export function buildSegment(opts: SegmentOptions): Segment {
  const rng = createRng(`${opts.seed}#${opts.index}`);
  const mode = segmentModeFor(opts.mode, opts.index);
  return mode === "plataforma" ? buildPlatformSegment(rng, opts) : buildFlightSegment(rng, opts);
}

/** Picks exactly STARS_PER_SEGMENT spots spread along the candidates. */
function chooseStars(candidates: { x: number; y: number }[], rng: Rng): Star[] {
  const sorted = [...candidates].sort((a, b) => a.x - b.x);
  const stars: Star[] = [];
  const step = sorted.length / STARS_PER_SEGMENT;
  for (let i = 0; i < STARS_PER_SEGMENT; i++) {
    const from = Math.floor(i * step);
    const to = Math.max(from, Math.floor((i + 1) * step) - 1);
    const spot = sorted[rng.int(from, to)];
    stars.push({ x: spot.x, y: spot.y, taken: false });
  }
  return stars;
}

function buildPlatformSegment(rng: Rng, opts: SegmentOptions): Segment {
  const d = opts.difficulty;
  const length = 3000 + d * 500 + rng.int(0, 400);
  const solids: Solid[] = [];
  const hazards: Hazard[] = [];
  const starSpots: { x: number; y: number }[] = [];
  const walkerKind = WALKER_BY_THEME[opts.theme];
  const spikeKind = SPIKE_BY_THEME[opts.theme];

  const ground = (x: number, w: number, top: number) => solids.push({ x, y: top, w, h: GROUND_DEPTH, oneWay: false });

  ground(0, 640, GROUND_TOP);
  starSpots.push({ x: 420, y: GROUND_TOP - 70 });
  let x = 640;
  let top = GROUND_TOP;
  const endZone = length - 700;

  while (x < endZone) {
    const nextTop = Math.max(MIN_GROUND_TOP, Math.min(MAX_GROUND_TOP, top + rng.pick([-60, -40, 0, 0, 30, 50])));
    const hasGap = rng.chance(0.45 + d * 0.08);
    if (hasGap) {
      const climb = top - nextTop;
      const maxGap = climb > 0 ? MAX_GAP - climb : MAX_GAP;
      const gap = rng.int(70, Math.max(80, maxGap - (3 - d) * 15));
      starSpots.push({ x: x + gap / 2, y: Math.min(top, nextTop) - 110 });
      x += gap;
    }
    top = nextTop;
    const w = rng.int(320, 620 - d * 40);
    ground(x, w, top);
    decorateChunk(rng, { x, w, top, d, walkerKind, spikeKind }, solids, hazards, starSpots);
    x += w;
  }

  // Final stretch with the gate.
  const finalTop = top;
  ground(x, length - x + 400, finalTop);
  const gate: Rect = { x: length - 260, y: finalTop - 150, w: 90, h: 150 };
  starSpots.push({ x: length - 520, y: finalTop - 70 });

  while (starSpots.length < STARS_PER_SEGMENT) {
    starSpots.push({ x: 300 + starSpots.length * 200, y: GROUND_TOP - 70 });
  }

  return {
    mode: "plataforma",
    theme: opts.theme,
    length,
    solids: mergeGround(solids),
    hazards,
    stars: chooseStars(starSpots, rng),
    gate,
    spawn: { x: 120, y: GROUND_TOP - 60 },
    scrollSpeed: 0,
  };
}

/** Joins touching ground blocks of the same height so no seam is drawn between them. */
function mergeGround(solids: Solid[]): Solid[] {
  const platforms = solids.filter((s) => s.oneWay);
  const ground = solids.filter((s) => !s.oneWay).sort((a, b) => a.x - b.x);
  const merged: Solid[] = [];
  for (const block of ground) {
    const prev = merged.at(-1);
    if (prev && prev.y === block.y && Math.abs(prev.x + prev.w - block.x) < 0.5) {
      merged[merged.length - 1] = { ...prev, w: block.x + block.w - prev.x };
    } else {
      merged.push(block);
    }
  }
  return [...merged, ...platforms];
}

interface Chunk {
  x: number;
  w: number;
  top: number;
  d: 1 | 2 | 3;
  walkerKind: WalkerKind;
  spikeKind: SpikeKind;
}

/** Adds enemies, spikes and floating platforms to one ground chunk. */
function decorateChunk(rng: Rng, c: Chunk, solids: Solid[], hazards: Hazard[], starSpots: { x: number; y: number }[]): void {
  const margin = 70;
  if (rng.chance(0.35 + c.d * 0.12) && c.w > 300) {
    const turtle = rng.chance(0.32);
    const kind = turtle ? "turtle" : c.walkerKind;
    const size = kind === "turtle" ? { w: 44, h: 30 } : kind === "raptor" ? { w: 38, h: 34 } : kind === "beetle" ? { w: 36, h: 24 } : { w: 34, h: 26 };
    const minX = c.x + margin;
    const maxX = c.x + c.w - margin - size.w;
    hazards.push({
      type: "walker",
      kind,
      x: rng.range(minX, maxX),
      y: c.top - size.h,
      ...size,
      vx: (rng.chance(0.5) ? 1 : -1) * (50 + c.d * 22),
      minX,
      maxX,
      alive: true,
      shell: false,
      deadT: 0,
      hp: initialHp(kind),
      hitT: 0,
    });
  } else if (rng.chance(0.3 + c.d * 0.1) && c.w > 260) {
    const w = rng.pick([36, 44, 72]);
    const sx = c.x + rng.range(margin + 40, c.w - margin - w - 40);
    hazards.push({ type: "spike", kind: c.spikeKind, x: sx, y: c.top - 22, w, h: 22 });
    starSpots.push({ x: sx + w / 2, y: c.top - 120 });
  }

  if (rng.chance(0.55)) {
    const pw = rng.int(110, 170);
    const px = c.x + rng.range(40, Math.max(41, c.w - pw - 40));
    const py = c.top - rng.int(105, 135);
    solids.push({ x: px, y: py, w: pw, h: 18, oneWay: true });
    starSpots.push({ x: px + pw / 2, y: py - 34 });
  } else {
    starSpots.push({ x: c.x + c.w / 2, y: c.top - 60 });
  }
}

function buildFlightSegment(rng: Rng, opts: SegmentOptions): Segment {
  const d = opts.difficulty;
  const scrollSpeed = 230 + d * 35;
  const length = 3600 + d * 500;
  const hazards: Hazard[] = [];
  const starSpots: { x: number; y: number }[] = [];
  const kinds = FLYERS_BY_THEME[opts.theme];
  const top = 50;
  const bottom = VIEW_H - 90;
  const safeGap = 190 - d * 15;

  let x = 900;
  while (x < length - 600) {
    const gapCenter = rng.range(top + safeGap / 2, bottom - safeGap / 2);
    const sides = rng.chance(0.25 + d * 0.15) ? [true, false] : [gapCenter > (top + bottom) / 2];
    for (const above of sides) {
      const kind = rng.pick(kinds);
      const r = kind === "asteroid" ? rng.int(24, 40) : kind === "storm" ? 34 : 20;
      const moving = kind !== "storm" && rng.chance(0.3 + d * 0.15);
      const amp = moving ? rng.range(15, 30 + d * 10) : 0;
      // Keep the bobbing range out of the safe gap.
      const reach = r + amp;
      const edge = above ? gapCenter - safeGap / 2 - reach : gapCenter + safeGap / 2 + reach;
      if (above ? edge < top + r : edge > bottom - r) continue;
      const baseY = above ? rng.range(top + r, edge) : rng.range(edge, bottom - r);
      hazards.push({
        type: "flyer",
        kind,
        x: x + rng.range(-30, 30),
        baseY,
        y: baseY,
        r,
        amp,
        freq: rng.range(1.2, 2.4),
        phase: rng.range(0, Math.PI * 2),
        vx: kind === "bird" || kind === "ptero" || kind === "bat" ? -rng.range(20, 50 + d * 15) : 0,
        active: true,
        hp: initialHp(kind, r),
        hitT: 0,
      });
    }
    starSpots.push({ x, y: gapCenter });
    x += rng.int(300, 420) - d * 25;
  }

  return {
    mode: "voo",
    theme: opts.theme,
    length,
    solids: [],
    hazards,
    stars: chooseStars(starSpots.length >= STARS_PER_SEGMENT ? starSpots : padSpots(starSpots, length), rng),
    gate: { x: length - 200, y: VIEW_H / 2 - 110, w: 80, h: 220 },
    spawn: { x: 120, y: VIEW_H / 2 - 24 },
    scrollSpeed,
  };
}

function padSpots(spots: { x: number; y: number }[], length: number): { x: number; y: number }[] {
  const padded = [...spots];
  while (padded.length < STARS_PER_SEGMENT) padded.push({ x: 500 + padded.length * ((length - 900) / STARS_PER_SEGMENT), y: VIEW_H / 2 });
  return padded;
}
