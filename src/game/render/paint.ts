/** Small painting helpers shared by every sprite. */

export const OUTLINE = "#1b1530";
export const LINE = 2.6;

function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Lightens (amount > 0) or darkens a #rrggbb color. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex).map((c) => Math.max(0, Math.min(255, Math.round(c + amount))));
  return `rgb(${r},${g},${b})`;
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function ink(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, line = LINE, stroke = OUTLINE): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = line;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

/** Warm brown line used by the painted hero sprites. */
export const WARM_INK = "#3b2416";

/** Fill + thin warm outline, the painted-miniature look of the heroes. */
export function pen(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, line = 1.9): void {
  ink(ctx, fill, line, WARM_INK);
}

/** Soft airbrushed spot: a light (white) or occlusion (dark) blob that fades out. */
export function softSpot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: readonly [number, number, number], a: number): void {
  const [cr, cg, cb] = rgb;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
  g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export const LIGHT = [255, 246, 220] as const;
export const SHADOW = [70, 35, 15] as const;

/** Vertical light-to-dark gradient, the base of the cel-shaded look. */
export function vGrad(ctx: CanvasRenderingContext2D, y0: number, y1: number, base: string, light = 30, dark = -35): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shade(base, light));
  g.addColorStop(0.55, base);
  g.addColorStop(1, shade(base, dark));
  return g;
}

/** Radial gradient lit from the upper-left, for round bodies. */
export function ballGrad(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, base: string, light = 45, dark = -45): CanvasGradient {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
  g.addColorStop(0, shade(base, light));
  g.addColorStop(0.6, base);
  g.addColorStop(1, shade(base, dark));
  return g;
}

/** A limb segment: a rounded capsule between two joints. */
export function capsule(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, fill: string, line = LINE): void {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.roundRect(-width / 2, -width / 2, len + width, width, width / 2);
  ink(ctx, fill, line);
  ctx.restore();
}

export function gloss(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot = -0.5, a = 0.55): void {
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** Ground contact shadow. */
export function dropShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, strength = 0.2): void {
  ctx.fillStyle = `rgba(20,10,40,${strength})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Cartoon eye with iris, pupil and two catch-lights. */
export function cartoonEye(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, iris: string, lookX = 0.3, lookY = 0.1): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ink(ctx, "#ffffff", 1.6);
  const ix = x + lookX * rx * 0.55;
  const iy = y + lookY * ry * 0.4;
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.ellipse(ix, iy, rx * 0.68, ry * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.ellipse(ix + rx * 0.05, iy, rx * 0.36, ry * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ix - rx * 0.2, iy - ry * 0.32, Math.max(0.9, rx * 0.26), 0, Math.PI * 2);
  ctx.arc(ix + rx * 0.28, iy + ry * 0.28, Math.max(0.5, rx * 0.12), 0, Math.PI * 2);
  ctx.fill();
}

/** Brief bright flash while an enemy takes a hit (call inside save/restore). */
export function hitFlash(ctx: CanvasRenderingContext2D, hitT: number): void {
  if (hitT > 0) ctx.filter = `brightness(${1.6 + hitT * 6})`;
}
