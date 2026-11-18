import { describe, it, expect } from 'vitest';
import { readResults, statusForError } from './useHandTracking';
import { OPEN, PINCH } from '../gestures/fixtures';

describe('reading MediaPipe results', () => {
  it('puts MediaPipe’s "Left" on the person’s right hand, and "Right" on the left', () => {
    const d = readResults({ multiHandLandmarks: [OPEN, PINCH], multiHandedness: [{ label: 'Left', score: 1 }, { label: 'Right', score: 1 }] });
    expect(d.rightHand.isDetected).toBe(true);
    expect(d.rightHand.isPinching).toBe(false);
    expect(d.rightHand.isOpen).toBe(true);
    expect(d.leftHand.isDetected).toBe(true);
    expect(d.leftHand.isPinching).toBe(true);
    expect(d.isInitialized).toBe(true);
  });
  it('reports no hands for an empty frame', () => {
    const d = readResults({});
    expect(d.leftHand.isDetected).toBe(false);
    expect(d.rightHand.isDetected).toBe(false);
  });
});

describe('camera errors', () => {
  it.each([
    ['NotAllowedError', 'denied'], ['SecurityError', 'denied'], ['NotFoundError', 'no-camera'],
    ['OverconstrainedError', 'no-camera'], ['NotReadableError', 'busy'], ['TypeError', 'error'],
  ])('%s → %s', (name, status) => {
    expect(statusForError(Object.assign(new Error('x'), { name }))).toBe(status);
  });
  it('handles a thrown string', () => {
    expect(statusForError('boom')).toBe('error');
  });
});
