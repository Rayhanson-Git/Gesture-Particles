import { Camera, MousePointer2, Loader2 } from 'lucide-react';
import type { TrackingStatus } from '../tracking/useHandTracking';
import { STATUS_TEXT, isProblem } from '../tracking/statusText';

interface StartScreenProps {
  status: TrackingStatus;
  onStart: () => void;
  onSkip: () => void;
}

const GESTURES = [
  ['Right hand', 'Spread your fingers to grow the shape; pinch to shrink it.'],
  ['Left hand', 'Tilt your wrist to turn it; pinch to change colour.'],
  ['Open palm', 'Push particles aside with the force field.'],
];

export const StartScreen = ({ status, onStart, onSkip }: StartScreenProps) => {
  const problem = isProblem(status);
  const loading = status === 'loading';
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="start-title">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/60">Computer vision · 3D</p>
        <h1 id="start-title" className="mt-2 text-4xl font-light tracking-wide text-white">Gesture Particles</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          A field of light you shape with your hands. Your webcam picture stays in this browser; only the hand-tracking
          model is downloaded.
        </p>

        <dl className="mt-6 space-y-3">
          {GESTURES.map(([k, v]) => (
            <div key={k} className="flex gap-4 text-sm">
              <dt className="w-24 shrink-0 text-white/90">{k}</dt>
              <dd className="text-white/55">{v}</dd>
            </div>
          ))}
        </dl>

        {problem && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4" role="alert">
            <p className="text-sm font-medium text-red-200">{STATUS_TEXT[status].title}</p>
            <p className="mt-1 text-xs leading-relaxed text-red-100/70">{STATUS_TEXT[status].detail}</p>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onStart}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-cyan-100 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {loading ? 'Starting camera…' : problem ? 'Try again' : 'Start camera'}
          </button>
          <button
            onClick={onSkip}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-white/80 transition hover:bg-white/10"
          >
            <MousePointer2 size={16} />
            Explore without a camera
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-white/35">Press <kbd className="rounded border border-white/20 px-1">?</kbd> at any time for shortcuts.</p>
      </div>
    </div>
  );
};
