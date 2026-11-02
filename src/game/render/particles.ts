interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  shape: "circle" | "spark";
}

const MAX_PARTICLES = 400;

/** Pooled-ish particle system; mutation is local to the game loop for speed. */
export class Particles {
  private items: Particle[] = [];

  burst(x: number, y: number, count: number, opts: { colors: string[]; speed: number; size: number; life: number; gravity?: number; shape?: "circle" | "spark"; spreadUp?: boolean }): void {
    for (let i = 0; i < count && this.items.length < MAX_PARTICLES; i++) {
      const angle = opts.spreadUp ? -Math.PI * (0.15 + Math.random() * 0.7) : Math.random() * Math.PI * 2;
      const speed = opts.speed * (0.4 + Math.random() * 0.6);
      this.items.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: opts.life,
        maxLife: opts.life,
        size: opts.size * (0.6 + Math.random() * 0.6),
        color: opts.colors[i % opts.colors.length],
        gravity: opts.gravity ?? 0,
        shape: opts.shape ?? "circle",
      });
    }
  }

  update(dt: number): void {
    for (const p of this.items) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.items = this.items.filter((p) => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.items) {
      const k = p.life / p.maxLife;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = p.color;
      if (p.shape === "spark") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(k * 6);
        const s = p.size * k;
        ctx.fillRect(-s / 2, -s * 1.5, s, s * 3);
        ctx.fillRect(-s * 1.5, -s / 2, s * 3, s);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.items = [];
  }
}
