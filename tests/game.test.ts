import { describe, expect, it } from "vitest";
import { circleHitsRect, inset, overlaps } from "@/game/core/collision";
import { buildSegment, segmentModeFor } from "@/game/core/level";
import { createBody, GRAVITY, JUMP_VELOCITY, RUN_SPEED, stepFlyer, stepPlatformer, type InputState } from "@/game/core/physics";
import { createRng } from "@/game/core/rng";
import { VIEW_H } from "@/game/core/types";
import { STARS_PER_SEGMENT } from "@/lib/gameRules";
import { THEMES } from "@/lib/types";

const idle: InputState = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, powerPressed: false };

describe("rng", () => {
  it("is deterministic per seed", () => {
    const a = createRng("fase");
    const b = createRng("fase");
    expect([a.next(), a.next(), a.int(1, 6)]).toEqual([b.next(), b.next(), b.int(1, 6)]);
    expect(createRng(1).next()).not.toBe(createRng(2).next());
    const r = createRng(5);
    for (let i = 0; i < 100; i++) {
      const v = r.range(3, 4);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThan(4);
    }
    expect(["x"]).toContain(r.pick(["x"]));
    expect(typeof r.chance(0.5)).toBe("boolean");
  });
});

describe("collision", () => {
  it("detects overlaps, circles and insets", () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    expect(overlaps(box, { x: 9, y: 9, w: 5, h: 5 })).toBe(true);
    expect(overlaps(box, { x: 10, y: 0, w: 5, h: 5 })).toBe(false);
    expect(circleHitsRect(15, 5, 6, box)).toBe(true);
    expect(circleHitsRect(17, 5, 6, box)).toBe(false);
    expect(inset(box, 2)).toEqual({ x: 2, y: 2, w: 6, h: 6 });
    expect(inset(box, 8).w).toBe(0);
  });
});

describe("level generation", () => {
  it("alternates modes in mixed phases", () => {
    expect(segmentModeFor("misto", 0)).toBe("plataforma");
    expect(segmentModeFor("misto", 1)).toBe("voo");
    expect(segmentModeFor("voo", 0)).toBe("voo");
  });

  it("always places the exact number of stars and the same level for the same seed", () => {
    for (const theme of THEMES) {
      for (const mode of ["plataforma", "voo"] as const) {
        for (const difficulty of [1, 2, 3] as const) {
          for (let index = 0; index < 4; index++) {
            const seg = buildSegment({ seed: `t-${theme}`, index, mode, theme, difficulty });
            expect(seg.stars).toHaveLength(STARS_PER_SEGMENT);
            expect(seg.gate.x).toBeLessThan(seg.length);
            const again = buildSegment({ seed: `t-${theme}`, index, mode, theme, difficulty });
            expect(again.hazards.length).toBe(seg.hazards.length);
          }
        }
      }
    }
  });

  it("never makes a gap wider than a full-speed jump can cross", () => {
    const airTime = (2 * JUMP_VELOCITY) / GRAVITY;
    const reach = RUN_SPEED * airTime;
    for (let s = 0; s < 40; s++) {
      const seg = buildSegment({ seed: `gap-${s}`, index: 0, mode: "plataforma", theme: "floresta", difficulty: 3 });
      const ground = seg.solids.filter((x) => !x.oneWay).sort((a, b) => a.x - b.x);
      for (let i = 1; i < ground.length; i++) {
        const gap = ground[i].x - (ground[i - 1].x + ground[i - 1].w);
        expect(gap).toBeLessThan(reach * 0.8);
        const climb = ground[i - 1].y - ground[i].y;
        expect(climb).toBeLessThan((JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY) - 40);
      }
    }
  });

  it("keeps a safe vertical corridor around each flight star", () => {
    for (let s = 0; s < 20; s++) {
      const seg = buildSegment({ seed: `fly-${s}`, index: 1, mode: "voo", theme: "espaco", difficulty: 3 });
      for (const star of seg.stars) {
        for (const h of seg.hazards) {
          if (h.type !== "flyer" || Math.abs(h.x - star.x) > 35) continue;
          const closest = Math.abs(h.baseY - star.y) - h.amp - h.r;
          expect(closest).toBeGreaterThan(40);
        }
      }
    }
  });
});

