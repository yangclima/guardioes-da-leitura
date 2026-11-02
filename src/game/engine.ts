import type { Mode, Theme } from "@/lib/types";
import { AudioEngine } from "./audio";
import { circleHitsRect, inset, overlaps } from "./core/collision";
import { buildSegment } from "./core/level";
import { addCharges, CHARGE_PER_RIGHT_ANSWER, CHARGE_PER_STAR, HIT_FLASH, maxCharges, POWER_COOLDOWN, POWER_LIFE, POWER_SPEED, powerHitResult } from "./core/power";
import { createBody, stepFlyer, stepPlatformer, type Body, type InputState } from "./core/physics";
import type { Flyer, PowerShot, Segment, Spike, Walker } from "./core/types";
import { VIEW_H, VIEW_W } from "./core/types";
import { Input } from "./input";
import { drawBackground, drawFlightFloor, drawSolids } from "./render/backgrounds";
import { drawHero, drawHeroPlane, type Pose } from "./render/drawHero";
import { drawFlyer, drawGate, drawPower, drawSpike, drawStar, drawWalker } from "./render/drawSprites";
import type { Hero } from "./render/heroes";
import { Particles } from "./render/particles";

const STEP = 1 / 60;
const MAX_STEPS = 5;
const INVULN_TIME = 1.5;
const HURT_TIME = 0.45;
const STOMP_BOUNCE = 560;
const DYING_TIME = 1.3;
const TRANSITION_TIME = 0.7;
const BANNER_TIME = 2.2;
const PLANE_W = 50;
const PLANE_H = 26;
const STAR_RADIUS = 16;
const CAST_POSE_TIME = 0.22;
const GLYPHS = "ABCDEFGHIJLMNOPRSTUVZ";

export interface HudState {
  hearts: number;
  maxHearts: number;
  stars: number;
  segment: number;
  total: number;
  flight: boolean;
  energy: number;
  maxEnergy: number;
}

export interface EngineOptions {
  seed: string;
  theme: Theme;
  mode: Mode;
  difficulty: 1 | 2 | 3;
  hearts: number;
  totalSegments: number;
  hero: Hero;
}

export interface EngineCallbacks {
  onHud(hud: HudState): void;
  /** Player reached the gate of a segment: show the question. */
  onGate(segmentIndex: number): void;
  onEnd(result: { completed: boolean; stars: number; heartsLeft: number }): void;
  onPauseRequest?(): void;
}

type Phase = "playing" | "paused" | "gate" | "dying" | "transition" | "ended";

