import { useEffect, useRef, useState } from 'react';
import { detectPinch } from '../utils/gestureDetection';
import { drawHandCube } from '../components/HandCube';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export interface HandState {
  isOpen: boolean;
  openness: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  isDetected: boolean;
  isPinching: boolean;
  landmarks?: any[];
}

export interface HandTrackingData {
  leftHand: HandState;
  rightHand: HandState;
  isInitialized: boolean;
}

const calculateHandOpenness = (landmarks: any[]): number => {
  const fingerTips = [8, 12, 16, 20];
  const fingerBases = [5, 9, 13, 17];
  const palmCenter = landmarks[0];

  let totalDistance = 0;
  let baseDistance = 0;

  fingerTips.forEach((tipIndex, i) => {
    const tip = landmarks[tipIndex];
    const base = landmarks[fingerBases[i]];

    const tipDist = Math.sqrt(
      Math.pow(tip.x - palmCenter.x, 2) +
      Math.pow(tip.y - palmCenter.y, 2) +
      Math.pow(tip.z - palmCenter.z, 2)
    );

    const baseDist = Math.sqrt(
      Math.pow(base.x - palmCenter.x, 2) +
      Math.pow(base.y - palmCenter.y, 2) +
      Math.pow(base.z - palmCenter.z, 2)
    );

    totalDistance += tipDist;
    baseDistance += baseDist;
  });

  const thumbTip = landmarks[4];
  const thumbDist = Math.sqrt(
    Math.pow(thumbTip.x - palmCenter.x, 2) +
    Math.pow(thumbTip.y - palmCenter.y, 2) +
    Math.pow(thumbTip.z - palmCenter.z, 2)
  );
  totalDistance += thumbDist;

  const openness = Math.min(1, Math.max(0, (totalDistance / 2.5) - 0.3));
  return openness;
};

const getHandPosition = (landmarks: any[]) => {
  const wrist = landmarks[0];
  return {
    x: (wrist.x - 0.5) * 2,
    y: -(wrist.y - 0.5) * 2,
    z: wrist.z * -2
  };
};

const getWristRotation = (landmarks: any[]) => {
  const wrist = landmarks[0];
  const indexMCP = landmarks[5];
  const pinkyMCP = landmarks[17];

  const handVector = {
    x: indexMCP.x - pinkyMCP.x,
    y: indexMCP.y - pinkyMCP.y,
    z: indexMCP.z - pinkyMCP.z
  };

  const middleFinger = landmarks[9];
  const forwardVector = {
    x: middleFinger.x - wrist.x,
    y: middleFinger.y - wrist.y,
    z: middleFinger.z - wrist.z
  };

  const rotZ = Math.atan2(handVector.y, handVector.x);
  const rotX = Math.atan2(forwardVector.y, Math.sqrt(forwardVector.x * forwardVector.x + forwardVector.z * forwardVector.z));
  const rotY = Math.atan2(-forwardVector.x, -forwardVector.z);

  return {
    x: rotX,
    y: rotY,
    z: rotZ
  };
};