describe("platformer physics", () => {
  const floor = [{ x: -100, y: 400, w: 2000, h: 200, oneWay: false }];

  it("lands on the floor and jumps with a buffered press", () => {
    const body = createBody(100, 300);
    for (let i = 0; i < 60; i++) stepPlatformer(body, idle, floor, 1 / 60);
    expect(body.onGround).toBe(true);
    expect(body.y + body.h).toBeCloseTo(400);
    const events = stepPlatformer(body, { ...idle, jump: true, jumpPressed: true }, floor, 1 / 60);
    expect(events.jumped).toBe(true);
    expect(body.vy).toBeLessThan(0);
  });

  it("allows a coyote jump right after leaving a ledge", () => {
    const ledge = [{ x: 0, y: 400, w: 100, h: 200, oneWay: false }];
    const body = createBody(70, 352);
    stepPlatformer(body, idle, ledge, 1 / 60);
    expect(body.onGround).toBe(true);
    for (let i = 0; i < 4; i++) stepPlatformer(body, { ...idle, right: true }, ledge, 1 / 60);
    body.x = 110;
    stepPlatformer(body, { ...idle, right: true }, ledge, 1 / 60);
    expect(body.onGround).toBe(false);
    const ev = stepPlatformer(body, { ...idle, jump: true, jumpPressed: true }, ledge, 1 / 60);
    expect(ev.jumped).toBe(true);
  });

  it("passes through one-way platforms from below and stands on them", () => {
    const solids = [...floor, { x: 0, y: 300, w: 300, h: 18, oneWay: true }];
    const body = createBody(100, 352);
    body.onGround = true;
    stepPlatformer(body, { ...idle, jump: true, jumpPressed: true }, solids, 1 / 60);
    let maxRise = body.y;
    for (let i = 0; i < 80; i++) {
      stepPlatformer(body, { ...idle, jump: true }, solids, 1 / 60);
      maxRise = Math.min(maxRise, body.y);
    }
    expect(maxRise).toBeLessThan(300 - body.h);
    expect(body.onGround).toBe(true);
    expect(body.y + body.h).toBeCloseTo(300);
  });

  it("drops through a one-way platform when down is pressed", () => {
    const solids = [...floor, { x: 0, y: 300, w: 300, h: 18, oneWay: true }];
    const body = createBody(100, 252);
    body.onGround = true;
    body.vy = 0;
    stepPlatformer(body, { ...idle, down: true }, solids, 1 / 60);
    expect(body.onGround).toBe(false);
    for (let i = 0; i < 30; i++) stepPlatformer(body, idle, solids, 1 / 60);
    expect(body.y).toBeGreaterThan(300);
    expect(body.y + body.h).toBeCloseTo(400);
  });

  it("is blocked by walls and the left world edge", () => {
    const solids = [...floor, { x: 200, y: 300, w: 50, h: 100, oneWay: false }];
    const body = createBody(150, 352);
    for (let i = 0; i < 60; i++) stepPlatformer(body, { ...idle, right: true }, solids, 1 / 60);
    expect(body.x + body.w).toBeLessThanOrEqual(200);
    for (let i = 0; i < 120; i++) stepPlatformer(body, { ...idle, left: true }, solids, 1 / 60);
    expect(body.x).toBe(0);
  });

  it("keeps the plane inside the view", () => {
    const body = createBody(100, 200);
    for (let i = 0; i < 120; i++) stepFlyer(body, { ...idle, up: true, left: true }, 1 / 60, 50, 960);
    expect(body.y).toBe(30);
    expect(body.x).toBe(90);
    for (let i = 0; i < 200; i++) stepFlyer(body, { ...idle, down: true, right: true }, 1 / 60, 50, 960);
    expect(body.y + body.h).toBeLessThanOrEqual(VIEW_H - 70);
  });
});
