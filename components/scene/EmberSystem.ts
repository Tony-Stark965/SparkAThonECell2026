import * as THREE from "three";
import { EmberShader } from "./shaders/fireShaders";

export class EmberSystem {
  public points: THREE.Points;
  private material: THREE.ShaderMaterial;
  private count: number;

  constructor(isMobile: boolean, pixelRatio: number) {
    // Crisp, atmospheric spark count: sparks rising from the central hearth, braziers, and fissures
    this.count = isMobile ? 240 : 480;

    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const lives = new Float32Array(this.count);
    const speeds = new Float32Array(this.count);
    const offsets = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // Disperse ember emissions naturally from the left and right flanking braziers and rock fissures
      const emitterRoll = Math.random();
      let emitX = -3.4;
      let emitY = 1.4;
      let emitZ = -2.4;

      if (emitterRoll < 0.46) {
        // Left Foreground Roaring Brazier
        emitX = -3.4 + (Math.random() - 0.5) * 0.5;
        emitY = 1.42 + Math.random() * 0.3;
        emitZ = -2.4 + (Math.random() - 0.5) * 0.5;
      } else if (emitterRoll < 0.92) {
        // Right Foreground Roaring Brazier
        emitX = 3.4 + (Math.random() - 0.5) * 0.5;
        emitY = 1.42 + Math.random() * 0.3;
        emitZ = -2.4 + (Math.random() - 0.5) * 0.5;
      } else {
        // Midground Braziers & Side Basalt Fissures
        const side = Math.random() > 0.5 ? 1 : -1;
        emitX = side * (4.6 + Math.random() * 1.5);
        emitY = 0.8 + Math.random() * 0.4;
        emitZ = -5.5 - Math.random() * 3.0;
      }

      positions[i3] = emitX;
      positions[i3 + 1] = emitY;
      positions[i3 + 2] = emitZ;

      // Fine spark sizing: small, crisp points of light
      sizes[i] = Math.random() * 3.5 + 1.2;

      lives[i] = Math.random(); // Initial life phase 0 to 1
      speeds[i] = Math.random() * 0.7 + 0.6;

      offsets[i3] = Math.random() * 10.0;
      offsets[i3 + 1] = Math.random() * 10.0;
      offsets[i3 + 2] = Math.random() * 10.0;

      // Realistic fire spark temperature
      const roll = Math.random();
      if (roll > 0.88) {
        // Occasional hot white-gold spark
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.94;
        colors[i3 + 2] = 0.75;
      } else if (roll > 0.4) {
        // Bright flame amber
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.52;
        colors[i3 + 2] = 0.08;
      } else {
        // Deep glowing coal crimson
        colors[i3] = 0.85;
        colors[i3 + 1] = 0.20;
        colors[i3 + 2] = 0.02;
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(lives, 1));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.ShaderMaterial({
      vertexShader: EmberShader.vertexShader,
      fragmentShader: EmberShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uPointer: { value: new THREE.Vector3(0, 0, 0) },
        uProgress: { value: 0 },
        uPixelRatio: { value: Math.min(pixelRatio, 2) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
  }

  public update(
    time: number,
    intensity: number,
    progress: number,
    pointerVec: THREE.Vector3
  ) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uIntensity.value = intensity;
    this.material.uniforms.uProgress.value = progress;
    this.material.uniforms.uPointer.value.copy(pointerVec);
  }

  public setPixelRatio(dpr: number) {
    this.material.uniforms.uPixelRatio.value = Math.min(dpr, 2);
  }

  public dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
