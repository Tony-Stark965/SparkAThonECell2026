/**
 * Physically-tuned GLSL Shaders for the Massive Frontier Cavern:
 * 1. Procedural Flame Core (compact, concentrated living flame tongues)
 * 2. Fine Fluid Embers (sparks with blackbody temperature and curl-noise drift)
 * 3. Cavern Basalt Rock Surface (steep inverse-square light falloff, deep shadows)
 * 4. Wet Stone Ground (specular reflection of firelight, stone flagstone relief, puddles)
 * 5. Celestial Energy Spire & Light Shaft (vertical focused beam in depth)
 * 6. Floating Energy Ring (ancient sci-fi portal ring)
 */

export const FlameShader = {
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform vec2 uWind; // x, z wind displacement from interaction
    uniform float uProgress; // 0 to 1 scale ignition

    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vWindFactor;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Wind displacement increases with height (flame tip bends with draft)
      float heightFactor = clamp((pos.y + 0.5) / 1.5, 0.0, 1.0);
      pos.x += uWind.x * heightFactor * 0.45;
      pos.z += uWind.y * heightFactor * 0.35;
      vWindFactor = heightFactor;

      // Subtle organic flame tongue flickers
      float flicker = sin(uTime * 14.0 + pos.y * 6.0) * 0.04 * heightFactor;
      pos.x += flicker;
      pos.z += cos(uTime * 11.0 + pos.y * 5.0) * 0.03 * heightFactor;

      // Ignition scale from 0 to 1
      pos *= uProgress;

      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uProgress;

    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vWindFactor;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 3; i++) {
        v += a * noise(p);
        p *= 2.05;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 centeredUv = vUv - vec2(0.5, 0.0);
      vec2 flow = vec2(centeredUv.x * 2.2, centeredUv.y * 1.5 - uTime * 2.4);
      float n = fbm(flow);

      float widthAtY = (1.0 - pow(vUv.y, 0.8)) * 0.38;
      float distFromCenter = abs(centeredUv.x);
      float flameMask = smoothstep(widthAtY, widthAtY * 0.15, distFromCenter + n * 0.12);

      float verticalFade = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
      float alpha = flameMask * verticalFade * uProgress;

      if (alpha < 0.02) discard;

      vec3 coreColor = vec3(1.0, 0.96, 0.85);
      vec3 midColor  = vec3(1.0, 0.48, 0.06);
      vec3 tipColor  = vec3(0.65, 0.12, 0.02);

      vec3 color = mix(coreColor, midColor, smoothstep(0.0, 0.45, vUv.y));
      color = mix(color, tipColor, smoothstep(0.45, 0.85, vUv.y));

      float innerCore = smoothstep(widthAtY * 0.4, 0.0, distFromCenter) * (1.0 - vUv.y * 0.8);
      color = mix(color, vec3(1.0, 0.98, 0.9), innerCore * 0.65);

      gl_FragColor = vec4(color, alpha * 0.92);
    }
  `,
};

export const EmberShader = {
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uPointer;
    uniform float uProgress;
    uniform float uPixelRatio;

    attribute float aSize;
    attribute float aLife;
    attribute float aSpeed;
    attribute vec3 aOffset;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float t = mod(uTime * aSpeed * 0.18 + aLife, 1.0);

      vec3 pos = position;
      pos.y += t * 5.5;

      float turbX = sin(uTime * 2.5 + pos.y * 1.8 + aOffset.x) * 0.22;
      float turbZ = cos(uTime * 2.2 + pos.y * 1.5 + aOffset.z) * 0.18;
      pos.x += turbX;
      pos.z += turbZ;

      if (uPointer.z > 0.01) {
        vec3 toPointer = pos - vec3(uPointer.x, uPointer.y, -3.2);
        float dist = length(toPointer);
        if (dist < 2.5 && dist > 0.01) {
          float push = (1.0 - dist / 2.5) * uPointer.z * 1.2;
          pos += normalize(toPointer) * push;
          pos.y += push * 0.5;
        }
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float sizeFactor = (180.0 / -mvPosition.z) * uPixelRatio;
      gl_PointSize = clamp(aSize * sizeFactor * uIntensity, 1.0, 18.0);

      vColor = aColor;
      float alphaFade = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.65, 1.0, t));
      vAlpha = alphaFade * uIntensity * uProgress * 0.85;
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      float spark = pow(1.0 - dist * 2.0, 2.5);
      vec3 finalColor = mix(vColor, vec3(1.0, 0.98, 0.9), smoothstep(0.2, 0.0, dist));

      gl_FragColor = vec4(finalColor, vAlpha * spark);
    }
  `,
};

