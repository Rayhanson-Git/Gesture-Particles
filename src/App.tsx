import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { ThreeScene, type SceneHandle } from './components/ThreeScene';
import { EnhancedControlPanel } from './components/EnhancedControlPanel';
import { HandIndicator } from './components/HandIndicator';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { CameraPreview } from './components/CameraPreview';
import { StartScreen } from './components/StartScreen';
import { HelpOverlay } from './components/HelpOverlay';
import { emptyHand, useHandTracking, type HandState } from './tracking/useHandTracking';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from './settings/settings';
import { particleTemplates } from './particles/templates';
import { nextColorPreset, nextGradientPreset } from './particles/colors';
import { useReducedMotion, useShortcuts, type Shortcut } from './useShortcuts';

/** A hand that is switched off in the panel reads as no hand at all, pinch included. */
const off = (hand: HandState): HandState => ({ ...emptyHand(), position: hand.position, palm: hand.palm });

function App() {
  const { handData, status, start } = useHandTracking();
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showIntro, setShowIntro] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const sceneRef = useRef<SceneHandle>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => {
    if (status === 'running') setShowIntro(false);
  }, [status]);

  const update = useCallback((patch: Partial<Settings> | ((s: Settings) => Partial<Settings>)) => {
    setSettings((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  const cycleColor = useCallback(() => update((s) => ({ color: nextColorPreset(s.color).color, gradient: null })), [update]);
  const stepTemplate = useCallback((dir: 1 | -1) => update((s) => {
    const i = particleTemplates.findIndex((t) => t.id === s.template);
    return { template: particleTemplates[(i + dir + particleTemplates.length) % particleTemplates.length].id };
  }), [update]);

  const shortcuts: Shortcut[] = useMemo(() => [
    { keys: ['ArrowRight'], label: 'Next shape', run: () => stepTemplate(1) },
    { keys: ['ArrowLeft'], label: 'Previous shape', run: () => stepTemplate(-1) },
    { keys: ['c'], label: 'Next colour', run: cycleColor },
    { keys: ['g'], label: 'Next gradient', run: () => update((s) => ({ gradient: nextGradientPreset(s.gradient).id })) },
    { keys: ['b'], label: 'Bloom on or off', run: () => update((s) => ({ bloomEnabled: !s.bloomEnabled })) },
    { keys: [' '], label: 'Auto-rotate on or off', run: () => update((s) => ({ autoRotateSpeed: s.autoRotateSpeed ? 0 : 1 })) },
    { keys: ['f'], label: 'Force field on or off', run: () => update((s) => ({ forceField: !s.forceField })) },
    { keys: ['r'], label: 'Reset the view', run: () => sceneRef.current?.resetView() },
    { keys: ['s'], label: 'Save a PNG', run: () => sceneRef.current?.saveImage() },
    { keys: ['h'], label: 'Hide the interface', run: () => setUiHidden((v) => !v) },
    { keys: ['?', '/'], label: 'Show these controls', run: () => setShowHelp((v) => !v) },
    { keys: ['Escape'], label: 'Close', run: () => { setShowHelp(false); setShowIntro(false); } },
  ], [cycleColor, stepTemplate, update]);
  useShortcuts(shortcuts);

  const filteredHandData = {
    ...handData,
    leftHand: settings.leftHandEnabled ? handData.leftHand : off(handData.leftHand),
    rightHand: settings.rightHandEnabled ? handData.rightHand : off(handData.rightHand),
  };

  return (
    <div className="relative w-full h-screen overflow-hidden transition-colors duration-1000" style={{ backgroundColor: settings.backgroundColor }}>
      <ThreeScene ref={sceneRef} handData={filteredHandData} settings={settings} onCycleColor={cycleColor} reduceMotion={reduceMotion} />

      {!uiHidden && (
        <>
          <EnhancedControlPanel
            settings={settings}
            onChange={update}
            onReset={() => setSettings(DEFAULT_SETTINGS)}
            onSave={() => sceneRef.current?.saveImage()}
          />
          <HandIndicator leftHand={filteredHandData.leftHand} rightHand={filteredHandData.rightHand} status={status} onStart={start} />
          <CameraPreview handData={handData} running={status === 'running'} />

          <div className="fixed top-6 right-6 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h1 className="hidden sm:block text-white text-2xl font-light tracking-wider">Gesture Particles</h1>
              <button onClick={() => setShowPerformance((v) => !v)} className="hidden sm:block text-xs text-white/60 hover:text-white transition-colors">
                {showPerformance ? 'Hide' : 'Show'} FPS
              </button>
              <button onClick={() => setShowHelp(true)} className="text-white/60 hover:text-white transition-colors" aria-label="Controls and shortcuts">
                <HelpCircle size={18} />
              </button>
            </div>
          </div>
          <PerformanceMonitor show={showPerformance} />
        </>
      )}

      {showIntro && <StartScreen status={status} onStart={start} onSkip={() => setShowIntro(false)} />}
      {showHelp && <HelpOverlay shortcuts={shortcuts} onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
