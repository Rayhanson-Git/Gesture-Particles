import { X } from 'lucide-react';
import type { Shortcut } from '../useShortcuts';

interface HelpOverlayProps {
  shortcuts: Shortcut[];
  onClose: () => void;
}

const POINTER = [
  ['Drag', 'Turn the shape'],
  ['Scroll / pinch', 'Grow or shrink it'],
  ['Click / tap', 'Next colour'],
  ['Hover', 'Push particles with the force field'],
];

const HANDS = [
  ['Right hand, spread', 'Grow the shape'],
  ['Right hand, pinch', 'Shrink it'],
  ['Right hand, open palm', 'Push particles aside'],
  ['Left hand, tilt', 'Turn the shape'],
  ['Left hand, pinch', 'Next colour'],
];

const label = (k: string) => (k === ' ' ? 'Space' : k === 'Escape' ? 'Esc' : k === 'ArrowLeft' ? '←' : k === 'ArrowRight' ? '→' : k.toUpperCase());

export const HelpOverlay = ({ shortcuts, onClose }: HelpOverlayProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={onClose}>
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-black/70 p-7 shadow-2xl backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h2 id="help-title" className="text-2xl font-light tracking-wide text-white">Controls</h2>
        <button onClick={onClose} className="text-white/60 transition hover:text-white" aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div className="mt-6 grid gap-8 md:grid-cols-3">
        <section>
          <h3 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-cyan-200/60">Keyboard</h3>
          <ul className="space-y-2">
            {shortcuts.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/60">{s.label}</span>
                <span className="flex gap-1">
                  {s.keys.filter((k) => k !== '/').map((k) => (
                    <kbd key={k} className="min-w-[1.6rem] rounded-md border border-white/20 bg-white/5 px-1.5 py-0.5 text-center text-xs text-white/85">{label(k)}</kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-cyan-200/60">Hands</h3>
          <ul className="space-y-2">
            {HANDS.map(([k, v]) => (
              <li key={k} className="text-sm"><span className="text-white/85">{k}</span><br /><span className="text-white/50">{v}</span></li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-cyan-200/60">Mouse and touch</h3>
          <ul className="space-y-2">
            {POINTER.map(([k, v]) => (
              <li key={k} className="text-sm"><span className="text-white/85">{k}</span><br /><span className="text-white/50">{v}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  </div>
);
