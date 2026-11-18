// Golden values for the gesture rules. They were captured from the original
// code before it was refactored (see the November 2026 changelog), so a change
// here is a change to how the app responds to hands.
import { describe, it, expect } from 'vitest';
import {
  handOpenness, handPosition, wristRotation, isPinching, pinchDistance, rightHandScale,
  pinchCloseness, palmCentre, personHand, PINCH_THRESHOLD,
} from './handMath';
import { OPEN, FIST, PINCH, NEAR_PINCH, TILTED } from './fixtures';

const PI = Math.PI;

describe('openness', () => {
  it('reads a spread hand as a little over half open', () => {
    expect(handOpenness(OPEN)).toBeCloseTo(0.5758068636546114, 10);
  });
  it('reads a fist as closed', () => {
    expect(handOpenness(FIST)).toBe(0);
  });
  it('does not change when the hand turns', () => {
    expect(handOpenness(TILTED)).toBeCloseTo(handOpenness(OPEN), 10);
  });
  it('stays between 0 and 1', () => {
    const huge = OPEN.map((p, i) => (i === 0 ? p : { x: p.x * 9, y: p.y * 9, z: 0 }));
    expect(handOpenness(huge)).toBe(1);
  });
});

describe('pinch', () => {
  it('uses a threshold of 0.05', () => {
    expect(PINCH_THRESHOLD).toBe(0.05);
  });
  it('detects thumb and index 0.03 apart', () => {
    expect(pinchDistance(PINCH)).toBeCloseTo(0.03, 10);
    expect(isPinching(PINCH)).toBe(true);
  });
  it('ignores thumb and index 0.08 apart', () => {
    expect(isPinching(NEAR_PINCH)).toBe(false);
  });
  it('counts a fist as a pinch, because the thumb rests on the index tip', () => {
    expect(isPinching(FIST)).toBe(true);
  });
  it('needs all 21 landmarks', () => {
    expect(isPinching(undefined)).toBe(false);
    expect(isPinching(PINCH.slice(0, 20))).toBe(false);
  });
  it('closeness rises from 0 to 1 as the tips meet', () => {
    expect(pinchCloseness(OPEN)).toBe(0);
    expect(pinchCloseness(NEAR_PINCH)).toBeCloseTo(0.2, 10);
    expect(pinchCloseness(PINCH)).toBeCloseTo(0.7, 10);
  });
});

describe('right-hand scale', () => {
  it('is openness × 6 for an open hand', () => {
    expect(rightHandScale(OPEN)).toBeCloseTo(3.4548411819276685, 10);
    expect(rightHandScale(NEAR_PINCH)).toBeCloseTo(3.06634073166851, 10);
  });
  it('drops to 0.1 + gap / 0.15 × 0.4 while pinching', () => {
    expect(rightHandScale(PINCH)).toBeCloseTo(0.18, 10);
    expect(rightHandScale(FIST)).toBeCloseTo(0.1377123616632825, 10);
  });
});

describe('wrist rotation', () => {
  it('reads an upright palm', () => {
    const r = wristRotation(OPEN);
    expect(r.x).toBeCloseTo(-PI / 2, 10);
    expect(r.y).toBeCloseTo(-PI, 10);
    expect(r.z).toBeCloseTo(-2.910501986393896, 10);
  });
  it('reads a hand turned 90 degrees', () => {
    const r = wristRotation(TILTED);
    expect(r.x).toBeCloseTo(0, 10);
    expect(r.y).toBeCloseTo(-PI / 2, 10);
    expect(r.z).toBeCloseTo(-1.3397056595989993, 10);
  });
});

describe('position', () => {
  it('maps the wrist from the image square to -1..1 with y up', () => {
    const p = handPosition(OPEN);
    expect(p.x).toBe(0);
    expect(p.y).toBeCloseTo(-0.6, 10);
    expect(p.z + 0).toBe(0);
    expect(handPosition([{ x: 0, y: 0, z: 0.1 }, ...OPEN.slice(1)])).toEqual({ x: -1, y: 1, z: -0.2 });
  });
  it('finds the centre of the palm', () => {
    const c = palmCentre(OPEN);
    expect(c.x).toBeCloseTo(0.5028571428571428, 10);
    expect(c.y).toBeCloseTo(0.45285714285714285, 10);
  });
});

describe('handedness', () => {
  it('swaps MediaPipe’s mirrored labels for the person’s own hands', () => {
    expect(personHand('Left')).toBe('right');
    expect(personHand('Right')).toBe('left');
  });
});
