import * as THREE from "three";

export class InteractionField {
  public pointerNormalized: THREE.Vector2;
  public worldPointer: THREE.Vector3; // x, y, force
  public wind: THREE.Vector2; // Direct wind vector for flame bending
  private prevPointer: THREE.Vector2;
  private velocity: THREE.Vector2;
  private force: number;
  private isPointerDown: boolean;

  constructor() {
    this.pointerNormalized = new THREE.Vector2(0, 0);
    this.prevPointer = new THREE.Vector2(0, 0);
    this.velocity = new THREE.Vector2(0, 0);
    this.worldPointer = new THREE.Vector3(0, 0, 0);
    this.wind = new THREE.Vector2(0, 0);
    this.force = 0;
    this.isPointerDown = false;
  }

  public onPointerMove(clientX: number, clientY: number, width: number, height: number) {
    const nx = (clientX / width) * 2 - 1;
    const ny = -(clientY / height) * 2 + 1;

    this.pointerNormalized.set(nx, ny);

    const dx = nx - this.prevPointer.x;
    const dy = ny - this.prevPointer.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    this.velocity.set(dx, dy);

    // Aerodynamic wind force that bends the flame with touch/drag
    const sensitivity = this.isPointerDown ? 2.2 : 1.4;
    this.wind.x = Math.max(-1.5, Math.min(1.5, this.wind.x + dx * 8.0 * sensitivity));
    this.wind.y = Math.max(-1.5, Math.min(1.5, this.wind.y - dy * 6.0 * sensitivity));

    this.force = Math.min(this.force + speed * 5.0, 1.6);
    this.prevPointer.set(nx, ny);
  }

  public onPointerDown() {
    this.isPointerDown = true;
    this.force = 1.2;
  }

  public onPointerUp() {
    this.isPointerDown = false;
  }

  public update(camera: THREE.Camera) {
    // Smooth aerodynamic damping (settles naturally when interaction stops)
    this.wind.multiplyScalar(0.92);
    this.force *= 0.91;
    if (this.force < 0.005) this.force = 0;

    // Convert 2D screen coordinate to 3D world coordinates near hearth plane (z = -3.2)
    const vector = new THREE.Vector3(
      this.pointerNormalized.x,
      this.pointerNormalized.y,
      0.5
    );
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = (-3.2 - camera.position.z) / dir.z;
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance));

    this.worldPointer.set(targetPos.x, targetPos.y, this.force);
  }
}
