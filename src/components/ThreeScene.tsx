import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ParticleSystem, SCALE_MAX } from '../particles/ParticleSystem';
import { templateById } from '../particles/templates';
import { gradientPresets } from '../particles/colors';
import type { HandTrackingData } from '../tracking/useHandTracking';
import type { Settings } from '../settings/settings';
import { rightHandScale } from '../gestures/handMath';
import { HandFeedbackRings } from './HandFeedbackRings';

export interface SceneHandle {
  /** Downloads the current frame as a PNG. */
  saveImage: () => void;
  /** Scale 1, no rotation. */
  resetView: () => void;
}

interface ThreeSceneProps {
  handData: HandTrackingData;
  settings: Settings;
  /** A left-hand pinch, or a click on the scene, asks for the next colour. */
  onCycleColor: () => void;
  reduceMotion: boolean;
}

// pointer controls
const DRAG_ROTATE = 0.008; // radians per pixel dragged
const WHEEL_ZOOM = 0.0015; // scale change per wheel unit (exponential)
const CLICK_SLOP = 6; // pixels a click may move and still count as a click
const CLICK_MS = 350;

export const ThreeScene = forwardRef<SceneHandle, ThreeSceneProps>(function ThreeScene(
  { handData, settings, onCycleColor, reduceMotion },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const systemRef = useRef<ParticleSystem | null>(null);
  const bloomRef = useRef<UnrealBloomPass | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // values the render loop reads every frame, kept in refs so the loop never goes stale
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const handsRef = useRef(handData);
  handsRef.current = handData;
  const cycleRef = useRef(onCycleColor);
  cycleRef.current = onCycleColor;
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchRef = useRef(false);

  // ------------------------------------------------------------ set up once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const s = settingsRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(s.backgroundColor);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute('aria-label', 'Particle scene. Drag to rotate, scroll or pinch to scale, click to change colour.');
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);
    canvasRef.current = renderer.domElement;

    // the template effect below fills it with particles
    const system = new ParticleSystem();
    scene.add(system.getMesh());
    systemRef.current = system;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), s.bloomIntensity, 0.6, 0.7);
    composer.addPass(bloom);
    bloomRef.current = bloom;

    // the force field sits on the z = 0 plane, under the hand or the pointer
    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    const onPlane = (ndcX: number, ndcY: number) => {
      ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, y: hit.y } : null;
    };

    const render = () => {
      if (settingsRef.current.bloomEnabled) composer.render();
      else renderer.render(scene, camera);
    };
    renderRef.current = render;

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const st = settingsRef.current;
      const hands = handsRef.current;
      let force: { x: number; y: number } | null = null;
      if (st.forceField) {
        const right = hands.rightHand;
        if (right.isDetected && right.isOpen) {
          // the same orientation as the hand rings: the camera picture is not mirrored
          force = onPlane((right.palm.x - 0.5) * 2, -(right.palm.y - 0.5) * 2);
        } else if (!hands.leftHand.isDetected && !right.isDetected && pointerRef.current) {
          force = onPlane(pointerRef.current.x, pointerRef.current.y);
        }
      }
      system.setForce(force);
      system.update();
      render();
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ---------------------------------------------- mouse and touch controls
    const el = renderer.domElement;
    const active = new Map<number, { x: number; y: number }>();
    let down: { x: number; y: number; t: number } | null = null;
    let pinchStart = 0;
    let scaleAtPinch = 1;
    const ndc = (e: PointerEvent | WheelEvent) => {
      const r = el.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
    };
    const spread = () => {
      const [a, b] = [...active.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });
      down = active.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
      if (active.size === 2) {
        pinchStart = spread();
        scaleAtPinch = system.getTargetScale();
      }
    };
    const onMove = (e: PointerEvent) => {
      pointerRef.current = e.pointerType === 'mouse' ? ndc(e) : null;
      const prev = active.get(e.pointerId);
      if (!prev) return;
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (active.size === 2 && pinchStart > 0) {
        system.setTargetScale(Math.min(SCALE_MAX, Math.max(0.1, scaleAtPinch * (spread() / pinchStart))));
      } else if (active.size === 1) {
        system.nudgeRotation((e.clientY - prev.y) * DRAG_ROTATE, (e.clientX - prev.x) * DRAG_ROTATE);
      }
    };
    const onUp = (e: PointerEvent) => {
      active.delete(e.pointerId);
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < CLICK_SLOP && performance.now() - down.t < CLICK_MS) {
        cycleRef.current();
      }
      down = null;
      if (active.size < 2) pinchStart = 0;
    };
    const onLeave = () => {
      pointerRef.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = system.getTargetScale() * Math.exp(-e.deltaY * WHEEL_ZOOM);
      system.setTargetScale(Math.min(SCALE_MAX, Math.max(0.1, next)));
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('wheel', onWheel, { passive: false });

    setScene(scene);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('wheel', onWheel);
      system.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      el.remove();
      systemRef.current = null;
      setScene(null);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    saveImage: () => {
      const canvas = canvasRef.current;
      if (!canvas || !renderRef.current) return;
      renderRef.current(); // draw now, so the buffer still holds the frame when it is read
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `gesture-particles-${settingsRef.current.template}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }, 'image/png');
    },
    resetView: () => systemRef.current?.resetView(),
  }), []);

  // ------------------------------------------------------- settings → scene
  const { template, particleDensity, color, gradient, backgroundColor, bloomIntensity, particleSize, particleOpacity, pulsateIntensity, autoRotateSpeed } = settings;

  useEffect(() => {
    systemRef.current?.setTemplate(templateById(template).generatePositions(particleDensity));
  }, [template, particleDensity]);

  useEffect(() => {
    const g = gradientPresets.find((p) => p.id === gradient);
    if (g) systemRef.current?.setGradient(g.from, g.to);
    else systemRef.current?.setColor(color);
  }, [color, gradient]);

  useEffect(() => {
    if (scene) scene.background = new THREE.Color(backgroundColor);
  }, [scene, backgroundColor]);

  useEffect(() => {
    if (bloomRef.current) bloomRef.current.strength = bloomIntensity;
  }, [bloomIntensity]);

  useEffect(() => systemRef.current?.setSize(particleSize), [particleSize]);
  useEffect(() => systemRef.current?.setOpacity(particleOpacity), [particleOpacity]);
  useEffect(() => systemRef.current?.setPulsateIntensity(pulsateIntensity), [pulsateIntensity]);
  useEffect(() => systemRef.current?.setAutoRotateSpeed(autoRotateSpeed), [autoRotateSpeed]);
  useEffect(() => systemRef.current?.setReduceMotion(reduceMotion), [reduceMotion]);

  // ------------------------------------------------------------ hands → scene
  useEffect(() => {
    const system = systemRef.current;
    if (!system) return;
    const { leftHand, rightHand } = handData;

    // right hand: spread to grow, pinch to shrink
    if (rightHand.isDetected && rightHand.landmarks && rightHand.landmarks.length >= 21) {
      system.setTargetScale(rightHandScale(rightHand.landmarks));
    }
    // left hand: tilt the wrist to turn the shape
    if (leftHand.isDetected) {
      system.setTargetRotation(leftHand.rotation.x, leftHand.rotation.y, leftHand.rotation.z);
    }
    // left hand: each new pinch moves to the next colour
    if (leftHand.isPinching && !lastPinchRef.current) cycleRef.current();
    lastPinchRef.current = leftHand.isPinching;
  }, [handData]);

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 w-full h-full" />
      {scene && settings.showHandDots && <HandFeedbackRings handData={handData} scene={scene} />}
    </>
  );
});
