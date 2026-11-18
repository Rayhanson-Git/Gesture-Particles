import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  Globe, CircleDot, Sparkles, Dna, Star, Circle, Waves, Heart, Infinity as InfinityIcon, Tornado, Box, Orbit,
  ChevronDown, ChevronUp, Sliders, Palette, Settings as SettingsIcon, Play, Pause, Hand, Download, RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { particleTemplates } from '../particles/templates';
import { colorPresets, gradientPresets } from '../particles/colors';
import { DENSITY_MAX, DENSITY_MIN, DENSITY_STEP, SIZE_MAX, SIZE_MIN } from '../particles/ParticleSystem';
import type { Settings } from '../settings/settings';

interface EnhancedControlPanelProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onSave: () => void;
}

const templateIcons: Record<string, LucideIcon> = {
  sphere: Globe,
  torus: CircleDot,
  helix: Sparkles,
  dna: Dna,
  galaxy: Orbit,
  star: Star,
  saturn: Circle,
  aurora: Waves,
  heart: Heart,
  knot: InfinityIcon,
  vortex: Tornado,
  cube: Box,
};

export const EnhancedControlPanel = ({ settings, onChange, onReset, onSave }: EnhancedControlPanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const [expandedSection, setExpandedSection] = useState<string | null>('templates');
  const s = settings;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isAutoRotating = s.autoRotateSpeed !== 0;

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        aria-label="Open controls"
        className="fixed top-6 left-6 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl hover:bg-black/40 transition-all"
      >
        <Sliders size={24} className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed top-6 left-6 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl w-80 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-md p-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-white text-lg font-light tracking-wide">Controls</h2>
        <button onClick={() => setIsCollapsed(true)} aria-label="Collapse controls" className="text-white/60 hover:text-white transition-colors">
          <ChevronUp size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <Section icon={<Globe size={18} />} title="Shapes" isExpanded={expandedSection === 'templates'} onToggle={() => toggleSection('templates')}>
          <div className="grid grid-cols-3 gap-2">
            {particleTemplates.map((template) => {
              const Icon = templateIcons[template.id] ?? Globe;
              const isSelected = s.template === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => onChange({ template: template.id })}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-300 ease-out ${
                    isSelected
                      ? 'bg-white/20 border-2 border-white/40 shadow-lg scale-105'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105'
                  }`}
                >
                  <Icon size={18} className={`mb-1 transition-colors ${isSelected ? 'text-white' : 'text-white/60'}`} />
                  <span className={`text-xs transition-colors ${isSelected ? 'text-white' : 'text-white/50'}`}>{template.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-white/40 text-xs mt-3">Shapes morph into each other. ← and → step through them.</p>
        </Section>

        <Section icon={<Palette size={18} />} title="Colours" isExpanded={expandedSection === 'colors'} onToggle={() => toggleSection('colors')}>
          <div className="space-y-4">
            <div>
              <h4 className="text-white/60 text-xs mb-2">Solid</h4>
              <div className="grid grid-cols-3 gap-2">
                {colorPresets.map((preset) => (
                  <Swatch
                    key={preset.id}
                    name={preset.name}
                    background={preset.color}
                    selected={!s.gradient && s.color === preset.color}
                    onClick={() => onChange({ color: preset.color, gradient: null })}
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white/60 text-xs mb-2">Gradients</h4>
              <div className="grid grid-cols-3 gap-2">
                {gradientPresets.map((g) => (
                  <Swatch
                    key={g.id}
                    name={g.name}
                    background={`linear-gradient(0deg, ${g.from}, ${g.to})`}
                    selected={s.gradient === g.id}
                    onClick={() => onChange({ gradient: g.id })}
                  />
                ))}
              </div>
              <p className="text-white/40 text-xs mt-2">Bottom to top of the shape. G cycles them.</p>
            </div>
            <div>
              <h4 className="text-white/60 text-xs mb-2">Custom</h4>
              <HexColorPicker color={s.color} onChange={(color) => onChange({ color, gradient: null })} style={{ width: '100%', height: '120px' }} />
            </div>
          </div>
        </Section>

        <Section icon={<SettingsIcon size={18} />} title="Particle Settings" isExpanded={expandedSection === 'particles'} onToggle={() => toggleSection('particles')}>
          <div className="space-y-4">
            <Slider label="Density" value={s.particleDensity} onChange={(v) => onChange({ particleDensity: v })} min={DENSITY_MIN} max={DENSITY_MAX} step={DENSITY_STEP} displayValue={`${(s.particleDensity / 1000).toFixed(0)}k`} />
            <Slider label="Size" value={s.particleSize} onChange={(v) => onChange({ particleSize: v })} min={SIZE_MIN} max={SIZE_MAX} step={0.01} displayValue={(s.particleSize * 100).toFixed(0)} />
            <Slider label="Opacity" value={s.particleOpacity} onChange={(v) => onChange({ particleOpacity: v })} min={0} max={1} step={0.1} displayValue={`${(s.particleOpacity * 100).toFixed(0)}%`} />
            <Slider label="Pulsate" value={s.pulsateIntensity} onChange={(v) => onChange({ pulsateIntensity: v })} min={0} max={1} step={0.1} displayValue={`${(s.pulsateIntensity * 100).toFixed(0)}%`} />
          </div>
        </Section>

        <Section icon={<Sliders size={18} />} title="Effects" isExpanded={expandedSection === 'effects'} onToggle={() => toggleSection('effects')}>
          <div className="space-y-4">
            <Toggle label="Bloom Glow" enabled={s.bloomEnabled} onChange={(v) => onChange({ bloomEnabled: v })} />
            {s.bloomEnabled && (
              <Slider label="Bloom Intensity" value={s.bloomIntensity} onChange={(v) => onChange({ bloomIntensity: v })} min={0} max={3} step={0.1} displayValue={s.bloomIntensity.toFixed(1)} />
            )}
            <Toggle label="Force Field" enabled={s.forceField} onChange={(v) => onChange({ forceField: v })} />
            <p className="text-white/40 text-xs -mt-2">An open right palm, or the mouse pointer, pushes particles aside.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">Auto Rotate</span>
                <button
                  onClick={() => onChange({ autoRotateSpeed: isAutoRotating ? 0 : 1 })}
                  aria-label={isAutoRotating ? 'Stop auto-rotate' : 'Start auto-rotate'}
                  className={`p-2 rounded-lg transition-all ${isAutoRotating ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {isAutoRotating ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
              {isAutoRotating && (
                <Slider label="Speed" value={s.autoRotateSpeed} onChange={(v) => onChange({ autoRotateSpeed: v })} min={-3} max={3} step={0.1} displayValue={s.autoRotateSpeed.toFixed(1)} />
              )}
            </div>
          </div>
        </Section>

        <Section icon={<Hand size={18} />} title="Hand Tracking" isExpanded={expandedSection === 'hands'} onToggle={() => toggleSection('hands')}>
          <div className="space-y-3">
            <Toggle label="Left Hand" enabled={s.leftHandEnabled} onChange={(v) => onChange({ leftHandEnabled: v })} />
            <Toggle label="Right Hand" enabled={s.rightHandEnabled} onChange={(v) => onChange({ rightHandEnabled: v })} />
            <Toggle label="Show Hand Dots" enabled={s.showHandDots} onChange={(v) => onChange({ showHandDots: v })} />
            <p className="text-white/40 text-xs mt-2">Switch off a hand you don't want steering the particles, handy when recording.</p>
          </div>
        </Section>

        <Section icon={<Circle size={18} />} title="Background" isExpanded={expandedSection === 'background'} onToggle={() => toggleSection('background')}>
          <HexColorPicker color={s.backgroundColor} onChange={(backgroundColor) => onChange({ backgroundColor })} style={{ width: '100%', height: '120px' }} />
        </Section>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={onSave} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/80 hover:bg-white/10 transition">
            <Download size={14} /> Save PNG
          </button>
          <button onClick={onReset} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/80 hover:bg-white/10 transition">
            <RotateCcw size={14} /> Reset settings
          </button>
        </div>
        <p className="text-white/30 text-[11px] text-center">Settings are remembered in this browser.</p>
      </div>
    </div>
  );
};

const Swatch = ({ name, background, selected, onClick }: { name: string; background: string; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    title={name}
    aria-label={name}
    aria-pressed={selected}
    className={`group relative h-10 rounded-lg border transition-all hover:scale-110 ${selected ? 'border-white/80 ring-1 ring-white/50' : 'border-white/10 hover:border-white/30'}`}
    style={{ background }}
  >
    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
      {name}
    </span>
  </button>
);

const Section = ({
  icon,
  title,
  isExpanded,
  onToggle,
  children
}: {
  icon: React.ReactNode;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="border border-white/10 rounded-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-white/60">{icon}</span>
        <span className="text-white text-sm font-light">{title}</span>
      </div>
      {isExpanded ? <ChevronUp size={16} className="text-white/60" /> : <ChevronDown size={16} className="text-white/60" />}
    </button>
    {isExpanded && <div className="p-3">{children}</div>}
  </div>
);

const Slider = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  displayValue
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  displayValue: string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-white/60 text-xs">{label}</span>
      <span className="text-white text-xs font-medium">{displayValue}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
    />
  </div>
);

const Toggle = ({
  label,
  enabled,
  onChange
}: {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-white/60 text-xs">{label}</span>
    <button
      onClick={() => onChange(!enabled)}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-white/30' : 'bg-white/10'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);
