import * as THREE from "three";

export type WorldAct =
  | "IGNITION"
  | "HERO"
  | "TRANSITION"
  | "TERRITORIES"
  | "ARENA"
  | "BOUNTY"
  | "FLOW"

  | "REGISTER";

export class CameraJourneyRig {
  public camera: THREE.PerspectiveCamera;
  private currentPos: THREE.Vector3;
  private targetPos: THREE.Vector3;
  private currentLookAt: THREE.Vector3;
  private targetLookAt: THREE.Vector3;

  constructor(fov = 52, aspect = 1, near = 0.1, far = 70) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.currentPos = new THREE.Vector3(0, 0.15, 2.2);
    this.targetPos = new THREE.Vector3(0, 0.15, 2.2);
    this.currentLookAt = new THREE.Vector3(0, -0.65, -3.2);
    this.targetLookAt = new THREE.Vector3(0, -0.65, -3.2);
    this.camera.position.copy(this.currentPos);
  }

  public updateAspect(aspect: number) {
    this.camera.aspect = aspect;
    // Portrait mobile calibration (e.g. 390px / 430px)
    if (aspect < 0.75) {
      this.camera.fov = 60;
    } else {
      this.camera.fov = 50;
    }
    this.camera.updateProjectionMatrix();
  }

  public update(
    time: number,
    act: WorldAct,
    heroProgress: number, // 0 to 1 during Hero sequence
    pointerX: number,
    pointerY: number,
    scrollProgress: number = 0
  ) {
    // 1. Living camera breathing
    const breathX = Math.sin(time * 0.5) * 0.016;
    const breathY = Math.cos(time * 0.38) * 0.020;

    // 2. Parallax from touch/mouse
    const parallaxX = pointerX * 0.22;
    const parallaxY = -pointerY * 0.16;

    // 3. Continuous Scroll-Driven 3D World Journey Trajectory
    // Responsive First • Smooth Second • Cinematic Third
    const s = Math.max(0, Math.min(1, scrollProgress));

    const basePathX = 0;
    let basePathY = 0.18;
    let basePathZ = 1.8 - heroProgress * 0.8;
    const baseLookAtX = 0;
    let baseLookAtY = 0.45;
    let baseLookAtZ = -14.5;

    if (s <= 0.14) {
      // ACT I / II: HEARTH & HERO — Glides down the grand wet flagstone path towards the basalt arch
      const t = s / 0.14;
      basePathY = THREE.MathUtils.lerp(0.18 - heroProgress * 0.08, -0.05, t);
      basePathZ = THREE.MathUtils.lerp(1.8 - heroProgress * 0.8, -0.6, t);
      baseLookAtY = THREE.MathUtils.lerp(0.45, 0.1, t);
      baseLookAtZ = THREE.MathUtils.lerp(-14.5, -10.0, t);
    } else if (s <= 0.28) {
      // ACT IV: SECTORS — Dollying into the subterranean cavern chamber, past glowing monoliths
      const t = (s - 0.14) / 0.14;
      basePathY = THREE.MathUtils.lerp(-0.05, -0.25, t);
      basePathZ = THREE.MathUtils.lerp(-0.6, -2.2, t);
      baseLookAtY = THREE.MathUtils.lerp(0.1, -0.65, t);
      baseLookAtZ = THREE.MathUtils.lerp(-10.0, -5.5, t);
    } else if (s <= 0.44) {
      // ACT V: THE ARENA — Elevates smoothly to overlook the evaluation steles
      const t = (s - 0.28) / 0.16;
      basePathY = THREE.MathUtils.lerp(-0.25, 0.38, t);
      basePathZ = THREE.MathUtils.lerp(-2.2, -1.8, t);
      baseLookAtY = THREE.MathUtils.lerp(-0.65, -0.5, t);
      baseLookAtZ = THREE.MathUtils.lerp(-5.5, -5.0, t);
    } else if (s <= 0.60) {
      // ACT VI: THE BOUNTY — Dollying forward to frame the unsealed prize vault
      const t = (s - 0.44) / 0.16;
      basePathY = THREE.MathUtils.lerp(0.38, 0.12, t);
      basePathZ = THREE.MathUtils.lerp(-1.8, -1.5, t);
      baseLookAtY = THREE.MathUtils.lerp(-0.5, -0.2, t);
      baseLookAtZ = THREE.MathUtils.lerp(-5.0, -4.2, t);
    } else if (s <= 0.74) {
      // ACT VII: THE FLOW — Elevated ceremonial viewpoint along the journey timeline
      const t = (s - 0.60) / 0.14;
      basePathY = THREE.MathUtils.lerp(0.12, 0.24, t);
      basePathZ = THREE.MathUtils.lerp(-1.5, -1.0, t);
      baseLookAtY = THREE.MathUtils.lerp(-0.2, -0.38, t);
      baseLookAtZ = THREE.MathUtils.lerp(-4.2, -4.5, t);
    } else if (s <= 0.88) {
      // Transition zone (Flow → Register)
      const t = (s - 0.74) / 0.14;
      basePathY = THREE.MathUtils.lerp(0.24, 0.34, t);
      basePathZ = THREE.MathUtils.lerp(-1.0, -0.7, t);
      baseLookAtY = THREE.MathUtils.lerp(-0.38, -0.22, t);
      baseLookAtZ = THREE.MathUtils.lerp(-4.5, -5.2, t);
    } else {
      // ACT IX: REGISTRATION CHAMBER — Grounded ceremonial viewpoint
      const t = (s - 0.88) / 0.12;
      basePathY = THREE.MathUtils.lerp(0.34, 0.2, t);
      basePathZ = THREE.MathUtils.lerp(-0.7, -0.5, t);
      baseLookAtY = -0.35;
      baseLookAtZ = -4.5;
    }

    this.targetPos.set(basePathX + parallaxX + breathX, basePathY + parallaxY + breathY, basePathZ);
    this.targetLookAt.set(baseLookAtX + parallaxX * 0.2, baseLookAtY + parallaxY * 0.12, baseLookAtZ);

    // Fast, responsive tracking with crisp cinematic settling:
    // Lerp factor 0.14 provides immediate response while retaining smooth camera damping
    this.currentPos.lerp(this.targetPos, 0.14);
    this.currentLookAt.lerp(this.targetLookAt, 0.14);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }
}
