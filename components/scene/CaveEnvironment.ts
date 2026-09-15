import * as THREE from "three";
import {
  CaveWallShader,
  WetStoneFloorShader,
  CelestialSpireShader,
  AncientApertureShader,
  GroundFogShader,
} from "./shaders/fireShaders";

export class CaveEnvironment {
  public group: THREE.Group;
  private wallMaterial: THREE.ShaderMaterial;
  private floorMaterial: THREE.ShaderMaterial;
  private spireMaterial: THREE.ShaderMaterial;
  private ringMaterial: THREE.ShaderMaterial;
  private fogMaterial: THREE.ShaderMaterial;
  private bannerMaterial: THREE.MeshBasicMaterial;
  private slabMaterial: THREE.MeshBasicMaterial;
  private floatingRocks: THREE.Mesh[] = [];
  private floatingRockOffsets: number[] = [];
  private texturesToDispose: THREE.Texture[] = [];

  constructor() {
    this.group = new THREE.Group();

    // Brazier and beam coordinates in world space
    const leftBrazierPos = new THREE.Vector3(-3.4, 0.9, -2.4);
    const rightBrazierPos = new THREE.Vector3(3.4, 0.9, -2.4);
    const beamPos = new THREE.Vector3(0, 2.0, -18.0);
    const fireColor = new THREE.Vector3(1.0, 0.44, 0.08);

    // 1. Rock wall shader material
    this.wallMaterial = new THREE.ShaderMaterial({
      vertexShader: CaveWallShader.vertexShader,
      fragmentShader: CaveWallShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uLeftBrazierPos: { value: leftBrazierPos },
        uRightBrazierPos: { value: rightBrazierPos },
        uFirePos: { value: new THREE.Vector3(0, -0.9, -3.2) },
        uFireColor: { value: fireColor },
        uFireIntensity: { value: 0 },
      },
      side: THREE.DoubleSide,
    });

