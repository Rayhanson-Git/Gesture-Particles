import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HAND_CONNECTIONS, OPEN_THRESHOLD, handOpenness, handPosition, isPinching, palmCentre, personHand, pinchCloseness,
  wristRotation, type Landmark, type Vec3,
} from '../gestures/handMath';
import { drawHandCube } from '../components/HandCube';
import { HANDS_BASE, loadMediaPipe, type CameraHelper, type HandsResults, type HandsSolution } from './mediapipe';

export interface HandState {
  isOpen: boolean;
  openness: number;
  /** The wrist in scene units, -1..1 (see handPosition). */
  position: Vec3;
  /** The palm centre in the camera picture, 0..1. */
  palm: Vec3;
  rotation: Vec3;
  isDetected: boolean;
  isPinching: boolean;
  landmarks?: Landmark[];
}

export interface HandTrackingData {
  leftHand: HandState;
  rightHand: HandState;
  isInitialized: boolean;
}

export type TrackingStatus = 'idle' | 'loading' | 'running' | 'denied' | 'no-camera' | 'busy' | 'error';

export const emptyHand = (): HandState => ({
  isOpen: false,
  openness: 0,
  position: { x: 0, y: 0, z: 0 },
  palm: { x: 0.5, y: 0.5, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  isDetected: false,
  isPinching: false,
});

const EMPTY: HandTrackingData = { leftHand: emptyHand(), rightHand: emptyHand(), isInitialized: false };

function handState(landmarks: Landmark[]): HandState {
  const openness = handOpenness(landmarks);
  return {
    isOpen: openness > OPEN_THRESHOLD,
    openness,
    position: handPosition(landmarks),
    palm: palmCentre(landmarks),
    rotation: wristRotation(landmarks),
    isDetected: true,
    isPinching: isPinching(landmarks),
    landmarks,
  };
}

/** Turns one MediaPipe result into the person's left and right hands. */
export function readResults(results: HandsResults): HandTrackingData {
  const data: HandTrackingData = { leftHand: emptyHand(), rightHand: emptyHand(), isInitialized: true };
  results.multiHandLandmarks?.forEach((landmarks, i) => {
    const label = results.multiHandedness?.[i]?.label;
    if (!label) return;
    if (personHand(label) === 'right') data.rightHand = handState(landmarks);
    else data.leftHand = handState(landmarks);
  });
  return data;
}

/** Maps a getUserMedia failure to something we can explain on screen. */
export function statusForError(err: unknown): TrackingStatus {
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') return 'no-camera';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy';
  return 'error';
}

// ---------------------------------------------------------------- preview

let lastSize = '';
/** Draws the camera frame and the hand overlays into the preview canvas, when it is open. */
function drawPreview(video: HTMLVideoElement, results: HandsResults) {
  const canvas = document.getElementById('camera-canvas') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const size = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
  if (size !== lastSize || canvas.width !== Math.round(rect.width)) {
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);
    lastSize = size;
  }
  const W = canvas.width, H = canvas.height;
  ctx.drawImage(video, 0, 0, W, H);

  results.multiHandLandmarks?.forEach((landmarks, i) => {
    const label = results.multiHandedness?.[i]?.label;
    ctx.fillStyle = 'white';
    for (const p of landmarks) {
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'white';
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 0.5;
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * W, landmarks[a].y * H);
      ctx.lineTo(landmarks[b].x * W, landmarks[b].y * H);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (label && personHand(label) === 'left') {
      // the left hand steers rotation: show a cube turning with the wrist
      drawHandCube(ctx, W, H, palmCentre(landmarks), wristRotation(landmarks), isPinching(landmarks));
    } else if (label) {
      // the right hand scales: show the thumb-to-index gap, greener as it closes
      const t = landmarks[4], ix = landmarks[8];
      const c = pinchCloseness(landmarks);
      const col = `rgb(${Math.round(74 - 74 * c)},${Math.round(158 + 97 * c)},${Math.round(255 - 85 * c)})`;
      const tx = t.x * W, ty = t.y * H, jx = ix.x * W, jy = ix.y * H;
      ctx.save();
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.6 + c * 0.4;
      ctx.shadowColor = col;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(jx, jy);
      ctx.stroke();
      for (const [x, y, r] of [[(tx + jx) / 2, (ty + jy) / 2, 2 + c * 4], [tx, ty, 3.5], [jx, jy, 3.5]]) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  });
}

// ------------------------------------------------------------------- hook

/**
 * Camera and hand tracking. Nothing is downloaded and no camera is opened
 * until start() is called (from the start screen or the hand panel).
 */
export const useHandTracking = () => {
  const [handData, setHandData] = useState<HandTrackingData>(EMPTY);
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<HandsSolution | null>(null);
  const cameraRef = useRef<CameraHelper | null>(null);
  const busyRef = useRef(false);
  const aliveRef = useRef(true);

  const stop = useCallback(() => {
    try {
      cameraRef.current?.stop();
    } catch { /* already stopped */ }
    try {
      handsRef.current?.close();
    } catch { /* already closed */ }
    const video = videoRef.current;
    (video?.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
    video?.remove();
    cameraRef.current = null;
    handsRef.current = null;
    videoRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (busyRef.current || cameraRef.current) return;
    busyRef.current = true;
    setStatus('loading');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('No camera API'), { name: 'NotFoundError' });
      await loadMediaPipe();

      const video = document.createElement('video');
      video.playsInline = true;
      video.muted = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      videoRef.current = video;

      const hands = new window.Hands!({ locateFile: (file) => `${HANDS_BASE}/${file}` });
      hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      hands.onResults((results) => {
        if (!aliveRef.current) return;
        drawPreview(video, results);
        setHandData(readResults(results));
      });
      handsRef.current = hands;

      let failed = false;
      const camera = new window.Camera!(video, {
        onFrame: async () => {
          if (!handsRef.current || failed) return;
          try {
            await handsRef.current.send({ image: video });
          } catch (e) {
            failed = true;
            console.error('Hand tracking failed:', e);
            setStatus('error');
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      await camera.start();
      setHandData((d) => ({ ...d, isInitialized: true }));
      setStatus('running');
    } catch (err) {
      console.error('Could not start hand tracking:', err);
      stop();
      setStatus(statusForError(err));
    } finally {
      busyRef.current = false;
    }
  }, [stop]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stop();
    };
  }, [stop]);

  return { handData, status, start };
};
