import * as THREE from 'three';
import { MORPH_SECONDS, easeInOutCubic, halfHeight, mixInto } from './morph';

// The particle cloud, drawn as one THREE.Points object.
//
// Until November 2026 every particle was moved on the CPU each frame and the
// whole position buffer was uploaded again. Now the template positions are
// uploaded once and the GPU does the per-particle work in the vertex shader:
// the gentle jitter, the twinkle, the morph between templates, gradient
// colours and the force field. The material is still a PointsMaterial, patched
// with onBeforeCompile, so size attenuation, the soft round sprite, opacity
// and additive blending are exactly what they were.
//
// Scale and rotation are the object's own transform: (position + jitter) is
// scaled, then rotated, in the same order the CPU version used.

const JITTER = 0.02; // how far each particle wanders from its place, in scene units
const BASE_SIZE = 0.03; // the size pulsing is measured against

export const DENSITY_MIN = 5000;
export const DENSITY_MAX = 100000;
export const DENSITY_STEP = 5000;
export const SIZE_MIN = 0.01;
export const SIZE_MAX = 0.1;
export const SCALE_MAX = 8;

/** Force field reach, in scene units, and how far it pushes at the centre. */
export const FORCE_RADIUS = 1.1;
export const FORCE_PUSH = 0.75;

function spriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
  }
  return new THREE.CanvasTexture(canvas);
}

