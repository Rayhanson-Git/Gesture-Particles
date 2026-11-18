// Helpers for morphing between templates. Pure, so they are unit-tested.

/** How long a morph from one template to the next takes, in seconds. */
export const MORPH_SECONDS = 1.4;

/** Slow at both ends, quick in the middle. */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Writes the blend of `from` and `to` at `t` (0..1) into `out`. All three are x, y, z arrays of the same length. */
export function mixInto(out: Float32Array, from: Float32Array, to: Float32Array, t: number): Float32Array {
  for (let i = 0; i < out.length; i++) out[i] = from[i] + (to[i] - from[i]) * t;
  return out;
}

/** The largest |y| in a set of positions: the half-height used for gradients. */
export function halfHeight(positions: Float32Array): number {
  let m = 0;
  for (let i = 1; i < positions.length; i += 3) m = Math.max(m, Math.abs(positions[i]));
  return m || 1;
}
