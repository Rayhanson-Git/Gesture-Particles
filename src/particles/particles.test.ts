import { describe, it, expect } from 'vitest';
import { particleTemplates, templateById } from './templates';
import { easeInOutCubic, mixInto, halfHeight } from './morph';
import { colorPresets, nextColorPreset, nextGradientPreset, gradientPresets } from './colors';

describe('templates', () => {
  it('has twelve, with unique ids', () => {
    expect(particleTemplates).toHaveLength(12);
    expect(new Set(particleTemplates.map((t) => t.id)).size).toBe(12);
  });
  it.each(particleTemplates.map((t) => [t.id, t] as const))('%s fills every slot with a finite position', (_, t) => {
    for (const n of [1, 7, 5000]) {
      const p = t.generatePositions(n);
      expect(p).toHaveLength(n * 3);
      expect(p.every(Number.isFinite)).toBe(true);
      expect(Math.max(...Array.from(p).map(Math.abs))).toBeLessThan(4);
    }
  });
  it('falls back to the sphere for an unknown id', () => {
    expect(templateById('nope').id).toBe('sphere');
  });
});

describe('morph', () => {
  it('eases from 0 to 1, symmetrically, and clamps', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(0.25) + easeInOutCubic(0.75)).toBeCloseTo(1);
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });
  it('mixes positions', () => {
    const out = new Float32Array(3);
    mixInto(out, new Float32Array([0, 0, 0]), new Float32Array([2, 4, -2]), 0.25);
    expect(Array.from(out)).toEqual([0.5, 1, -0.5]);
  });
  it('finds the half-height', () => {
    expect(halfHeight(new Float32Array([9, -1.5, 9, 0, 1, 0]))).toBe(1.5);
    expect(halfHeight(new Float32Array([1, 0, 1]))).toBe(1);
  });
});

describe('colours', () => {
  it('keeps the nine original presets in their original order', () => {
    expect(colorPresets.map((p) => p.color)).toEqual(['#ffffff', '#ff6b35', '#0077be', '#00ff88', '#66ffcc', '#ff3333', '#88ddff', '#44aa44', '#8844ff']);
  });
  it('cycles through the presets and wraps', () => {
    expect(nextColorPreset('#ffffff').id).toBe('sunset');
    expect(nextColorPreset('#8844FF').id).toBe('white');
    expect(nextColorPreset('#123456').id).toBe('white');
  });
  it('cycles through the gradients', () => {
    expect(nextGradientPreset(null).id).toBe(gradientPresets[0].id);
    expect(nextGradientPreset(gradientPresets[gradientPresets.length - 1].id).id).toBe(gradientPresets[0].id);
  });
});
