// Synthetic 21-point hands for the tests, in MediaPipe's normalised image
// coordinates (x right, y down, z towards the camera is negative).
import type { Landmark } from './handMath';

type Pt = [number, number, number?];
const hand = (pts: Pt[]): Landmark[] => pts.map(([x, y, z = 0]) => ({ x, y, z }));

/** Fingers spread wide, palm to the camera, wrist at the bottom centre. */
export const OPEN = hand([
  [0.5, 0.8],
  [0.42, 0.74], [0.36, 0.66], [0.31, 0.59], [0.27, 0.53],
  [0.44, 0.58], [0.42, 0.47], [0.41, 0.4], [0.4, 0.34],
  [0.5, 0.56], [0.5, 0.44], [0.5, 0.36], [0.5, 0.3],
  [0.56, 0.58], [0.58, 0.47], [0.59, 0.4], [0.6, 0.35],
  [0.61, 0.62], [0.65, 0.54], [0.68, 0.49], [0.7, 0.45],
]);

/** A loose fist: every tip folded back near the palm. */
export const FIST = hand([
  [0.5, 0.8],
  [0.44, 0.75], [0.41, 0.7], [0.43, 0.66], [0.46, 0.65],
  [0.45, 0.62], [0.45, 0.58], [0.46, 0.63], [0.47, 0.66],
  [0.5, 0.61], [0.5, 0.57], [0.5, 0.62], [0.5, 0.66],
  [0.55, 0.62], [0.55, 0.58], [0.54, 0.63], [0.53, 0.66],
  [0.59, 0.64], [0.59, 0.61], [0.58, 0.65], [0.57, 0.67],
]);

/** The open hand with thumb and index tips 0.03 apart: a pinch. */
export const PINCH = OPEN.map((p, i) => (i === 8 ? { x: 0.3, y: 0.53, z: 0 } : i === 4 ? { x: 0.27, y: 0.53, z: 0 } : p));

/** The open hand with thumb and index tips 0.08 apart: close, but not a pinch. */
export const NEAR_PINCH = OPEN.map((p, i) => (i === 8 ? { x: 0.35, y: 0.53, z: 0 } : p));

/** The open hand turned 90 degrees about the wrist, fingers pointing to the right of the picture. */
export const TILTED = OPEN.map(({ x, y, z }) => ({ x: 0.5 + (0.8 - y), y: 0.8 + (x - 0.5), z }));
