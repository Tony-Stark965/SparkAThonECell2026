import * as THREE from "three";

export class CameraRig {
  public camera: THREE.PerspectiveCamera;
  private targetPosition: THREE.Vector3;
  private targetLookAt: THREE.Vector3;
  private currentLookAt: THREE.Vector3;

  constructor(fov = 52, aspect = 1, near = 0.1, far = 60) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 0, 2.2);
    this.targetPosition = new THREE.Vector3(0, 0, 2.2);
    this.targetLookAt = new THREE.Vector3(0, -0.65, -3.2);
    this.currentLookAt = new THREE.Vector3(0, -0.65, -3.2);
  }

  public updateAspect(aspect: number) {
    this.camera.aspect = aspect;
    // On portrait mobile (e.g. 390px, aspect ~0.46), narrow FOV so cave depth and hearth stay perfectly composed
    if (aspect < 0.75) {
      this.camera.fov = 60;
    } else {
      this.camera.fov = 50;
    }
    this.camera.updateProjectionMatrix();
  }

  public update(
    time: number,
    progress: number, // 0 (start) to 1 (full cinematic reveal)
    pointerX: number, // Normalized -1 to 1
    pointerY: number
  ) {
    // 1. Cinematic forward dolly: Camera eases inward as the fire ignites
    // Progresses smoothly from 2.2 down to 0.9
    const baseZ = 2.2 - progress * 1.3;
    const baseY = 0.15 - progress * 0.25;

    // 2. Subtle living camera breathing
    const breathX = Math.sin(time * 0.5) * 0.02;
    const breathY = Math.cos(time * 0.38) * 0.025;

    // 3. Restrained, elegant parallax from pointer/touch
    const parallaxX = pointerX * 0.28;
    const parallaxY = -pointerY * 0.2;

    this.targetPosition.set(
      parallaxX + breathX,
      baseY + parallaxY + breathY,
      baseZ
    );

    // Smooth dampening (lerp)
    this.camera.position.lerp(this.targetPosition, 0.045);

    // Target look-at stays locked on the small hearth fire
    this.targetLookAt.set(parallaxX * 0.2, -0.75 + parallaxY * 0.15, -3.2);
    this.currentLookAt.lerp(this.targetLookAt, 0.05);
    this.camera.lookAt(this.currentLookAt);
  }
}
