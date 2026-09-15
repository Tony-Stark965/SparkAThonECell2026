import * as THREE from "three";
import { WorldAct } from "./CameraJourneyRig";

export class WorldChambers {
  public group: THREE.Group;

  // Act IV: Territory Artifacts
  private territoryGroup: THREE.Group;
  private territoryMeshes: THREE.Group[] = [];
  private activeTerritoryIdx = 0;

  // Act V: Arena Monolith Steles
  private arenaGroup: THREE.Group;
  private arenaSteles: THREE.Mesh[] = [];
  private selectedSteleIdx = 0;

  // Act VI: Bounty Vault
  private bountyGroup: THREE.Group;
  private vaultDoorL: THREE.Mesh;
  private vaultDoorR: THREE.Mesh;
  private vaultCore: THREE.Mesh;
  private vaultProgress = 0;

  // Act VII: Event Flow Milestones
  private flowGroup: THREE.Group;
  private flowBeacons: THREE.Mesh[] = [];

  // Act VIII: Monumental Portal Gateway
  private portalGroup: THREE.Group;
  private portalVortex: THREE.Mesh;

  private commonDarkMat: THREE.MeshStandardMaterial;
  private glowAmberMat: THREE.MeshBasicMaterial;
  private wireframeMat: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();

    this.commonDarkMat = new THREE.MeshStandardMaterial({
      color: 0x0a0806,
      roughness: 0.85,
      metalness: 0.25,
    });