export const CaveWallShader = {
  vertexShader: /* glsl */ `
    uniform vec3 uLeftBrazierPos;
    uniform vec3 uRightBrazierPos;
    uniform vec3 uFirePos;
    uniform float uTime;

    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vDistL;
    varying float vDistR;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;

      vec3 posL = length(uLeftBrazierPos) > 0.001 ? uLeftBrazierPos : uFirePos;
      vec3 posR = length(uRightBrazierPos) > 0.001 ? uRightBrazierPos : uFirePos;

      vDistL = length(worldPos.xyz - posL);
      vDistR = length(worldPos.xyz - posR);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    uniform vec3 uLeftBrazierPos;
    uniform vec3 uRightBrazierPos;
    uniform vec3 uFirePos;
    uniform vec3 uFireColor;
    uniform float uFireIntensity;
    uniform float uTime;

    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vDistL;
    varying float vDistR;

    void main() {
      vec3 baseRock = vec3(0.012, 0.010, 0.009);

      vec3 posL = length(uLeftBrazierPos) > 0.001 ? uLeftBrazierPos : uFirePos;
      vec3 posR = length(uRightBrazierPos) > 0.001 ? uRightBrazierPos : uFirePos;

      vec3 lightDirL = normalize(posL - vWorldPos);
      float nDotL = max(dot(vNormal, lightDirL), 0.0);
      float attenL = 1.0 / (1.0 + 1.1 * vDistL + 0.65 * vDistL * vDistL);

      vec3 lightDirR = normalize(posR - vWorldPos);
      float nDotR = max(dot(vNormal, lightDirR), 0.0);
      float attenR = 1.0 / (1.0 + 1.1 * vDistR + 0.65 * vDistR * vDistR);

      float flicker = 1.0 + sin(uTime * 8.5) * 0.07 + sin(uTime * 17.1) * 0.03;
      vec3 diffuse = uFireColor * ((nDotL * attenL + nDotR * attenR) * uFireIntensity * flicker * 2.5);

      vec3 viewDir = normalize(-vWorldPos);
      float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
      rim = pow(rim, 4.0) * (attenL + attenR) * 0.25 * uFireIntensity;
      vec3 rimColor = vec3(1.0, 0.45, 0.1) * rim;

      vec3 finalColor = baseRock + diffuse + rimColor;

      float distToCam = length(vWorldPos);
      float depthFade = smoothstep(5.0, 22.0, distToCam);
      finalColor = mix(finalColor, vec3(0.002, 0.002, 0.002), depthFade);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

export const WetStoneFloorShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    uniform vec3 uLeftBrazierPos;
    uniform vec3 uRightBrazierPos;
    uniform vec3 uBeamPos;
    uniform vec3 uFirePos;
    uniform vec3 uFireColor;
    uniform float uFireIntensity;
    uniform float uTime;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      // Flagstone paving slab relief & puddle mask
      vec2 stoneGrid = fract(vUv * vec2(12.0, 28.0));
      float borderMask = smoothstep(0.06, 0.12, stoneGrid.x) * smoothstep(0.94, 0.88, stoneGrid.x) *
                         smoothstep(0.05, 0.10, stoneGrid.y) * smoothstep(0.95, 0.90, stoneGrid.y);
      float stoneRelief = (0.75 + borderMask * 0.35) * (0.8 + noise(vUv * 18.0) * 0.4);
      float puddleMask = smoothstep(0.38, 0.72, noise(vUv * 7.5));

      // Dark volcanic basalt base
      vec3 rockBase = vec3(0.014, 0.012, 0.010) * stoneRelief;

      // Dual brazier lighting (Left & Right)
      vec3 posL = length(uLeftBrazierPos) > 0.001 ? uLeftBrazierPos : uFirePos;
      vec3 posR = length(uRightBrazierPos) > 0.001 ? uRightBrazierPos : uFirePos;

      vec3 lightDirL = normalize(posL - vWorldPos);
      float distL = length(posL - vWorldPos);
      float attenL = 1.0 / (1.0 + 0.85 * distL + 0.45 * distL * distL);
      float nDotL = max(dot(vNormal, lightDirL), 0.0);

      vec3 lightDirR = normalize(posR - vWorldPos);
      float distR = length(posR - vWorldPos);
      float attenR = 1.0 / (1.0 + 0.85 * distR + 0.45 * distR * distR);
      float nDotR = max(dot(vNormal, lightDirR), 0.0);

      vec3 diffuse = uFireColor * ((nDotL * attenL + nDotR * attenR) * uFireIntensity * 2.1);

      // Specular wet reflection from braziers
      vec3 viewDir = normalize(-vWorldPos);
      vec3 halfL = normalize(lightDirL + viewDir);
      vec3 halfR = normalize(lightDirR + viewDir);
      float specPower = mix(14.0, 88.0, puddleMask);
      float specL = pow(max(dot(vNormal, halfL), 0.0), specPower);
      float specR = pow(max(dot(vNormal, halfR), 0.0), specPower);

      vec3 specBraziers = vec3(1.0, 0.62, 0.22) * (specL * attenL + specR * attenR) * uFireIntensity * 3.6 * (0.25 + puddleMask * 0.75);

      // Specular reflection from distant vertical beam down center of path
      vec3 beamPos = length(uBeamPos) > 0.001 ? uBeamPos : vec3(0.0, 2.0, -18.0);
      vec3 lightBeam = normalize(beamPos - vWorldPos);
      vec3 halfBeam = normalize(lightBeam + viewDir);
      float specBeam = pow(max(dot(vNormal, halfBeam), 0.0), 32.0);
      float beamDist = length(beamPos - vWorldPos);
      float beamAtten = 1.0 / (1.0 + 0.15 * beamDist);
      vec3 specBeamColor = vec3(1.0, 0.75, 0.35) * specBeam * beamAtten * uFireIntensity * 2.0 * (0.3 + puddleMask * 0.7);

      // Glowing lava cracks along path borders
      float crackMask = smoothstep(0.78, 0.92, noise(vUv * 16.0 + vec2(uTime * 0.05, 0.0)));
      vec3 crackGlow = vec3(1.0, 0.35, 0.02) * crackMask * uFireIntensity * (0.8 + 0.2 * sin(uTime * 4.0));

      vec3 finalColor = rockBase + diffuse + specBraziers + specBeamColor + crackGlow;

      // Distance depth fog
      float depth = length(vWorldPos);
      float fog = smoothstep(6.0, 22.0, depth);
      finalColor = mix(finalColor, vec3(0.002), fog);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

export const CelestialSpireShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uProgress;

    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      // Centered beam coordinates
      float distFromCenter = abs(vUv.x - 0.5);

      // High-intensity cylindrical core beam
      float coreBeam = pow(clamp(1.0 - distFromCenter * 3.2, 0.0, 1.0), 4.2);
      // Soft voluminous luminous halo
      float softHalo = pow(clamp(1.0 - distFromCenter * 1.8, 0.0, 1.0), 1.7);

      // Vertical energy flow waves
      float flow = sin(vUv.y * 24.0 - uTime * 7.0) * 0.16 + sin(vUv.y * 48.0 - uTime * 14.0) * 0.08;
      float pulse = 0.92 + sin(uTime * 3.8) * 0.1;

      // Vertical attenuation (smoothly transitions into aperture above and ground below)
      float verticalFade = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));

      float beamVal = (coreBeam * 1.8 + softHalo * 0.6 + flow * 0.2) * pulse;
      float alpha = clamp(beamVal * verticalFade * uProgress, 0.0, 1.0);
      if (alpha < 0.01) discard;

      // Incandescent pure white-gold core fading to radiant fiery amber corona
      vec3 coreCol = vec3(1.0, 0.98, 0.92);
      vec3 coronaCol = vec3(1.0, 0.44, 0.06);
      vec3 beamColor = mix(coronaCol, coreCol, pow(coreBeam, 1.4));

      gl_FragColor = vec4(beamColor, alpha * 0.92);
    }
  `,
};

