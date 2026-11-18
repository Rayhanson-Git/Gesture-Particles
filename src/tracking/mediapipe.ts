// Loads MediaPipe Hands (the classic "solutions" build) and its camera helper
// from jsDelivr, on demand, at fixed versions. Until November 2026 these were
// unpinned <script> tags in index.html, so any upstream release could change
// the app overnight; now the versions live here, and nothing downloads until
// the camera is started.
import type { Landmark } from '../gestures/handMath';

export const HANDS_VERSION = '0.4.1675469240';
export const CAMERA_UTILS_VERSION = '0.3.1675466862';
export const HANDS_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${HANDS_VERSION}`;
export const CAMERA_UTILS_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@${CAMERA_UTILS_VERSION}/camera_utils.js`;

export interface HandsResults {
  multiHandLandmarks?: Landmark[][];
  multiHandedness?: { label: string; score: number }[];
}

export interface HandsSolution {
  setOptions(o: Record<string, unknown>): void;
  onResults(cb: (r: HandsResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): Promise<void> | void;
}

export interface CameraHelper {
  start(): Promise<void>;
  stop(): Promise<void> | void;
}

declare global {
  interface Window {
    Hands?: new (o: { locateFile: (f: string) => string }) => HandsSolution;
    Camera?: new (video: HTMLVideoElement, o: { onFrame: () => Promise<void>; width: number; height: number }) => CameraHelper;
  }
}

const loaded = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  if (!loaded.has(src)) {
    loaded.set(
      src,
      new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.crossOrigin = 'anonymous';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => {
          loaded.delete(src);
          reject(new Error(`Could not load ${src}`));
        };
        document.head.appendChild(s);
      })
    );
  }
  return loaded.get(src)!;
}

export async function loadMediaPipe(): Promise<void> {
  await Promise.all([loadScript(`${HANDS_BASE}/hands.js`), loadScript(CAMERA_UTILS_URL)]);
  if (!window.Hands || !window.Camera) throw new Error('MediaPipe loaded but did not register Hands and Camera');
}