export class ParticleSystem {
  private readonly points: THREE.Points;
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material: THREE.PointsMaterial;
  private readonly uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 1 },
    uHalfHeight: { value: 2 },
    uGradient: { value: 0 },
    uColorA: { value: new THREE.Color('#ffffff') },
    uColorB: { value: new THREE.Color('#ffffff') },
    uForcePos: { value: new THREE.Vector3() },
    uForce: { value: 0 },
    uForceRadius: { value: FORCE_RADIUS },
    uForcePush: { value: FORCE_PUSH },
  };

  private count = 0;
  private target = new Float32Array(0); // where the particles are heading
  private from = new Float32Array(0); // where the current morph started
  private morphStart = -Infinity;
  private readonly clockStart = performance.now();

  private targetScale = 1;
  private currentScale = 1;
  private readonly targetRotation = new THREE.Euler();
  private readonly currentRotation = new THREE.Euler();
  private targetSize = BASE_SIZE;
  private pulsateIntensity = 0;
  private autoRotateSpeed = 0;
  private forceTarget = 0;
  private reduceMotion = false;

  constructor() {
    this.material = new THREE.PointsMaterial({
      size: BASE_SIZE,
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      map: spriteTexture(),
      vertexColors: true,
    });
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uTime, uMorph, uHalfHeight, uGradient, uForce, uForceRadius, uForcePush;
uniform vec3 uColorA, uColorB, uForcePos;
attribute vec3 aFrom, aOffset, aSpeed;
attribute vec2 aGlow;`
        )
        .replace(
          '#include <begin_vertex>',
          `vec3 transformed = mix(aFrom, position, uMorph);
// a soft burst in the middle of a morph
transformed += sin(aOffset * 3.0) * sin(uMorph * PI) * 0.35;
// the gentle jitter every particle always has
transformed += sin(uTime * aSpeed + aOffset) * ${JITTER.toFixed(3)};`
        )
        .replace(
          '#include <color_vertex>',
          `#include <color_vertex>
float glow = 0.2 + 0.8 * (sin(uTime * aGlow.y + aGlow.x) + 1.0) * 0.5;
float heightT = clamp(mix(aFrom.y, position.y, uMorph) / (2.0 * uHalfHeight) + 0.5, 0.0, 1.0);
vec3 tint = mix(vec3(1.0), mix(uColorA, uColorB, heightT), uGradient);
vColor *= glow * tint;`
        )
        .replace(
          '#include <project_vertex>',
          `vec4 worldPosition4 = modelMatrix * vec4(transformed, 1.0);
vec2 away = worldPosition4.xy - uForcePos.xy;
float d = length(away);
float push = uForce * uForcePush * smoothstep(uForceRadius, 0.0, d);
worldPosition4.xy += (d > 1e-4 ? away / d : vec2(0.0)) * push;
vec4 mvPosition = viewMatrix * worldPosition4;
gl_Position = projectionMatrix * mvPosition;`
        );
    };
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  /** Shows a new set of positions. With `morph`, the particles travel there from where they are. */
  setTemplate(positions: Float32Array, { morph = true }: { morph?: boolean } = {}): void {
    const count = positions.length / 3;
    if (count !== this.count) {
      this.rebuild(positions);
      return;
    }
    // start from wherever the particles are right now, even mid-morph
    const now = this.morphProgress();
    this.from = now < 1 ? mixInto(new Float32Array(this.target.length), this.from, this.target, now) : this.target;
    this.target = positions;
    this.geometry.setAttribute('aFrom', new THREE.BufferAttribute(this.from, 3));
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.target, 3));
    this.uniforms.uHalfHeight.value = halfHeight(positions);
    this.morphStart = morph && !this.reduceMotion ? this.seconds() : -Infinity;
  }

  /** A new particle count: every per-particle attribute is made again at the new size. */
  private rebuild(positions: Float32Array): void {
    const count = positions.length / 3;
    this.count = count;
    this.target = positions;
    this.from = positions;
    const offsets = new Float32Array(count * 3);
    const speeds = new Float32Array(count * 3);
    const glow = new Float32Array(count * 2);
    for (let i = 0; i < count * 3; i++) {
      offsets[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.5 + Math.random() * 1.5;
    }
    for (let i = 0; i < count; i++) {
      glow[i * 2] = Math.random() * Math.PI * 2; // phase
      glow[i * 2 + 1] = 0.8 + Math.random() * 1.8; // speed
    }
    const g = this.geometry;
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aFrom', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 3));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 3));
    g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 2));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3));
    this.uniforms.uHalfHeight.value = halfHeight(positions);
    this.morphStart = -Infinity;
  }

  setColor(color: string): void {
    this.uniforms.uGradient.value = 0;
    this.material.color.set(color);
  }

  setGradient(from: string, to: string): void {
    this.uniforms.uGradient.value = 1;
    this.uniforms.uColorA.value.set(from);
    this.uniforms.uColorB.value.set(to);
    this.material.color.set('#ffffff');
  }

  setTargetScale(scale: number): void {
    this.targetScale = Math.max(0, Math.min(SCALE_MAX, scale));
  }

  getTargetScale(): number {
    return this.targetScale;
  }

  setTargetRotation(x: number, y: number, z: number): void {
    this.targetRotation.set(x, y, z);
  }

  /** Turns the target rotation by a small amount (pointer drag). */
  nudgeRotation(dx: number, dy: number): void {
    this.targetRotation.set(this.targetRotation.x + dx, this.targetRotation.y + dy, this.targetRotation.z);
  }

  resetView(): void {
    this.targetScale = 1;
    this.targetRotation.set(0, 0, 0);
  }

  setSize(size: number): void {
    this.targetSize = Math.max(SIZE_MIN, Math.min(SIZE_MAX, size));
  }

  setOpacity(opacity: number): void {
    this.material.opacity = Math.max(0, Math.min(1, opacity));
  }

  setPulsateIntensity(intensity: number): void {
    this.pulsateIntensity = Math.max(0, Math.min(1, intensity));
  }

  setAutoRotateSpeed(speed: number): void {
    this.autoRotateSpeed = speed;
  }

  setReduceMotion(reduce: boolean): void {
    this.reduceMotion = reduce;
  }

  /** Where the force field is, in scene units on the z = 0 plane, or null to let it fade out. */
  setForce(position: { x: number; y: number } | null): void {
    if (position) this.uniforms.uForcePos.value.set(position.x, position.y, 0);
    this.forceTarget = position ? 1 : 0;
  }

  update(): void {
    // the same easing as before: a tenth of the way there each frame
    this.currentScale += (this.targetScale - this.currentScale) * 0.1;

    if (this.autoRotateSpeed !== 0) {
      this.currentRotation.y += this.autoRotateSpeed * 0.01;
    } else {
      this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
      this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;
      this.currentRotation.z += (this.targetRotation.z - this.currentRotation.z) * 0.1;
    }
    this.points.scale.setScalar(this.currentScale);
    this.points.rotation.copy(this.currentRotation);

    this.material.size = this.targetSize + BASE_SIZE * 0.5 * Math.sin(Date.now() * 0.003) * this.pulsateIntensity;

    this.uniforms.uTime.value = this.reduceMotion ? 0 : this.seconds();
    this.uniforms.uMorph.value = easeInOutCubic(this.morphProgress());
    this.uniforms.uForce.value += (this.forceTarget - this.uniforms.uForce.value) * 0.12;
  }

  getMesh(): THREE.Points {
    return this.points;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.map?.dispose();
    this.material.dispose();
  }

  private seconds(): number {
    return (performance.now() - this.clockStart) / 1000;
  }

  private morphProgress(): number {
    return Math.min(1, (this.seconds() - this.morphStart) / MORPH_SECONDS);
  }
}