    this.glowAmberMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
    });

    this.wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xff8811,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });

    // 1. Build Territory Artifacts
    this.territoryGroup = new THREE.Group();
    this.territoryGroup.position.set(0, -0.2, -3.8);
    this.buildTerritoryArtifacts();
    this.group.add(this.territoryGroup);

    // 2. Build Arena Monolith Steles
    this.arenaGroup = new THREE.Group();
    this.arenaGroup.position.set(0, -1.2, -4.6);
    this.buildArenaSteles();
    this.group.add(this.arenaGroup);

    // 3. Build Bounty Vault
    this.bountyGroup = new THREE.Group();
    this.bountyGroup.position.set(0, -0.4, -3.5);
    const vaultParts = this.buildBountyVault();
    this.vaultDoorL = vaultParts.doorL;
    this.vaultDoorR = vaultParts.doorR;
    this.vaultCore = vaultParts.core;
    this.group.add(this.bountyGroup);

    // 4. Build Flow Milestones
    this.flowGroup = new THREE.Group();
    this.flowGroup.position.set(0, -1.2, -4.5);
    this.buildFlowMilestones();
    this.group.add(this.flowGroup);

    // 5. Build Portal Gateway
    this.portalGroup = new THREE.Group();
    this.portalGroup.position.set(0, 0.4, -4.2);
    this.portalVortex = this.buildPortalGateway();
    this.group.add(this.portalGroup);

    this.updateVisibility("HERO", 0);
  }

  // --- ACT IV BUILDER ---
  private buildTerritoryArtifacts() {
    // 0: AI & Cybersec — Cryptographic Icosahedral Lattice
    const aiGroup = new THREE.Group();
    const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), this.wireframeMat);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.65), this.glowAmberMat);
    aiGroup.add(ico);
    aiGroup.add(core);
    this.territoryMeshes.push(aiGroup);
    this.territoryGroup.add(aiGroup);

    // 1: Smart Energy Systems — Nested Toroidal Power Core
    const energyGroup = new THREE.Group();
    const tor1 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.1, 16, 40), this.glowAmberMat);
    const tor2 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 16, 32), this.wireframeMat);
    tor2.rotation.x = Math.PI / 2;
    energyGroup.add(tor1);
    energyGroup.add(tor2);
    this.territoryMeshes.push(energyGroup);
    this.territoryGroup.add(energyGroup);

    // 2: Robotics & Drones — Dual-Axis Kinetic Aerospace Gimbal
    const aeroGroup = new THREE.Group();
    const gimb1 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 16, 36), this.commonDarkMat);
    const gimb2 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 16, 32), this.glowAmberMat);
    gimb2.rotation.y = Math.PI / 3;
    aeroGroup.add(gimb1);
    aeroGroup.add(gimb2);
    this.territoryMeshes.push(aeroGroup);
    this.territoryGroup.add(aeroGroup);

    // 3: IoT & Embedded — Distributed Silicon Mesh Lattice
    const iotGroup = new THREE.Group();
    const nodeCount = 12;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const r = 0.95;
      const node = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), this.glowAmberMat);
      node.position.set(Math.cos(angle) * r, (Math.sin(angle * 2) * 0.4), Math.sin(angle) * r);
      iotGroup.add(node);
    }
    const iotCenter = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), this.wireframeMat);
    iotGroup.add(iotCenter);
    this.territoryMeshes.push(iotGroup);
    this.territoryGroup.add(iotGroup);

    // 4: Open Innovation — Prismatic Stellar Polyhedron
    const openGroup = new THREE.Group();
    const star = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), this.wireframeMat);
    const innerSpike = new THREE.Mesh(new THREE.TetrahedronGeometry(0.7), this.glowAmberMat);
    openGroup.add(star);
    openGroup.add(innerSpike);
    this.territoryMeshes.push(openGroup);
    this.territoryGroup.add(openGroup);
  }

  // --- ACT V BUILDER ---
  private buildArenaSteles() {
    const steleCount = 5;
    const radius = 3.6;
    for (let i = 0; i < steleCount; i++) {
      const angle = ((i - 2) / 4) * (Math.PI / 3);
      const steleGeo = new THREE.BoxGeometry(0.7, 2.8, 0.35);
      steleGeo.translate(0, 1.4, 0);

      const stele = new THREE.Mesh(steleGeo, this.commonDarkMat);
      stele.position.set(Math.sin(angle) * radius, 0, -Math.cos(angle) * radius + 1.2);
      stele.rotation.y = -angle;

      // Slender vertical glowing amber energy seam (prevents flat orange slabs)
      const seamGeo = new THREE.PlaneGeometry(0.04, 2.4);
      seamGeo.translate(0, 1.4, 0.18);
      const seam = new THREE.Mesh(seamGeo, this.glowAmberMat);
      stele.add(seam);

      this.arenaSteles.push(stele);
      this.arenaGroup.add(stele);
    }
  }

  // --- ACT VI BUILDER ---
  private buildBountyVault() {
    // Outer Vault Casing
    const casingGeo = new THREE.BoxGeometry(2.4, 2.4, 1.8);
    const casing = new THREE.Mesh(casingGeo, this.commonDarkMat);
    this.bountyGroup.add(casing);

    // Sliding Door Left
    const doorGeo = new THREE.BoxGeometry(1.1, 2.2, 0.25);
    doorGeo.translate(-0.55, 0, 0);
    const doorL = new THREE.Mesh(doorGeo, this.commonDarkMat);
    doorL.position.set(0, 0, 0.95);
    this.bountyGroup.add(doorL);

    // Sliding Door Right
    const doorR = new THREE.Mesh(doorGeo.clone().translate(1.1, 0, 0), this.commonDarkMat);
    doorR.position.set(0, 0, 0.95);
    this.bountyGroup.add(doorR);

    // Inner Glowing Core (₹15,000 Relic)
    const coreGeo = new THREE.OctahedronGeometry(0.55);
    const core = new THREE.Mesh(coreGeo, this.glowAmberMat);
    core.position.set(0, 0, 0.2);
    this.bountyGroup.add(core);

    return { doorL, doorR, core };
  }

  // --- ACT VII BUILDER ---
  private buildFlowMilestones() {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const zOffset = -i * 1.6;
      const xOffset = Math.sin(i * 1.2) * 1.8;

      const pylonGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.6, 8);
      pylonGeo.translate(0, 0.8, 0);
      const pylon = new THREE.Mesh(pylonGeo, this.commonDarkMat);
      pylon.position.set(xOffset, 0, zOffset);

      const beaconGeo = new THREE.SphereGeometry(0.18, 8, 8);
      beaconGeo.translate(0, 1.7, 0);
      const beacon = new THREE.Mesh(beaconGeo, this.glowAmberMat);
      pylon.add(beacon);

      this.flowBeacons.push(pylon);
      this.flowGroup.add(pylon);
    }
  }

  // --- ACT VIII BUILDER ---
  private buildPortalGateway() {
    const archGeo = new THREE.TorusGeometry(2.4, 0.3, 16, 32, Math.PI);
    archGeo.rotateZ(Math.PI);
    archGeo.translate(0, 1.2, 0);
    const arch = new THREE.Mesh(archGeo, this.commonDarkMat);
    this.portalGroup.add(arch);

    // Event Horizon Energy Vortex
    const vortexGeo = new THREE.PlaneGeometry(3.6, 4.2);
    vortexGeo.translate(0, 1.2, 0);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const vortex = new THREE.Mesh(vortexGeo, vortexMat);
    this.portalGroup.add(vortex);

    return vortex;
  }

  public updateVisibility(act: WorldAct, activeTerritory = 0, selectedStele = 0) {
    this.activeTerritoryIdx = activeTerritory;
    this.selectedSteleIdx = selectedStele;

    this.territoryGroup.visible = act === "TERRITORIES";
    this.arenaGroup.visible = act === "ARENA";
    this.bountyGroup.visible = act === "BOUNTY";
    this.flowGroup.visible = act === "FLOW";
    this.portalGroup.visible = act === "PORTAL";

    if (act === "TERRITORIES") {
      this.territoryMeshes.forEach((mesh, idx) => {
        mesh.visible = idx === activeTerritory;
      });
    }
  }

  public update(time: number, act: WorldAct) {
    // 1. Animate active territory artifact
    if (act === "TERRITORIES") {
      const activeMesh = this.territoryMeshes[this.activeTerritoryIdx];
      if (activeMesh) {
        activeMesh.rotation.y = time * 0.65;
        activeMesh.rotation.x = Math.sin(time * 0.4) * 0.25;
        activeMesh.position.y = Math.sin(time * 1.2) * 0.12;
      }
    }

    // 2. Animate Arena Steles
    if (act === "ARENA") {
      this.arenaSteles.forEach((stele, idx) => {
        const isSelected = idx === this.selectedSteleIdx;
        const targetY = isSelected ? 0.35 : 0.0;
        stele.position.y += (targetY - stele.position.y) * 0.08;
      });
    }

    // 3. Animate Bounty Vault Unsealing
    if (act === "BOUNTY") {
      this.vaultProgress = Math.min(this.vaultProgress + 0.02, 1.0);
      const doorShift = this.vaultProgress * 0.85;
      this.vaultDoorL.position.x = -doorShift;
      this.vaultDoorR.position.x = doorShift;
      this.vaultCore.rotation.y = time * 1.2;
      this.vaultCore.scale.setScalar(0.8 + Math.sin(time * 3.0) * 0.1);
    } else {
      this.vaultProgress = 0;
    }

    // 4. Animate Flow Beacons
    if (act === "FLOW") {
      this.flowBeacons.forEach((b, idx) => {
        b.rotation.y = time * 0.5 + idx;
      });
    }

    // 5. Animate Portal Horizon Vortex
    if (act === "PORTAL") {
      (this.portalVortex.material as THREE.MeshBasicMaterial).opacity =
        0.35 + Math.sin(time * 3.5) * 0.12;
      this.portalVortex.rotation.z = Math.sin(time * 0.5) * 0.05;
    }
  }

  public dispose() {
    this.commonDarkMat.dispose();
    this.glowAmberMat.dispose();
    this.wireframeMat.dispose();
  }
}
