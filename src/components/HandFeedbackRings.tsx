import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HandTrackingData } from '../hooks/useHandTracking';

const landmarkToWorld = (landmark: { x: number; y: number; z: number }) => ({
  x: (landmark.x - 0.5) * 2,
  y: -(landmark.y - 0.5) * 2,
  z: landmark.z * -2 - 2,
});

interface HandFeedbackRingsProps {
  handData: HandTrackingData;
  scene: THREE.Scene;
}

export const HandFeedbackRings = ({ handData, scene }: HandFeedbackRingsProps) => {
  const leftRingRef = useRef<THREE.Mesh | null>(null);
  const rightRingRef = useRef<THREE.Mesh | null>(null);
  const leftLineRef = useRef<THREE.Line | null>(null);
  const leftMidpointRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const dotGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const midpointGeometry = new THREE.SphereGeometry(0.015, 12, 12);

    const leftMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const leftRing = new THREE.Mesh(dotGeometry, leftMaterial);
    leftRingRef.current = leftRing;
    scene.add(leftRing);

    const rightMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const rightRing = new THREE.Mesh(dotGeometry, rightMaterial);
    rightRingRef.current = rightRing;
    scene.add(rightRing);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });
    const leftLine = new THREE.Line(lineGeometry, lineMaterial);
    leftLineRef.current = leftLine;
    scene.add(leftLine);

    const leftMidMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const leftMidpoint = new THREE.Mesh(midpointGeometry, leftMidMat);
    leftMidpointRef.current = leftMidpoint;
    scene.add(leftMidpoint);

    return () => {
      scene.remove(leftRing);
      scene.remove(rightRing);
      scene.remove(leftLine);
      scene.remove(leftMidpoint);
      dotGeometry.dispose();
      midpointGeometry.dispose();
      leftMaterial.dispose();
      rightMaterial.dispose();
      lineMaterial.dispose();
      lineGeometry.dispose();
      leftMidMat.dispose();
    };
  }, [scene]);

  useEffect(() => {
    if (!leftRingRef.current || !rightRingRef.current) return;

    const leftRing = leftRingRef.current;
    const rightRing = rightRingRef.current;
    const leftMaterial = leftRing.material as THREE.MeshBasicMaterial;
    const rightMaterial = rightRing.material as THREE.MeshBasicMaterial;

    if (handData.leftHand.isDetected) {
      leftRing.position.set(
        handData.leftHand.position.x,
        handData.leftHand.position.y,
        handData.leftHand.position.z - 2
      );

      const time = Date.now() * 0.003;
      const baseOpacity = 0.3 + Math.sin(time) * 0.15;
      leftMaterial.opacity = baseOpacity;

      if (handData.leftHand.isPinching) {
        const pulseScale = 1.2 + Math.sin(time * 3) * 0.2;
        leftRing.scale.set(pulseScale, pulseScale, pulseScale);
        leftMaterial.color.setHex(0x00ffaa);
        leftMaterial.opacity = baseOpacity + 0.4;
      } else {
        leftRing.scale.set(1, 1, 1);
        leftMaterial.color.setHex(0x4a9eff);
      }
    } else {
      leftMaterial.opacity = 0;
    }

    if (handData.rightHand.isDetected) {
      rightRing.position.set(
        handData.rightHand.position.x,
        handData.rightHand.position.y,
        handData.rightHand.position.z - 2
      );

      const time = Date.now() * 0.003;
      const baseOpacity = 0.3 + Math.sin(time) * 0.15;
      rightMaterial.opacity = baseOpacity;

      const scaleFactor = 0.4 + handData.rightHand.openness * 0.5;
      rightRing.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const colorLerp = handData.rightHand.openness;
      const color = new THREE.Color();
      color.lerpColors(
        new THREE.Color(0x4a9eff),
        new THREE.Color(0xff4a9e),
        colorLerp
      );
      rightMaterial.color.copy(color);
    } else {
      rightMaterial.opacity = 0;
    }

    updateFingerConnection(
      handData.leftHand.landmarks,
      handData.leftHand.isDetected,
      handData.leftHand.isPinching,
      leftLineRef.current,
      leftMidpointRef.current
    );
  }, [handData]);

  return null;
};

function updateFingerConnection(
  landmarks: any[] | undefined,
  isDetected: boolean,
  isPinching: boolean,
  line: THREE.Line | null,
  midpoint: THREE.Mesh | null
) {
  if (!line || !midpoint) return;

  const lineMat = line.material as THREE.LineBasicMaterial;
  const midMat = midpoint.material as THREE.MeshBasicMaterial;

  if (!isDetected || !landmarks || landmarks.length < 21) {
    lineMat.opacity = 0;
    midMat.opacity = 0;
    return;
  }

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const thumbWorld = landmarkToWorld(thumbTip);
  const indexWorld = landmarkToWorld(indexTip);

  const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute;
  positions.setXYZ(0, thumbWorld.x, thumbWorld.y, thumbWorld.z);
  positions.setXYZ(1, indexWorld.x, indexWorld.y, indexWorld.z);
  positions.needsUpdate = true;

  const mx = (thumbWorld.x + indexWorld.x) / 2;
  const my = (thumbWorld.y + indexWorld.y) / 2;
  const mz = (thumbWorld.z + indexWorld.z) / 2;
  midpoint.position.set(mx, my, mz);

  const dist = Math.sqrt(
    (thumbTip.x - indexTip.x) ** 2 +
    (thumbTip.y - indexTip.y) ** 2 +
    (thumbTip.z - indexTip.z) ** 2
  );

  const time = Date.now() * 0.003;
  const closeness = Math.max(0, 1 - dist * 10);

  if (isPinching) {
    lineMat.color.setHex(0x00ffaa);
    midMat.color.setHex(0x00ffaa);
    lineMat.opacity = 0.9;
    midMat.opacity = 0.8 + Math.sin(time * 4) * 0.2;
    const pulseScale = 1.5 + Math.sin(time * 5) * 0.5;
    midpoint.scale.setScalar(pulseScale);
  } else {
    const lineColor = new THREE.Color();
    lineColor.lerpColors(new THREE.Color(0x4a9eff), new THREE.Color(0x00ffaa), closeness);
    lineMat.color.copy(lineColor);
    midMat.color.copy(lineColor);
    lineMat.opacity = 0.3 + closeness * 0.5;
    midMat.opacity = closeness * 0.6;
    midpoint.scale.setScalar(0.5 + closeness * 1.0);
  }
}
