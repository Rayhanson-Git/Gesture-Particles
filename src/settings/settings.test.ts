import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, sanitizeSettings, loadSettings, saveSettings, STORAGE_KEY } from './settings';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe('settings', () => {
  it('keeps the original defaults', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      template: 'sphere', color: '#ffffff', bloomEnabled: true, bloomIntensity: 1.5, particleSize: 0.03,
      particleOpacity: 0.8, particleDensity: 15000, pulsateIntensity: 0, autoRotateSpeed: 0, backgroundColor: '#0a0a0a',
    });
  });
  it('falls back to the defaults for junk', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ template: 'teapot', color: 'red', gradient: 'nope', bloomEnabled: 'yes' })).toEqual(DEFAULT_SETTINGS);
  });
  it('clamps numbers and snaps the density', () => {
    const s = sanitizeSettings({ particleDensity: 1e9, particleSize: -1, bloomIntensity: 99, particleOpacity: NaN });
    expect(s.particleDensity).toBe(100000);
    expect(s.particleSize).toBe(0.01);
    expect(s.bloomIntensity).toBe(3);
    expect(s.particleOpacity).toBe(0.8);
    expect(sanitizeSettings({ particleDensity: 12345 }).particleDensity).toBe(10000);
  });
  it('round-trips through storage', () => {
    const store = memory();
    const s = { ...DEFAULT_SETTINGS, template: 'heart', gradient: 'dusk', color: '#ABCDEF' };
    saveSettings(s, store);
    expect(store.m.has(STORAGE_KEY)).toBe(true);
    expect(loadSettings(store)).toEqual({ ...s, color: '#abcdef' });
  });
  it('survives broken JSON', () => {
    expect(loadSettings({ getItem: () => '{oops' })).toEqual(DEFAULT_SETTINGS);
  });
});
