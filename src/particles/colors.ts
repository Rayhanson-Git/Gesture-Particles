// Colours. The nine solid presets are the originals, in the order a left-hand
// pinch cycles through them. Gradients colour each particle by its height in
// the shape, from the first colour at the bottom to the second at the top.

export interface ColorPreset {
  id: string;
  name: string;
  color: string;
}

export interface GradientPreset {
  id: string;
  name: string;
  from: string;
  to: string;
}

export const colorPresets: ColorPreset[] = [
  { id: 'white', name: 'Pure White', color: '#ffffff' },
  { id: 'sunset', name: 'Sunset', color: '#ff6b35' },
  { id: 'ocean', name: 'Ocean', color: '#0077be' },
  { id: 'neon', name: 'Neon', color: '#00ff88' },
  { id: 'aurora', name: 'Aurora', color: '#66ffcc' },
  { id: 'fire', name: 'Fire', color: '#ff3333' },
  { id: 'ice', name: 'Ice', color: '#88ddff' },
  { id: 'forest', name: 'Forest', color: '#44aa44' },
  { id: 'galaxy', name: 'Galaxy', color: '#8844ff' },
];

export const gradientPresets: GradientPreset[] = [
  { id: 'dusk', name: 'Dusk', from: '#ff3d7f', to: '#7a5cff' },
  { id: 'lagoon', name: 'Lagoon', from: '#00c2a8', to: '#9be7ff' },
  { id: 'ember', name: 'Ember', from: '#ff2a1a', to: '#ffd36b' },
  { id: 'borealis', name: 'Borealis', from: '#2bff88', to: '#8a5bff' },
  { id: 'rayhanson', name: 'Rayhanson', from: '#db2b33', to: '#7fb3b8' },
  { id: 'mono', name: 'Moonlight', from: '#5b6b8c', to: '#ffffff' },
];

/** The preset after the one whose colour is `current` (the first if none matches). */
export function nextColorPreset(current: string): ColorPreset {
  const i = colorPresets.findIndex((p) => p.color.toLowerCase() === current.toLowerCase());
  return colorPresets[(i + 1) % colorPresets.length];
}

export function nextGradientPreset(currentId: string | null): GradientPreset {
  const i = gradientPresets.findIndex((p) => p.id === currentId);
  return gradientPresets[(i + 1) % gradientPresets.length];
}
