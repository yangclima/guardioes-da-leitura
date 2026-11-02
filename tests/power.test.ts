import { describe, expect, it } from "vitest";
import { buildSegment } from "@/game/core/level";
import { addCharges, ASTEROID_IMMUNE_RADIUS, initialHp, maxCharges, POWER_LIFE, POWER_SPEED, powerHitResult } from "@/game/core/power";
import type { Flyer, Spike, Walker } from "@/game/core/types";
import { VIEW_W } from "@/game/core/types";

const walker = (over: Partial<Walker>): Walker => ({
  type: "walker", kind: "slime", x: 0, y: 0, w: 30, h: 20, vx: 50, minX: 0, maxX: 100,
  alive: true, shell: false, deadT: 0, hp: 1, hitT: 0, ...over,
});
const flyer = (over: Partial<Flyer>): Flyer => ({
  type: "flyer", kind: "bird", x: 0, baseY: 0, y: 0, r: 20, amp: 0, freq: 1, phase: 0, vx: 0,
  active: true, hp: 1, hitT: 0, ...over,
});

describe("power balance", () => {
  it("has a short range and few charges, fewer on hard", () => {
    expect(POWER_SPEED * POWER_LIFE).toBeLessThan(VIEW_W / 2.5);
    expect(maxCharges(1)).toBe(3);
    expect(maxCharges(3)).toBeLessThan(maxCharges(1));
  });

  it("caps recharges between zero and the maximum", () => {
    expect(addCharges(2, 1, 3)).toBe(3);
    expect(addCharges(3, 1, 3)).toBe(3);
    expect(addCharges(0, -1, 3)).toBe(0);
  });

  it("gives tougher enemies more hit points and makes storms and big rocks immune", () => {
    expect(initialHp("slime")).toBe(1);
    expect(initialHp("raptor")).toBe(2);
    expect(initialHp("ptero")).toBe(2);
    expect(initialHp("storm")).toBe(0);
    expect(initialHp("asteroid", ASTEROID_IMMUNE_RADIUS)).toBe(0);
    expect(initialHp("asteroid", ASTEROID_IMMUNE_RADIUS - 1)).toBe(1);
  });

  it("resolves what a hit does", () => {
    const spike: Spike = { type: "spike", kind: "ice", x: 0, y: 0, w: 10, h: 10 };
    expect(powerHitResult(spike)).toBe("immune");
    expect(powerHitResult(flyer({ kind: "storm", hp: 0 }))).toBe("immune");
    expect(powerHitResult(walker({ kind: "raptor", hp: 2 }))).toBe("hurt");
    expect(powerHitResult(walker({ kind: "raptor", hp: 1 }))).toBe("defeated");
    expect(powerHitResult(walker({ kind: "turtle" }))).toBe("shell");
    expect(powerHitResult(walker({ kind: "turtle", shell: true }))).toBe("defeated");
    expect(powerHitResult(flyer({}))).toBe("defeated");
  });

  it("builds every hazard with its starting hit points", () => {
    const seg = buildSegment({ seed: "hp", index: 1, mode: "voo", theme: "ceu", difficulty: 2 });
    for (const h of seg.hazards) {
      if (h.type === "flyer") expect(h.hp).toBe(initialHp(h.kind, h.r));
    }
  });
});