export class GameEngine {
  readonly input = new Input();
  readonly audio = new AudioEngine();
  private ctx: CanvasRenderingContext2D;
  private particles = new Particles();
  private segment!: Segment;
  private segIndex = 0;
  private body!: Body;
  private camX = 0;
  private phase: Phase = "playing";
  private pausedFrom: Phase = "playing";
  private hearts: number;
  private stars = 0;
  private time = 0;
  private invuln = 0;
  private hurtT = 0;
  private squash = 0;
  private phaseT = 0;
  private bannerT = 0;
  private lastSafe = { x: 0, y: 0 };
  private debug = false;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private lastHud = "";
  private resizeObserver: ResizeObserver | null = null;
  private powers: PowerShot[] = [];
  private powerCooldown = 0;
  private energy: number;
  private readonly maxEnergy: number;
  private castT = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly opts: EngineOptions,
    private readonly cb: EngineCallbacks,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D não suportado neste navegador.");
    this.ctx = ctx;
    this.hearts = opts.hearts;
    this.maxEnergy = maxCharges(opts.difficulty);
    this.energy = this.maxEnergy;
    this.input.onToggleDebug = () => (this.debug = !this.debug);
    this.input.onPause = () => this.cb.onPauseRequest?.();
    this.loadSegment(0);
  }

  start(): void {
    this.input.attach();
    this.fitCanvas();
    this.resizeObserver = new ResizeObserver(() => this.fitCanvas());
    if (this.canvas.parentElement) this.resizeObserver.observe(this.canvas.parentElement);
    this.audio.playMusic(this.opts.theme);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.input.detach();
    this.resizeObserver?.disconnect();
    this.audio.dispose();
  }

  setPaused(paused: boolean): void {
    if (paused && this.phase !== "paused" && this.phase !== "ended") {
      this.pausedFrom = this.phase;
      this.phase = "paused";
      this.audio.stopMusic();
    } else if (!paused && this.phase === "paused") {
      this.phase = this.pausedFrom;
      this.input.reset();
      this.audio.playMusic(this.opts.theme);
    }
  }

  /** Called after the player answers the gate question. */
  resolveGate(correct: boolean): void {
    if (this.phase !== "gate") return;
    this.input.reset();
    if (correct) {
      this.audio.sfx("correct");
      this.energy = addCharges(this.energy, CHARGE_PER_RIGHT_ANSWER, this.maxEnergy);
      this.particles.burst(this.body.x + this.body.w / 2, this.body.y, 40, { colors: ["#fde047", "#a78bfa", "#fff"], speed: 380, size: 5, life: 1, gravity: 500, shape: "spark" });
    } else {
      this.audio.sfx("wrong");
      this.hearts = Math.max(0, this.hearts - 1);
      if (this.hearts === 0) {
        this.end(false);
        return;
      }
    }
    this.emitHud();
    if (this.segIndex + 1 >= this.opts.totalSegments) {
      this.end(true);
      return;
    }
    this.phase = "transition";
    this.phaseT = 0;
  }

  private loadSegment(index: number): void {
    this.segIndex = index;
    this.segment = buildSegment({ seed: this.opts.seed, index, mode: this.opts.mode, theme: this.opts.theme, difficulty: this.opts.difficulty });
    const flight = this.segment.mode === "voo";
    this.body = createBody(this.segment.spawn.x, this.segment.spawn.y);
    if (flight) {
      this.body.w = PLANE_W;
      this.body.h = PLANE_H;
    }
    this.lastSafe = { ...this.segment.spawn };
    this.camX = 0;
    this.invuln = 1;
    this.bannerT = BANNER_TIME;
    this.particles.clear();
    this.powers = [];
    this.powerCooldown = 0;
    this.emitHud();
  }

  private end(completed: boolean): void {
    this.phase = "ended";
    this.audio.stopMusic();
    this.audio.sfx(completed ? "win" : "lose");
    this.cb.onEnd({ completed, stars: this.stars, heartsLeft: this.hearts });
  }

  private emitHud(): void {
    const hud: HudState = {
      hearts: this.hearts,
      maxHearts: this.opts.hearts,
      stars: this.stars,
      segment: this.segIndex + 1,
      total: this.opts.totalSegments,
      flight: this.segment.mode === "voo",
      energy: this.energy,
      maxEnergy: this.maxEnergy,
    };
    const key = JSON.stringify(hud);
    if (key !== this.lastHud) {
      this.lastHud = key;
      this.cb.onHud(hud);
    }
  }

  private fitCanvas(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = parent.clientWidth;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(((width * VIEW_H) / VIEW_W) * dpr);
  }

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    this.acc += Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.update(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    this.render();
  };

  private update(dt: number): void {
    if (this.phase === "paused" || this.phase === "ended") return;
    this.time += dt;
    this.particles.update(dt);
    this.bannerT = Math.max(0, this.bannerT - dt);
    this.squash = Math.max(0, this.squash - dt * 5);
    this.updateHazardMotion(dt);

    if (this.phase === "gate") return;
    if (this.phase === "dying") {
      this.phaseT += dt;
      this.body.vy += 1600 * dt;
      this.body.y += this.body.vy * dt;
      if (this.phaseT >= DYING_TIME) this.end(false);
      return;
    }
    if (this.phase === "transition") {
      this.phaseT += dt;
      if (this.phaseT >= TRANSITION_TIME / 2 && this.segIndex < this.opts.totalSegments - 1 && this.phaseT - dt < TRANSITION_TIME / 2) {
        this.loadSegment(this.segIndex + 1);
      }
      if (this.phaseT >= TRANSITION_TIME) this.phase = "playing";
      return;
    }

    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.powerCooldown = Math.max(0, this.powerCooldown - dt);
    this.castT = Math.max(0, this.castT - dt);
    const input = this.input.read();
    if (input.powerPressed && this.powerCooldown === 0 && this.hurtT === 0) this.launchPower();
    if (this.segment.mode === "voo") this.updateFlight(input, dt);
    else this.updatePlatform(input, dt);
    this.updatePowers(dt);
    this.collectStars();
    if (this.phase === "playing" && overlaps(this.body, inset(this.segment.gate, 10, 0))) {
      this.phase = "gate";
      this.body.vx = 0;
      this.audio.sfx("gate");
      this.cb.onGate(this.segIndex);
    }
  }

  private updatePlatform(input: InputState, dt: number): void {
    const b = this.body;
    const prevBottom = b.y + b.h;
    const events = stepPlatformer(b, this.hurtT > 0 ? { ...input, left: false, right: false, jumpPressed: false } : input, this.segment.solids, dt);
    const feetX = b.x + b.w / 2;
    if (events.jumped) {
      this.audio.sfx("jump");
      this.dust(feetX, b.y + b.h, 6);
    }
    if (events.landed && events.landingSpeed > 300) {
      this.squash = Math.min(1, events.landingSpeed / 1100);
      this.dust(feetX, b.y + b.h, 8);
    }
    if (b.onGround) this.lastSafe = { x: b.x, y: b.y };

    for (const h of this.segment.hazards) {
      if (h.type === "walker") this.collideWalker(h, prevBottom);
      else if (h.type === "spike") this.collideSpike(h);
    }

    if (b.y > VIEW_H + 60) {
      this.damage();
      if (this.phase === "playing") {
        b.x = this.lastSafe.x;
        b.y = this.lastSafe.y - 4;
        b.vx = 0;
        b.vy = 0;
      }
    }

    const look = b.facing * 60;
    const target = b.x - VIEW_W * 0.38 + look;
    this.camX += (target - this.camX) * Math.min(1, dt * 5);
    this.camX = Math.max(0, Math.min(this.segment.length - VIEW_W + 120, this.camX));
  }

  private updateFlight(input: InputState, dt: number): void {
    const maxCam = this.segment.length - VIEW_W;
    const scroll = this.camX < maxCam ? this.segment.scrollSpeed * dt : 0;
    this.camX = Math.min(maxCam, this.camX + scroll);
    this.body.x += scroll;
    stepFlyer(this.body, this.hurtT > 0 ? { ...input, up: false, down: false, jump: false } : input, dt, this.camX, VIEW_W * 1.2);
    const hitbox = inset(this.body, 6, 4);
    for (const h of this.segment.hazards) {
      if (h.type !== "flyer") continue;
      if (!h.active) continue;
      if (h.x < this.camX - 100 || h.x > this.camX + VIEW_W + 100) continue;
      if (circleHitsRect(h.x, h.y, h.r * 0.82, hitbox)) this.damage(h.x < this.body.x ? 1 : -1);
    }
  }

  private launchPower(): void {
    if (this.energy <= 0) {
      this.powerCooldown = 0.3;
      this.audio.sfx("empty");
      return;
    }
    const b = this.body;
    const direction = this.segment.mode === "voo" ? 1 : b.facing;
    this.energy--;
    this.powers.push({
      x: b.x + (direction > 0 ? b.w : -22),
      y: b.y + b.h * (this.segment.mode === "voo" ? 0.35 : 0.3),
      w: 22,
      h: 18,
      vx: direction * POWER_SPEED + b.vx * 0.3,
      life: POWER_LIFE,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    });
    this.powerCooldown = POWER_COOLDOWN;
    this.castT = CAST_POSE_TIME;
    this.audio.sfx("power");
    this.emitHud();
    this.particles.burst(b.x + b.w / 2 + direction * 22, b.y + b.h * 0.35, 8, {
      colors: ["#fde047", "#a78bfa", "#fff"],
      speed: 140,
      size: 4,
      life: 0.3,
      shape: "spark",
    });
  }

  private updatePowers(dt: number): void {
    for (const power of this.powers) {
      power.x += power.vx * dt;
      power.life -= dt;
      if (power.life <= 0) {
        this.fizzle(power.x + power.w / 2, power.y + power.h / 2, false);
        continue;
      }
      if (this.segment.solids.some((s) => !s.oneWay && overlaps(power, s))) {
        power.life = 0;
        this.fizzle(power.x + power.w / 2, power.y + power.h / 2, true);
        continue;
      }
      for (const h of this.segment.hazards) {
        const hit =
          h.type === "flyer"
            ? h.active && circleHitsRect(h.x, h.y, h.r, power)
            : h.type === "walker"
              ? h.alive && overlaps(power, inset(h, 2, 1))
              : overlaps(power, h);
        if (!hit) continue;
        power.life = 0;
        this.applyPowerHit(h, power);
        break;
      }
    }
    this.powers = this.powers.filter((power) => power.life > 0);
  }

  private applyPowerHit(h: Walker | Spike | Flyer, power: PowerShot): void {
    const cx = power.x + power.w / 2;
    const cy = power.y + power.h / 2;
    const result = powerHitResult(h);
    if (result === "immune") {
      this.audio.sfx("tink");
      this.particles.burst(cx, cy, 8, { colors: ["#e5e7eb", "#94a3b8"], speed: 160, size: 3, life: 0.3, shape: "spark" });
      return;
    }
    if (h.type === "spike") return;
    const sparks = { colors: ["#fde047", "#c4b5fd", "#fff"], speed: 240, size: 5, life: 0.45, shape: "spark" as const };
    if (result === "shell" && h.type === "walker") {
      h.shell = true;
      h.h = 22;
      h.y += 8;
      h.vx = 0;
      h.hitT = HIT_FLASH;
      this.audio.sfx("stomp");
      this.particles.burst(cx, cy, 10, sparks);
      return;
    }
    if (result === "hurt") {
      h.hp--;
      h.hitT = HIT_FLASH;
      if (h.type === "walker") h.x = Math.max(h.minX, Math.min(h.maxX, h.x + Math.sign(power.vx) * 14));
      else h.x += Math.sign(power.vx) * 12;
      this.audio.sfx("stomp");
      this.particles.burst(cx, cy, 8, sparks);
      return;
    }
    if (h.type === "walker") {
      h.alive = false;
      h.deadT = 0;
    } else {
      h.active = false;
    }
    this.audio.sfx("defeat");
    this.particles.burst(cx, cy, 16, sparks);
  }

  private fizzle(x: number, y: number, hard: boolean): void {
    this.particles.burst(x, y, hard ? 8 : 5, { colors: ["#ddd6fe", "#fff"], speed: hard ? 150 : 70, size: 3, life: 0.25 });
  }

  private updateHazardMotion(dt: number): void {
    for (const h of this.segment.hazards) {
      if (h.type !== "spike") h.hitT = Math.max(0, h.hitT - dt);
      if (h.type === "walker") {
        if (!h.alive) {
          h.deadT += dt;
          continue;
        }
        if (h.kind === "turtle" && h.shell && h.vx === 0) continue;
        h.x += h.vx * dt;
        if (h.x < h.minX || h.x > h.maxX) {
          h.x = Math.max(h.minX, Math.min(h.maxX, h.x));
          h.vx = -h.vx;
        }
      } else if (h.type === "flyer") {
        if (!h.active) continue;
        h.y = h.baseY + Math.sin(this.time * h.freq + h.phase) * h.amp;
        if (h.x < this.camX + VIEW_W + 60) h.x += h.vx * dt;
      }
    }
  }

  private collideWalker(w: Walker, prevBottom: number): void {
    if (!w.alive) return;
    const b = this.body;
    if (!overlaps(inset(b, 2, 0), inset(w, 3, 2))) return;
    const stomp = b.vy > 0 && prevBottom <= w.y + 10;
    if (stomp) {
      if (w.kind === "turtle" && !w.shell) {
        w.shell = true;
        w.h = 22;
        w.y += 8;
        w.vx = 0;
        this.audio.sfx("stomp");
      } else {
        w.alive = false;
        this.audio.sfx("stomp");
      }
      b.vy = -STOMP_BOUNCE;
      this.particles.burst(w.x + w.w / 2, w.y + w.h / 2, 14, { colors: ["#ffffff", "#e5e7eb"], speed: 220, size: 6, life: 0.5 });
    } else {
      if (w.kind === "turtle" && w.shell && w.vx === 0) {
        w.vx = b.x + b.w / 2 < w.x + w.w / 2 ? 420 : -420;
        this.audio.sfx("stomp");
      } else {
        this.damage(b.x + b.w / 2 < w.x + w.w / 2 ? -1 : 1);
      }
    }
  }

  private collideSpike(s: Spike): void {
    if (overlaps(inset(this.body, 3, 0), { x: s.x + 4, y: s.y + 6, w: s.w - 8, h: s.h - 6 })) {
      this.damage(this.body.vx >= 0 ? -1 : 1);
    }
  }

  private damage(knockDir = -1): void {
    if (this.invuln > 0 || this.phase !== "playing") return;
    this.hearts = Math.max(0, this.hearts - 1);
    this.invuln = INVULN_TIME;
    this.hurtT = HURT_TIME;
    this.audio.sfx("hurt");
    const b = this.body;
    this.particles.burst(b.x + b.w / 2, b.y + b.h / 2, 16, { colors: ["#f87171", "#fecaca", "#fff"], speed: 260, size: 5, life: 0.6, shape: "spark" });
    if (this.segment.mode === "plataforma") {
      b.vx = knockDir * 260;
      b.vy = -480;
      b.onGround = false;
    } else {
      b.vx = knockDir * 200;
    }
    this.emitHud();
    if (this.hearts === 0) {
      this.phase = "dying";
      this.phaseT = 0;
      b.vy = -700;
    }
  }

  private collectStars(): void {
    for (const s of this.segment.stars) {
      if (s.taken) continue;
      if (circleHitsRect(s.x, s.y, STAR_RADIUS, this.body)) {
        s.taken = true;
        this.stars++;
        this.energy = addCharges(this.energy, CHARGE_PER_STAR, this.maxEnergy);
        this.audio.sfx("star");
        this.particles.burst(s.x, s.y, 12, { colors: ["#fde047", "#fff7ae", "#f59e0b"], speed: 200, size: 4, life: 0.6, shape: "spark" });
        this.emitHud();
      }
    }
  }

  private dust(x: number, y: number, count: number): void {
    this.particles.burst(x, y, count, { colors: ["rgba(255,255,255,0.8)", "rgba(220,220,220,0.7)"], speed: 120, size: 5, life: 0.4, spreadUp: true });
  }

  private pose(): Pose {
    const b = this.body;
    let state: Pose["state"] = "idle";
    if (this.hurtT > 0 || this.phase === "dying") state = "hurt";
    else if (!b.onGround) state = b.vy < 0 ? "jump" : "fall";
    else if (Math.abs(b.vx) > 25) state = "run";
    return { state, t: this.time, facing: b.facing, squash: this.squash, cast: this.castT / CAST_POSE_TIME };
  }

  private render(): void {
    const ctx = this.ctx;
    const scale = this.canvas.width / VIEW_W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const seg = this.segment;
    const flight = seg.mode === "voo";
    const camX = Math.round(this.camX * 10) / 10;

    drawBackground(ctx, seg.theme, camX, this.time);
    if (flight) drawFlightFloor(ctx, seg.theme, camX);

    ctx.save();
    ctx.translate(-camX, 0);
    drawSolids(ctx, seg.theme, seg.solids, camX);
    drawGate(ctx, seg.gate, this.time, flight);
    seg.stars.forEach((s, i) => {
      if (!s.taken && s.x > camX - 40 && s.x < camX + VIEW_W + 40) drawStar(ctx, s.x, s.y, this.time, i);
    });
    for (const h of seg.hazards) this.drawHazard(h, camX);
    for (const power of this.powers) {
      if (power.x > camX - 40 && power.x < camX + VIEW_W + 40) drawPower(ctx, power, this.time);
    }
    this.drawPlayer();
    this.particles.draw(ctx);
    if (this.debug) this.drawDebug();
    ctx.restore();

    this.drawOverlays();
  }

  private drawHazard(h: Walker | Spike | Flyer, camX: number): void {
    const x = h.x;
    if (x < camX - 120 || x > camX + VIEW_W + 120) return;
    if (h.type === "walker") {
      if (h.alive || h.deadT < 0.4) drawWalker(this.ctx, h, this.time, this.segment.theme);
    } else if (h.type === "spike") {
      drawSpike(this.ctx, h);
    } else {
      if (!h.active) return;
      drawFlyer(this.ctx, h, this.time);
    }
  }

  private drawPlayer(): void {
    const b = this.body;
    const blink = this.invuln > 0 && this.phase === "playing" && Math.floor(this.time * 14) % 2 === 0;
    if (blink) return;
    if (this.segment.mode === "voo") {
      const tilt = Math.max(-0.35, Math.min(0.35, b.vy / 900));
      drawHeroPlane(this.ctx, this.opts.hero, b.x + b.w / 2, b.y + b.h / 2, this.time, tilt, this.hurtT > 0, this.castT / CAST_POSE_TIME);
    } else {
      drawHero(this.ctx, this.opts.hero, b.x + b.w / 2, b.y + b.h, this.pose());
    }
  }

  private drawDebug(): void {
    const ctx = this.ctx;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#22d3ee";
    const hb = this.segment.mode === "voo" ? inset(this.body, 6, 4) : this.body;
    ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
    ctx.strokeStyle = "#f43f5e";
    for (const h of this.segment.hazards) {
      if (h.type === "flyer") {
        if (!h.active) continue;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r * 0.82, 0, Math.PI * 2);
        ctx.stroke();
      } else if (h.type === "walker") {
        if (!h.alive) continue;
        const r = inset(h, 3, 2);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
      } else {
        ctx.strokeRect(h.x + 4, h.y + 6, h.w - 8, h.h - 6);
      }
    }
    ctx.strokeStyle = "#facc15";
    for (const s of this.segment.stars) {
      if (s.taken) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, STAR_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    }
    const g = inset(this.segment.gate, 10, 0);
    ctx.strokeStyle = "#a3e635";
    ctx.strokeRect(g.x, g.y, g.w, g.h);
  }

  private drawOverlays(): void {
    const ctx = this.ctx;
    if (this.bannerT > 0) {
      const k = this.bannerT / BANNER_TIME;
      const alpha = Math.min(1, k * 3, (1 - k) * 6);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.font = "900 44px system-ui, sans-serif";
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#1b1530";
      const title = `Desafio ${this.segIndex + 1} de ${this.opts.totalSegments}`;
      ctx.strokeText(title, VIEW_W / 2, 150);
      ctx.fillStyle = "#fde047";
      ctx.fillText(title, VIEW_W / 2, 150);
      ctx.font = "700 22px system-ui, sans-serif";
      ctx.lineWidth = 5;
      const hint = this.segment.mode === "voo" ? "Voe até o portal desviando dos obstáculos!" : "Corra e pule até o portal da pergunta!";
      ctx.strokeText(hint, VIEW_W / 2, 188);
      ctx.fillStyle = "#fff";
      ctx.fillText(hint, VIEW_W / 2, 188);
      ctx.restore();
    }
    if (this.phase === "transition") {
      const k = this.phaseT / TRANSITION_TIME;
      ctx.fillStyle = `rgba(15,10,40,${1 - Math.abs(k * 2 - 1)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (this.debug) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(8, VIEW_H - 30, 250, 22);
      ctx.fillStyle = "#fff";
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("hitboxes visíveis (tecla H)", 14, VIEW_H - 15);
    }
  }
}