const drawToCanvas = (videoElement: HTMLVideoElement, results: any) => {
  const canvas = document.getElementById('camera-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks) {
    results.multiHandLandmarks.forEach((landmarks: any, handIndex: number) => {
      const handedness = results.multiHandedness[handIndex].label;
      const isLeftHand = handedness === 'Left';
      const color = isLeftHand ? '#00ff88' : '#ff00ff';

      landmarks.forEach((landmark: any) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });

      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
      ];

      connections.forEach(([start, end]) => {
        const startLandmark = landmarks[start];
        const endLandmark = landmarks[end];

        ctx.strokeStyle = 'white';
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(startLandmark.x * canvas.width, startLandmark.y * canvas.height);
        ctx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      const isUserLeftHand = handedness === 'Right';
      if (isUserLeftHand) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const indexMCP = landmarks[5];
        const pinkyMCP = landmarks[17];
        const palmCenter = {
          x: (thumbTip.x + indexTip.x + middleTip.x + ringTip.x + pinkyTip.x + indexMCP.x + pinkyMCP.x) / 7,
          y: (thumbTip.y + indexTip.y + middleTip.y + ringTip.y + pinkyTip.y + indexMCP.y + pinkyMCP.y) / 7,
          z: (thumbTip.z + indexTip.z + middleTip.z + ringTip.z + pinkyTip.z + indexMCP.z + pinkyMCP.z) / 7,
        };
        const rotation = getWristRotation(landmarks);
        const isPinching = detectPinch(landmarks);
        drawHandCube(
          ctx,
          canvas.width,
          canvas.height,
          palmCenter,
          rotation,
          isPinching
        );
      }

      const isRightHand = handedness === 'Left';
      if (isRightHand) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        const tx = thumb.x * canvas.width;
        const ty = thumb.y * canvas.height;
        const ix = index.x * canvas.width;
        const iy = index.y * canvas.height;

        const dist = Math.sqrt(
          (thumb.x - index.x) ** 2 +
          (thumb.y - index.y) ** 2 +
          (thumb.z - index.z) ** 2
        );
        const closeness = Math.max(0, 1 - dist * 10);

        const r = Math.round(74 + (0 - 74) * closeness);
        const g = Math.round(158 + (255 - 158) * closeness);
        const b = Math.round(255 + (170 - 255) * closeness);
        const lineColor = `rgb(${r},${g},${b})`;

        ctx.save();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.6 + closeness * 0.4;
        ctx.shadowColor = lineColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ix, iy);
        ctx.stroke();

        const mx = (tx + ix) / 2;
        const my = (ty + iy) / 2;
        const dotRadius = 2 + closeness * 4;
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(mx, my, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ix, iy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    });
  }
};

export const useHandTracking = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initializingRef = useRef(false);

  const [handData, setHandData] = useState<HandTrackingData>({
    leftHand: { isOpen: false, openness: 0, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, isDetected: false, isPinching: false },
    rightHand: { isOpen: false, openness: 0, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, isDetected: false, isPinching: false },
    isInitialized: false
  });

  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const initializeMediaPipe = () => {
      if (!window.Hands || !window.Camera) {
        console.log('MediaPipe not loaded yet, retrying...');
        setTimeout(initializeMediaPipe, 100);
        return;
      }

      console.log('MediaPipe loaded, initializing...');

      const videoElement = document.createElement('video');
      videoElement.style.display = 'none';
      document.body.appendChild(videoElement);
      videoRef.current = videoElement;

      let hands: any;
      try {
        hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          const newLeftHand: HandState = {
            isOpen: false,
            openness: 0,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            isDetected: false,
            isPinching: false
          };

          const newRightHand: HandState = {
            isOpen: false,
            openness: 0,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            isDetected: false,
            isPinching: false
          };

          if (results.multiHandLandmarks && results.multiHandedness) {
            results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
              const handedness = results.multiHandedness[index].label;
              const openness = calculateHandOpenness(landmarks);
              const position = getHandPosition(landmarks);
              const rotation = getWristRotation(landmarks);
              const isPinching = detectPinch(landmarks);

              const handState: HandState = {
                isOpen: openness > 0.5,
                openness,
                position,
                rotation,
                isDetected: true,
                isPinching,
                landmarks
              };

              if (handedness === 'Left') {
                Object.assign(newRightHand, handState);
              } else {
                Object.assign(newLeftHand, handState);
              }
            });
          }

          drawToCanvas(videoElement, results);
          setHandData({
            leftHand: newLeftHand,
            rightHand: newRightHand,
            isInitialized: true
          });
        });

        handsRef.current = hands;

        const camera = new window.Camera(videoElement, {
          onFrame: async () => {
            if (handsRef.current) {
              await handsRef.current.send({ image: videoElement });
            }
          },
          width: 640,
          height: 480
        });

        camera.start()
          .then(() => {
            console.log('Camera started successfully');
          })
          .catch((err: any) => {
            console.error('Camera initialization failed:', err);
            setHandData(prev => ({ ...prev, isInitialized: true }));
          });

        cameraRef.current = camera;
      } catch (error) {
        console.error('Failed to initialize MediaPipe Hands:', error);
        setHandData(prev => ({ ...prev, isInitialized: true }));
      }
    };

    initializeMediaPipe();

    return () => {
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.error('Error stopping camera:', e);
        }
      }
      if (handsRef.current) {
        try {
          handsRef.current.close?.();
        } catch (e) {
          console.error('Error closing hands:', e);
        }
      }
      if (videoRef.current && document.body.contains(videoRef.current)) {
        document.body.removeChild(videoRef.current);
      }
    };
  }, []);

  return { handData, videoElement: videoRef.current, canvasRef };
};