    // 2. Wet stone floor shader material
    this.floorMaterial = new THREE.ShaderMaterial({
      vertexShader: WetStoneFloorShader.vertexShader,
      fragmentShader: WetStoneFloorShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uLeftBrazierPos: { value: leftBrazierPos },
        uRightBrazierPos: { value: rightBrazierPos },
        uBeamPos: { value: beamPos },
        uFirePos: { value: new THREE.Vector3(0, -0.9, -3.2) },
        uFireColor: { value: fireColor },
        uFireIntensity: { value: 0 },
      },
      side: THREE.FrontSide,
    });

    // 3. Celestial spire light beam material
    this.spireMaterial = new THREE.ShaderMaterial({
      vertexShader: CelestialSpireShader.vertexShader,
      fragmentShader: CelestialSpireShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    // 4. Colossal Ancient Aperture material
    this.ringMaterial = new THREE.ShaderMaterial({
      vertexShader: AncientApertureShader.vertexShader,
      fragmentShader: AncientApertureShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    // 5. Low-lying ground fog material
    this.fogMaterial = new THREE.ShaderMaterial({
      vertexShader: GroundFogShader.vertexShader,
      fragmentShader: GroundFogShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    // 6. Procedural Banner & Monolith Inscriptions
    const bannerTex = this.createBannerTexture();
    this.texturesToDispose.push(bannerTex);
    this.bannerMaterial = new THREE.MeshBasicMaterial({
      map: bannerTex,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const slabTex = this.createSlabTexture();
    this.texturesToDispose.push(slabTex);
    this.slabMaterial = new THREE.MeshBasicMaterial({
      map: slabTex,
      transparent: true,
      side: THREE.FrontSide,
    });

    this.buildCavernScene();
  }

  private createBannerTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    // Dark weathered canvas cloth
    ctx.fillStyle = "#0c0a08";
    ctx.fillRect(0, 0, 512, 1024);

    // Weathered canvas fiber noise
    ctx.fillStyle = "rgba(255, 180, 80, 0.03)";
    for (let i = 0; i < 2400; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 1024, 2, 2);
    }

    // Outer border
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, 456, 968);

    // Inner diamond star emblem
    ctx.save();
    ctx.translate(256, 180);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(45, 0);
    ctx.lineTo(0, 60);
    ctx.lineTo(-45, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 160, 20, 0.25)";
    ctx.fill();

    // Internal star cross
    ctx.beginPath();
    ctx.moveTo(0, -75);
    ctx.lineTo(0, 75);
    ctx.moveTo(-55, 0);
    ctx.lineTo(55, 0);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Chiseled expedition creed typography
    ctx.fillStyle = "#f3f4f6";
    ctx.font = "bold 44px monospace";
    ctx.textAlign = "center";
    ctx.letterSpacing = "6px";

    ctx.fillText("EXPLORE", 256, 420);
    ctx.fillText("BUILD", 256, 510);
    ctx.fillText("INNOVATE", 256, 600);
    ctx.fillText("TOGETHER", 256, 690);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private createSlabTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    // Dark obsidian/basalt slab
    ctx.fillStyle = "#0a0806";
    ctx.fillRect(0, 0, 512, 1024);

    // Weathered rock cracks
    ctx.strokeStyle = "rgba(255, 120, 20, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(120, 300);
    ctx.lineTo(90, 600);
    ctx.lineTo(180, 1024);
    ctx.stroke();

    // Engraved glowing amber runic typography
    ctx.fillStyle = "#ffb03a";
    ctx.shadowColor = "rgba(255, 120, 0, 0.8)";
    ctx.shadowBlur = 18;
    ctx.font = "900 48px monospace";
    ctx.textAlign = "center";
    ctx.letterSpacing = "8px";

    ctx.fillText("IDEAS", 256, 380);
    ctx.fillText("LIGHT", 256, 480);
    ctx.fillText("THE NEXT", 256, 580);
    ctx.fillText("FRONTIER", 256, 680);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private buildCavernScene() {
    // A. Massive Foreground Cavern Arch Framing & Overhangs
    const archGeo = new THREE.TorusGeometry(4.2, 1.6, 16, 32, Math.PI);
    archGeo.rotateZ(Math.PI);
    archGeo.translate(0, 1.2, -0.4);

    const archPos = archGeo.attributes.position;
    for (let i = 0; i < archPos.count; i++) {
      const x = archPos.getX(i);
      const y = archPos.getY(i);
      const z = archPos.getZ(i);
      const displace =
        Math.sin(x * 2.2 + y * 1.8) * 0.32 +
        Math.cos(y * 2.5 + z * 2.8) * 0.25;
      archPos.setXYZ(i, x + displace * 0.7, y + displace * 0.8, z + displace * 0.6);
    }
    archGeo.computeVertexNormals();
    const archMesh = new THREE.Mesh(archGeo, this.wallMaterial);
    this.group.add(archMesh);

    // Left & Right Flanking Jagged Crag Clusters (Deep framing entering the frame)
    this.createCragWallCluster(-4.8, 0.8, -1.8, -1);
    this.createCragWallCluster(4.8, 0.8, -1.8, 1);

    // B. Wet Reflective Cavern Ground Plane
    const floorGeo = new THREE.PlaneGeometry(24, 32, 40, 40);
    floorGeo.rotateX(-Math.PI / 2);
    floorGeo.translate(0, -1.42, -9.0);

    const floorPos = floorGeo.attributes.position;
    for (let i = 0; i < floorPos.count; i++) {
      const x = floorPos.getX(i);
      const z = floorPos.getZ(i);
      // Gentle slope down to center path
      const centerDist = Math.abs(x);
      const gutter = centerDist < 2.0 ? -0.08 * (1.0 - centerDist / 2.0) : 0;
      const rockDisplace =
        Math.sin(x * 1.6) * 0.12 +
        Math.cos(z * 1.2) * 0.11 +
        Math.sin(x * 3.2 + z * 2.2) * 0.04;
      floorPos.setY(i, floorPos.getY(i) + rockDisplace + gutter);
    }
    floorGeo.computeVertexNormals();
    const floorMesh = new THREE.Mesh(floorGeo, this.floorMaterial);
    this.group.add(floorMesh);

    // C. The Grand Wet Basalt Stepping Flagstone Path (Leading straight forward into the chasm)
    // Slabs are completely open down the center — NO central campfire or blocking objects
    const pathZStops = [-0.6, -1.8, -3.1, -4.5, -6.0, -7.5, -9.0, -10.5, -12.2, -14.0];
    pathZStops.forEach((z, idx) => {
      const width = 2.4 - idx * 0.08;
      const slabGeo = new THREE.BoxGeometry(width, 0.12, 0.95);
      const sPos = slabGeo.attributes.position;
      for (let i = 0; i < sPos.count; i++) {
        const px = sPos.getX(i);
        const py = sPos.getY(i);
        const pz = sPos.getZ(i);
        const rough = (Math.random() - 0.5) * 0.04;
        sPos.setXYZ(i, px + rough, py + rough, pz + rough);
      }
      slabGeo.computeVertexNormals();
      const slab = new THREE.Mesh(slabGeo, this.floorMaterial);
      slab.position.set((Math.random() - 0.5) * 0.12, -1.34, z);
      this.group.add(slab);
    });

    // D. Left Flanking Carved Monolith Pillar with Roaring Fire Brazier & Expedition Banner
    this.createPillarWithBrazier(-3.4, -1.35, -2.4, 0.55, 2.4);

    // Expedition Banner beside left pillar
    const bannerGeo = new THREE.PlaneGeometry(1.1, 2.3);
    const bannerMesh = new THREE.Mesh(bannerGeo, this.bannerMaterial);
    bannerMesh.position.set(-3.75, 0.45, -2.15);
    bannerMesh.rotation.set(0, 0.35, -0.04);
    this.group.add(bannerMesh);

    // E. Right Flanking Carved Monolith Pillar with Brazier & Cracked Rune Monolith Slab
    this.createPillarWithBrazier(3.4, -1.35, -2.4, 0.55, 2.4);

    // Cracked Inscribed Monolith Slab beside right pillar
    const slabGeo = new THREE.BoxGeometry(1.2, 2.5, 0.28);
    const slabPos = slabGeo.attributes.position;
    for (let i = 0; i < slabPos.count; i++) {
      const py = slabPos.getY(i);
      const rough = Math.sin(py * 4.0) * 0.06;
      slabPos.setX(i, slabPos.getX(i) + rough);
    }
    slabGeo.computeVertexNormals();
    const slabMesh = new THREE.Mesh(slabGeo, this.slabMaterial);
    slabMesh.position.set(3.85, 0.35, -2.25);
    slabMesh.rotation.set(0.08, -0.38, 0.05);
    this.group.add(slabMesh);

    // F. Staggered Midground Flanking Braziers (Giving deep atmospheric perspective)
    this.createPillarWithBrazier(-4.6, -1.35, -5.5, 0.42, 1.8);
    this.createPillarWithBrazier(4.6, -1.35, -5.5, 0.42, 1.8);
    this.createPillarWithBrazier(-5.8, -1.35, -8.5, 0.36, 1.5);
    this.createPillarWithBrazier(5.8, -1.35, -8.5, 0.36, 1.5);

    // G. Towering Mountain Spires Flanking Central Chasm
    const spireConfigs = [
      [-2.8, 1.2, -15.5, 1.6, 9.5],
      [2.7, 1.1, -15.2, 1.5, 9.2],
      [-4.6, 0.8, -14.2, 2.2, 8.5],
      [4.5, 0.9, -14.0, 2.1, 8.4],
      [-1.6, 1.8, -17.2, 1.3, 10.5],
      [1.5, 1.7, -16.8, 1.2, 10.2],
      [-6.5, 0.0, -11.5, 2.4, 7.5],
      [6.4, 0.0, -11.8, 2.3, 7.4],
    ];

    spireConfigs.forEach(([x, y, z, r, h]) => {
      const spireGeo = new THREE.ConeGeometry(r, h, 8);
      const sPos = spireGeo.attributes.position;
      for (let i = 0; i < sPos.count; i++) {
        const px = sPos.getX(i);
        const py = sPos.getY(i);
        const pz = sPos.getZ(i);
        const noise = Math.sin(px * 1.6 + py * 0.9) * 0.28;
        sPos.setXYZ(i, px + noise, py, pz + noise);
      }
      spireGeo.computeVertexNormals();
      const spire = new THREE.Mesh(spireGeo, this.wallMaterial);
      spire.position.set(x, y, z);
      spire.rotation.y = Math.random() * Math.PI;
      this.group.add(spire);
    });

    // H. Colossal Ancient Aperture Structure Floating in Deep Background
    const apertureCenter = new THREE.Vector3(0, 5.0, -18.5);

    // Outer Saucer Ring
    const outerRingGeo = new THREE.TorusGeometry(4.8, 0.36, 20, 56);
    const outerRing = new THREE.Mesh(outerRingGeo, this.ringMaterial);
    outerRing.position.copy(apertureCenter);
    outerRing.rotation.set(0.12, 0.0, 0);
    this.group.add(outerRing);

    // Inner Concentric Energy Ring
    const innerRingGeo = new THREE.TorusGeometry(3.0, 0.22, 16, 48);
    const innerRing = new THREE.Mesh(innerRingGeo, this.ringMaterial);
    innerRing.position.copy(apertureCenter);
    innerRing.rotation.set(0.12, 0.0, 0);
    this.group.add(innerRing);

    // Core Aperture Halo Ring
    const coreRingGeo = new THREE.TorusGeometry(1.6, 0.14, 16, 36);
    const coreRing = new THREE.Mesh(coreRingGeo, this.ringMaterial);
    coreRing.position.copy(apertureCenter);
    coreRing.rotation.set(0.12, 0.0, 0);
    this.group.add(coreRing);

    // Structural Ancient Support Monoliths & Anchors
    const strutGeo = new THREE.BoxGeometry(0.24, 7.5, 0.24);
    const strutL = new THREE.Mesh(strutGeo, this.wallMaterial);
    strutL.position.set(-2.6, 4.2, -18.2);
    strutL.rotation.z = Math.PI / 5;
    this.group.add(strutL);

    const strutR = new THREE.Mesh(strutGeo, this.wallMaterial);
    strutR.position.set(2.6, 4.2, -18.2);
    strutR.rotation.z = -Math.PI / 5;
    this.group.add(strutR);

    // I. Powerful Vertical Energy Beam Shooting Down into Mountain Chasm
    // Double-plane crossed volumetric beam from y = 5.2 down to y = -1.2
    const beamGeo1 = new THREE.PlaneGeometry(2.8, 6.8);
    const beamMesh1 = new THREE.Mesh(beamGeo1, this.spireMaterial);
    beamMesh1.position.set(0, 2.0, -18.0);
    this.group.add(beamMesh1);

    const beamGeo2 = new THREE.PlaneGeometry(2.8, 6.8);
    beamGeo2.rotateY(Math.PI / 2);
    const beamMesh2 = new THREE.Mesh(beamGeo2, this.spireMaterial);
    beamMesh2.position.set(0, 2.0, -18.0);
    this.group.add(beamMesh2);

    // J. Suspended Anti-Gravity Basalt Monoliths
    const floatCoords = [
      [-2.4, 2.8, -9.0, 0.65],
      [2.5, 3.0, -9.5, 0.70],
      [-1.4, 3.6, -11.0, 0.50],
      [1.6, 3.8, -11.5, 0.55],
      [-3.8, 2.2, -7.5, 0.75],
      [3.7, 2.4, -8.0, 0.70],
      [-0.8, 4.6, -14.5, 0.85],
      [0.9, 4.8, -15.0, 0.80],
    ];

    floatCoords.forEach(([x, y, z, scale], idx) => {
      const rockGeo = new THREE.DodecahedronGeometry(scale, 1);
      rockGeo.scale(1.1, 1.6, 0.9);
      const rockMesh = new THREE.Mesh(rockGeo, this.wallMaterial);
      rockMesh.position.set(x, y, z);
      rockMesh.rotation.set(Math.random(), Math.random(), Math.random());
      this.group.add(rockMesh);
      this.floatingRocks.push(rockMesh);
      this.floatingRockOffsets.push(idx * 0.85);
    });

    // K. Low-Lying Ground Mist / Fog Plane
    const fogGeo = new THREE.PlaneGeometry(22, 30);
    fogGeo.rotateX(-Math.PI / 2);
    const fogMesh = new THREE.Mesh(fogGeo, this.fogMaterial);
    fogMesh.position.set(0, -1.18, -8.0);
    this.group.add(fogMesh);
  }

  private createCragWallCluster(x: number, y: number, z: number, side: number) {
    const cluster = new THREE.Group();
    cluster.position.set(x, y, z);

    for (let i = 0; i < 4; i++) {
      const geo = new THREE.DodecahedronGeometry(1.4 + Math.random() * 0.8, 1);
      geo.scale(1.2, 2.2, 1.4);
      const mesh = new THREE.Mesh(geo, this.wallMaterial);
      mesh.position.set(
        side * (i * 0.4 + Math.random() * 0.3),
        (i - 1.5) * 1.3,
        (Math.random() - 0.5) * 0.6
      );
      mesh.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      cluster.add(mesh);
    }

    this.group.add(cluster);
  }

  private createPillarWithBrazier(x: number, y: number, z: number, r: number, h: number) {
    // 1. Weathered Stone Pillar Shaft
    const pillarGeo = new THREE.BoxGeometry(r * 2, h, r * 2);
    pillarGeo.translate(0, h / 2, 0);
    const pillar = new THREE.Mesh(pillarGeo, this.wallMaterial);
    pillar.position.set(x, y, z);
    this.group.add(pillar);

    // 2. Heavy Carved Capital / Pedestal Collar
    const capitalGeo = new THREE.BoxGeometry(r * 2.4, 0.25, r * 2.4);
    capitalGeo.translate(0, h + 0.1, 0);
    const capital = new THREE.Mesh(capitalGeo, this.wallMaterial);
    capital.position.set(x, y, z);
    this.group.add(capital);

    // 3. Basalt Brazier Bowl
    const bowlGeo = new THREE.CylinderGeometry(r * 1.5, r * 1.0, 0.35, 14);
    bowlGeo.translate(0, h + 0.35, 0);
    const bowl = new THREE.Mesh(bowlGeo, this.wallMaterial);
    bowl.position.set(x, y, z);
    this.group.add(bowl);

    // 4. Brazier Glowing Coal Core
    const coalGeo = new THREE.SphereGeometry(r * 0.85, 8, 8);
    coalGeo.scale(1.1, 0.45, 1.1);
    const coalMat = new THREE.MeshBasicMaterial({ color: 0xff4800 });
    const coal = new THREE.Mesh(coalGeo, coalMat);
    coal.position.set(x, y + h + 0.48, z);
    this.group.add(coal);
  }

  public update(time: number, fireIntensity: number) {
    this.wallMaterial.uniforms.uTime.value = time;
    this.wallMaterial.uniforms.uFireIntensity.value = fireIntensity;

    this.floorMaterial.uniforms.uTime.value = time;
    this.floorMaterial.uniforms.uFireIntensity.value = fireIntensity;

    this.spireMaterial.uniforms.uTime.value = time;
    this.spireMaterial.uniforms.uProgress.value = fireIntensity;

    this.ringMaterial.uniforms.uTime.value = time;
    this.ringMaterial.uniforms.uProgress.value = fireIntensity;

    this.fogMaterial.uniforms.uTime.value = time;
    this.fogMaterial.uniforms.uProgress.value = fireIntensity;

    // Subtle anti-gravity floating physics for suspended monoliths
    for (let i = 0; i < this.floatingRocks.length; i++) {
      const rock = this.floatingRocks[i];
      const offset = this.floatingRockOffsets[i];
      rock.position.y += Math.sin(time * 0.85 + offset) * 0.0022;
      rock.rotation.y += 0.0018;
      rock.rotation.x = Math.sin(time * 0.4 + offset) * 0.05;
    }
  }

  public dispose() {
    this.wallMaterial.dispose();
    this.floorMaterial.dispose();
    this.spireMaterial.dispose();
    this.ringMaterial.dispose();
    this.fogMaterial.dispose();
    this.bannerMaterial.dispose();
    this.slabMaterial.dispose();
    this.texturesToDispose.forEach((t) => t.dispose());
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
