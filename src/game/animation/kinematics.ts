/** Small, engine-independent skeleton primitives. Angles are in radians. */
export interface Vec {
  x: number;
  y: number;
}
export const vec = (x: number, y: number): Vec => ({ x, y });
export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
export const mix = (a: Vec, b: Vec, t: number): Vec =>
  vec(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
export function rotate(p: Vec, angle: number): Vec {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return vec(p.x * c - p.y * s, p.x * s + p.y * c);
}
export function offset(p: Vec, x: number, y: number): Vec {
  return vec(p.x + x, p.y + y);
}
export interface Chain {
  root: Vec;
  joint: Vec;
  end: Vec;
}
/** Analytic two-bone IK. Clamp unreachable targets; never stretch either bone. */
export function solveIK(
  root: Vec,
  target: Vec,
  upper: number,
  lower: number,
  bend = 1,
): Chain {
  const dx = target.x - root.x,
    dy = target.y - root.y;
  const distance = clamp(
    Math.hypot(dx, dy),
    Math.abs(upper - lower) + 0.001,
    upper + lower - 0.001,
  );
  const angle = Math.atan2(dy, dx),
    a = Math.acos(
      clamp(
        (upper * upper + distance * distance - lower * lower) /
          (2 * upper * distance),
        -1,
        1,
      ),
    );
  return {
    root,
    joint: vec(
      root.x + Math.cos(angle + a * bend) * upper,
      root.y + Math.sin(angle + a * bend) * upper,
    ),
    end: vec(
      root.x + Math.cos(angle) * distance,
      root.y + Math.sin(angle) * distance,
    ),
  };
}
export interface Spring {
  value: number;
  velocity: number;
}
/** Exact critically damped response: stable and consistent at different frame rates. */
export function spring(
  s: Spring,
  target: number,
  frequency: number,
  dt: number,
) {
  const x = s.value - target,
    v = s.velocity,
    j = v + frequency * x,
    decay = Math.exp(-frequency * dt);
  s.value = target + (x + j * dt) * decay;
  s.velocity = (v - frequency * j * dt) * decay;
}
export function samplePath(
  keys: readonly (readonly [number, number, number])[],
  t: number,
): Vec {
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1],
        b = keys[i],
        u = smooth((t - a[0]) / (b[0] - a[0]));
      return vec(lerp(a[1], b[1], u), lerp(a[2], b[2], u));
    }
  }
  const last = keys[keys.length - 1];
  return vec(last[1], last[2]);
}
