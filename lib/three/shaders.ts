/**
 * GLSL for the background network. Every position is computed on the GPU from the two layouts,
 * so a frame costs the CPU a handful of uniform updates whatever the particle count.
 * Lines compute both of their endpoints with the same function as the points, so they stay
 * attached through the morph, the drift and the cursor pull.
 */

const nodeChunk = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform vec2 uPointer;
  uniform float uPointerStrength;

  // Circuit -> neural, staggered per point so the change ripples instead of snapping.
  float morphFor(float seed) {
    return smoothstep(0.0, 1.0, clamp(uMorph * 1.3 - seed * 0.3, 0.0, 1.0));
  }

  vec3 nodePosition(vec3 circuit, vec3 neural, float seed, out float glow) {
    float m = morphFor(seed);
    vec3 p = mix(circuit, neural, m);
    // Slow drift: a circuit board barely moves, a neural net breathes.
    float drift = mix(0.25, 1.0, m);
    p += drift * vec3(
      sin(uTime * 0.21 + seed * 31.0) * 0.12,
      cos(uTime * 0.17 + seed * 17.0) * 0.12,
      sin(uTime * 0.13 + seed * 7.0) * 0.2
    );
    // Cursor: nearby nodes lean toward it and brighten.
    float influence = (1.0 - smoothstep(0.0, 2.4, distance(p.xy, uPointer))) * uPointerStrength;
    p.xy += (uPointer - p.xy) * influence * 0.18;
    glow = influence;
    return p;
  }
`;

export const pointsVertex = /* glsl */ `
  ${nodeChunk}
  attribute vec3 aNeural;
  attribute float aSeed;
  attribute float aRole;
  uniform float uPixelRatio;
  uniform float uSize;
  varying float vGlow;
  varying float vSeed;
  varying float vFade;

  void main() {
    float glow;
    vec3 p = nodePosition(position, aNeural, aSeed, glow);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // In the neural state neurons grow and dust dims.
    float m = morphFor(aSeed);
    float roleSize = mix(1.0, mix(0.7, 2.0, aRole), m);
    gl_PointSize = uSize * (0.6 + aSeed * 0.8) * roleSize * (1.0 + glow * 1.2) * uPixelRatio * (10.0 / -mv.z);
    vFade = mix(1.0, mix(0.35, 1.0, aRole), m);
    vGlow = glow;
    vSeed = aSeed;
  }
`;

export const pointsFragment = /* glsl */ `
  uniform vec3 uCyan;
  uniform vec3 uViolet;
  uniform float uMorph;
  uniform float uIntensity;
  varying float vGlow;
  varying float vSeed;
  varying float vFade;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.0, r);
    vec3 color = mix(uCyan, uViolet, clamp(uMorph + (vSeed - 0.5) * 0.35, 0.0, 1.0));
    gl_FragColor = vec4(color * (1.0 + vGlow * 1.5), a * uIntensity * vFade * (0.8 + vGlow * 0.2));
  }
`;

export const linesVertex = /* glsl */ `
  ${nodeChunk}
  attribute vec3 aNeural;
  attribute float aSeed;
  attribute vec3 aOtherCircuit;
  attribute vec3 aOtherNeural;
  attribute float aOtherSeed;
  attribute float aKind;
  varying float vAlpha;
  varying float vGlow;
  varying float vKind;

  void main() {
    float g1;
    float g2;
    vec3 p = nodePosition(position, aNeural, aSeed, g1);
    vec3 q = nodePosition(aOtherCircuit, aOtherNeural, aOtherSeed, g2);
    // Circuit traces fade out as the net forms; synapses fade in.
    float visible = aKind < 0.5 ? 1.0 - smoothstep(0.0, 0.55, uMorph) : smoothstep(0.45, 1.0, uMorph);
    // A line stretched mid-morph (its ends travel apart) fades instead of slicing across.
    float maxLength = aKind < 0.5 ? 1.0 : 7.0;
    vAlpha = visible * (1.0 - smoothstep(maxLength * 0.6, maxLength, distance(p, q)));
    vGlow = max(g1, g2);
    vKind = aKind;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const linesFragment = /* glsl */ `
  uniform vec3 uCyan;
  uniform vec3 uViolet;
  uniform float uIntensity;
  varying float vAlpha;
  varying float vGlow;
  varying float vKind;

  void main() {
    vec3 color = mix(uCyan, uViolet, vKind);
    gl_FragColor = vec4(color, vAlpha * uIntensity * mix(0.15, 0.22, vKind) * (1.0 + vGlow * 3.0));
  }
`;
