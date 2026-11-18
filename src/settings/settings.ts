// Every setting in the control panel, its default, and how it is remembered.
// Settings are kept in localStorage under STORAGE_KEY. Anything read back is
// checked and clamped, so an old or hand-edited value can never break the scene.
import { particleTemplates } from '../particles/templates';
import { gradientPresets } from '../particles/colors';
import { DENSITY_MAX, DENSITY_MIN, DENSITY_STEP, SIZE_MAX, SIZE_MIN } from '../particles/ParticleSystem';

export interface Settings {
  template: string;
  color: string;
  /** A gradient preset id, or null for the solid colour. */
  gradient: string | null;
  bloomEnabled: boolean;
  bloomIntensity: number;
  particleSize: number;
  particleOpacity: number;
  particleDensity: number;
  pulsateIntensity: number;
  autoRotateSpeed: number;
  backgroundColor: string;
  leftHandEnabled: boolean;
  rightHandEnabled: boolean;
  showHandDots: boolean;
  forceField: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  template: 'sphere',
  color: '#ffffff',
  gradient: null,
  bloomEnabled: true,
  bloomIntensity: 1.5,
  particleSize: 0.03,
  particleOpacity: 0.8,
  particleDensity: 15000,
  pulsateIntensity: 0,
  autoRotateSpeed: 0,
  backgroundColor: '#0a0a0a',
  leftHandEnabled: true,
  rightHandEnabled: true,
  showHandDots: true,
  forceField: true,
};

export const STORAGE_KEY = 'gesture-particles:settings:v1';

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const hex = (v: unknown, fallback: string) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : fallback);

/** Turns anything (usually parsed JSON) into valid settings, falling back to the defaults field by field. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  const density = clamp(r.particleDensity, DENSITY_MIN, DENSITY_MAX, d.particleDensity);
  return {
    template: particleTemplates.some((t) => t.id === r.template) ? (r.template as string) : d.template,
    color: hex(r.color, d.color),
    gradient: gradientPresets.some((g) => g.id === r.gradient) ? (r.gradient as string) : null,
    bloomEnabled: bool(r.bloomEnabled, d.bloomEnabled),
    bloomIntensity: clamp(r.bloomIntensity, 0, 3, d.bloomIntensity),
    particleSize: clamp(r.particleSize, SIZE_MIN, SIZE_MAX, d.particleSize),
    particleOpacity: clamp(r.particleOpacity, 0, 1, d.particleOpacity),
    particleDensity: Math.round(density / DENSITY_STEP) * DENSITY_STEP,
    pulsateIntensity: clamp(r.pulsateIntensity, 0, 1, d.pulsateIntensity),
    autoRotateSpeed: clamp(r.autoRotateSpeed, -3, 3, d.autoRotateSpeed),
    backgroundColor: hex(r.backgroundColor, d.backgroundColor),
    leftHandEnabled: bool(r.leftHandEnabled, d.leftHandEnabled),
    rightHandEnabled: bool(r.rightHandEnabled, d.rightHandEnabled),
    showHandDots: bool(r.showHandDots, d.showHandDots),
    forceField: bool(r.forceField, d.forceField),
  };
}

export function loadSettings(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): Settings {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    return text ? sanitizeSettings(JSON.parse(text)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings, storage: Pick<Storage, 'setItem'> | undefined = safeStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // private mode or storage full: settings just aren't remembered
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}
