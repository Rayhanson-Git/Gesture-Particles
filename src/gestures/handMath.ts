// Pure hand-gesture maths. No DOM, no React, no MediaPipe: every function takes
// MediaPipe's 21 normalised hand landmarks and returns plain numbers, so the
// rules that drive the particles can be unit-tested with synthetic hands.
//
// Landmark indices (MediaPipe Hands): 0 wrist; 1-4 thumb; 5-8 index;
// 9-12 middle; 13-16 ring; 17-20 pinky. 4, 8, 12, 16 and 20 are the tips.

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const WRIST = 0;
export const THUMB_TIP = 4;
export const INDEX_MCP = 5;
export const INDEX_TIP = 8;
export const MIDDLE_MCP = 9;
export const MIDDLE_TIP = 12;
export const RING_TIP = 16;
export const PINKY_MCP = 17;
export const PINKY_TIP = 20;

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

/** Thumb tip to index tip, in 3D normalised units, below which a hand counts as pinching. */
export const PINCH_THRESHOLD = 0.05;
/** Openness above which a hand counts as open. */
export const OPEN_THRESHOLD = 0.5;
/** Largest particle scale the right hand can ask for. */
export const MAX_SCALE = 8;

const dist3 = (a: Landmark, b: Landmark) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);

/**
 * How open the hand is, 0 (fist) to 1 (spread): the summed distance from the
 * wrist to all five fingertips, divided by 2.5, minus 0.3, clamped.
 */
export function handOpenness(landmarks: Landmark[]): number {
  const wrist = landmarks[WRIST];
  let total = 0;
  for (const tip of [INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP, THUMB_TIP]) {
    total += dist3(landmarks[tip], wrist);
  }
  return Math.min(1, Math.max(0, total / 2.5 - 0.3));
}

/** The wrist, mapped from the 0-1 image square to the scene's -1..1 range (y up). */
export function handPosition(landmarks: Landmark[]): Vec3 {
  const wrist = landmarks[WRIST];
  return {
    x: (wrist.x - 0.5) * 2,
    y: -(wrist.y - 0.5) * 2,
    z: wrist.z * -2,
  };
}

/**
 * Wrist orientation, in radians: z from the line across the knuckles (index to
 * pinky), x and y from the line from the wrist to the middle knuckle.
 */
export function wristRotation(landmarks: Landmark[]): Vec3 {
  const wrist = landmarks[WRIST];
  const indexMCP = landmarks[INDEX_MCP];
  const pinkyMCP = landmarks[PINKY_MCP];
  const middle = landmarks[MIDDLE_MCP];

  const across = { x: indexMCP.x - pinkyMCP.x, y: indexMCP.y - pinkyMCP.y };
  const fwd = { x: middle.x - wrist.x, y: middle.y - wrist.y, z: middle.z - wrist.z };

  return {
    x: Math.atan2(fwd.y, Math.sqrt(fwd.x * fwd.x + fwd.z * fwd.z)),
    y: Math.atan2(-fwd.x, -fwd.z),
    z: Math.atan2(across.y, across.x),
  };
}

/** Thumb tip to index tip, in 3D normalised units. */
export function pinchDistance(landmarks: Landmark[]): number {
  return dist3(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
}

export function isPinching(landmarks: Landmark[] | undefined): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  return pinchDistance(landmarks) < PINCH_THRESHOLD;
}

/**
 * The particle scale the right hand asks for. While pinching, the gap between
 * thumb and index sets a small scale (0.1 to 0.5); otherwise openness sets it
 * (0 to 6). The particle system clamps the result to 0..MAX_SCALE.
 */
export function rightHandScale(landmarks: Landmark[]): number {
  if (isPinching(landmarks)) {
    const normalized = Math.min(1, pinchDistance(landmarks) / 0.15);
    return 0.1 + normalized * 0.4;
  }
  return handOpenness(landmarks) * 6;
}

/** 0 when thumb and index are 0.1 apart or more, rising to 1 as they touch. */
export function pinchCloseness(landmarks: Landmark[]): number {
  return Math.max(0, 1 - pinchDistance(landmarks) * 10);
}

/** Centre of the palm: the mean of the five tips and the index and pinky knuckles. */
export function palmCentre(landmarks: Landmark[]): Vec3 {
  const pts = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP, INDEX_MCP, PINKY_MCP].map((i) => landmarks[i]);
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / 7,
    y: pts.reduce((s, p) => s + p.y, 0) / 7,
    z: pts.reduce((s, p) => s + p.z, 0) / 7,
  };
}

/**
 * MediaPipe Hands labels each hand as if the picture were mirrored. The camera
 * feed here is not mirrored, so its "Left" is the person's right hand. This is
 * the one place that mapping lives.
 */
export function personHand(mediapipeLabel: string): 'left' | 'right' {
  return mediapipeLabel === 'Left' ? 'right' : 'left';
}
