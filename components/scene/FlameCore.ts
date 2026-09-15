import * as THREE from "three";
import { FlameShader } from "./shaders/fireShaders";

interface BrazierFlameSpec {
  x: number;
  y: number;
  z: number;
  scale: number;
  planeCount: number;
}

export class FlameCore {
  public group: THREE.Group;
  private flameMaterials: THREE.ShaderMaterial[] = [];
  private leftLight: THREE.PointLight;
  private rightLight: THREE.PointLight;
  private beamLight: THREE.PointLight;
  private coalsMesh: THREE.InstancedMesh;
  private coalCount: number;

  constructor() {
    this.group = new THREE.Group();
    // Origin in cavern world coordinates
    this.group.position.set(0, 0, 0);

    // Environmental Flanking Brazier Locations (Leaves central path completely clear)
    const brazierSpecs: BrazierFlameSpec[] = [
      { x: -3.4, y: 1.42, z: -2.4, scale: 1.15, planeCount: 4 }, // Left Foreground Roaring Brazier
      { x: 3.4, y: 1.42, z: -2.4, scale: 1.15, planeCount: 4 },  // Right Foreground Roaring Brazier
      { x: -4.6, y: 0.82, z: -5.5, scale: 0.85, planeCount: 3 }, // Left Midground Brazier
      { x: 4.6, y: 0.82, z: -5.5, scale: 0.85, planeCount: 3 },  // Right Midground Brazier
      { x: -5.8, y: 0.52, z: -8.5, scale: 0.65, planeCount: 2 }, // Left Distant Torch Altar
      { x: 5.8, y: 0.52, z: -8.5, scale: 0.65, planeCount: 2 },  // Right Distant Torch Altar
    ];

    // 1. Procedural Flame Volumes inside Each Brazier Bowl
    brazierSpecs.forEach((spec, bIdx) => {
      for (let p = 0; p < spec.planeCount; p++) {
        const rotY = (p / spec.planeCount) * Math.PI + (p * 0.35);
        const w = 0.85 * spec.scale;
        const h = 1.45 * spec.scale;

        const mat = new THREE.ShaderMaterial({
          vertexShader: FlameShader.vertexShader,
          fragmentShader: FlameShader.fragmentShader,
          uniforms: {
            uTime: { value: bIdx * 2.1 + p * 1.3 },
            uWind: { value: new THREE.Vector2(0, 0) },
            uProgress: { value: 0 },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });

        this.flameMaterials.push(mat);

        const geo = new THREE.PlaneGeometry(w, h, 10, 14);
        geo.translate(0, h / 2, 0);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          spec.x + (Math.random() - 0.5) * 0.08 * spec.scale,
          spec.y,
          spec.z + (Math.random() - 0.5) * 0.08 * spec.scale
        );
        mesh.rotation.y = rotY;
        this.group.add(mesh);
      }
    });

    // 2. Instanced Glowing Coals inside Brazier Bowls
    this.coalCount = brazierSpecs.length * 8;
    const coalGeo = new THREE.DodecahedronGeometry(0.12, 1);
    coalGeo.scale(1.2, 0.55, 1.1);
    const coalMat = new THREE.MeshBasicMaterial({
      color: 0xff3e00,
      transparent: true,
      opacity: 0,
    });

    this.coalsMesh = new THREE.InstancedMesh(coalGeo, coalMat, this.coalCount);
    const dummy = new THREE.Object3D();
    let coalIdx = 0;

    brazierSpecs.forEach((spec) => {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 1.2) * 0.38 * spec.scale;
        dummy.position.set(
          spec.x + Math.cos(angle) * dist,
          spec.y + 0.04 + Math.random() * 0.04,
          spec.z + Math.sin(angle) * dist
        );
        dummy.rotation.set(Math.random(), Math.random(), Math.random());
        const s = (Math.random() * 0.4 + 0.8) * spec.scale;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        this.coalsMesh.setMatrixAt(coalIdx++, dummy.matrix);
      }
    });
    this.coalsMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.coalsMesh);

    // 3. Environmental Dual Point Lights (Left & Right Flanking Braziers)
    this.leftLight = new THREE.PointLight(0xff5c0a, 0, 9.5, 2.0);
    this.leftLight.position.set(-3.4, 1.8, -2.4);
    this.group.add(this.leftLight);

    this.rightLight = new THREE.PointLight(0xff5c0a, 0, 9.5, 2.0);
    this.rightLight.position.set(3.4, 1.8, -2.4);
    this.group.add(this.rightLight);

    // 4. Distant Beam Point Light (Illuminating the central chasm)
    this.beamLight = new THREE.PointLight(0xff8811, 0, 22.0, 1.5);
    this.beamLight.position.set(0, 2.0, -17.0);
    this.group.add(this.beamLight);
  }

  public update(time: number, progress: number, windVec: THREE.Vector2) {
    this.flameMaterials.forEach((mat, i) => {
      mat.uniforms.uTime.value = time * (1.0 + (i % 5) * 0.06);
      mat.uniforms.uProgress.value = progress;
      mat.uniforms.uWind.value.lerp(windVec, 0.12);
    });

    // Asymmetric natural flame flickering
    const flickerL =
      1.0 +
      Math.sin(time * 8.2) * 0.08 +
      Math.sin(time * 16.5) * 0.04 +
      (Math.random() - 0.5) * 0.03;

    const flickerR =
      1.0 +
      Math.cos(time * 7.8) * 0.08 +
      Math.sin(time * 19.1) * 0.04 +
      (Math.random() - 0.5) * 0.03;

    const flickerBeam = 1.0 + Math.sin(time * 3.5) * 0.1;

    this.leftLight.intensity = progress * flickerL * 3.2;
    this.rightLight.intensity = progress * flickerR * 3.2;
    this.beamLight.intensity = progress * flickerBeam * 3.2;

    // Glowing coal beds breathe with incandescent heat
    (this.coalsMesh.material as THREE.MeshBasicMaterial).opacity =
      progress * (0.85 + Math.sin(time * 3.8) * 0.15);
  }

  public dispose() {
    this.flameMaterials.forEach((mat) => mat.dispose());
    (this.coalsMesh.material as THREE.Material).dispose();
    this.coalsMesh.geometry.dispose();
  }
}