export const AncientApertureShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      vec4 mvPos = viewMatrix * worldPos;
      vViewDir = normalize(-mvPos.xyz);
      gl_Position = projectionMatrix * mvPos;
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uProgress;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vWorldPos;

    void main() {
      // Dark ancient weathered metallic base
      vec3 darkMetal = vec3(0.024, 0.021, 0.019);

      // Concentric glowing energy seams
      float circuit = step(0.90, fract(vUv.x * 42.0 + sin(vUv.y * 14.0)));
      float pulse = 0.6 + 0.4 * sin(uTime * 2.2 + vUv.x * 8.0);

      // Fiery amber radiance along fractured seams
      vec3 energyColor = vec3(1.0, 0.46, 0.08) * circuit * pulse * 2.2;

      // Subtle grazing rim light
      float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.2);
      vec3 rim = vec3(0.9, 0.40, 0.09) * fresnel * 0.4;

      vec3 finalColor = darkMetal + energyColor + rim;

      // Deep atmospheric perspective fog so it recedes into the cavern depths
      float depth = length(vWorldPos);
      float fog = smoothstep(14.0, 28.0, depth);
      finalColor = mix(finalColor, vec3(0.002), fog);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

export const GroundFogShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uProgress;

    varying vec2 vUv;
    varying vec3 vWorldPos;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      vec2 flow = vec2(vUv.x * 5.0 + uTime * 0.04, vUv.y * 7.0 + sin(uTime * 0.03) * 0.5);
      float n = noise(flow) * 0.6 + noise(flow * 2.2) * 0.4;

      float edgeFade = smoothstep(0.0, 0.22, vUv.x) * (1.0 - smoothstep(0.78, 1.0, vUv.x)) *
                       smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));

      float alpha = n * edgeFade * 0.28 * uProgress;
      if (alpha < 0.01) discard;

      vec3 fogColor = vec3(0.85, 0.42, 0.12) * (0.65 + n * 0.45);
      gl_FragColor = vec4(fogColor, alpha);
    }
  `,
};
