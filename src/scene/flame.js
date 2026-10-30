import * as THREE from 'three';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute vec2 aOffset;
  varying float vLife;

  void main() {
    float life = fract(uTime * (1.4 + aSeed * 0.6) + aSeed * 7.0);
    float spread = 0.1 + life * 0.38;
    vec3 p = vec3(aOffset.x * spread, -life * (0.9 + 1.4 * uIntensity), aOffset.y * spread);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (1.0 - life * 0.75) * (0.4 + uIntensity * 0.6) / -mv.z;
    vLife = life;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uIntensity;
  varying float vLife;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * (1.0 - vLife) * min(uIntensity, 1.4);
    vec3 core = vec3(1.0, 0.95, 0.75);
    vec3 mid = vec3(1.0, 0.54, 0.12);
    vec3 tail = vec3(0.85, 0.18, 0.04);
    vec3 col = mix(core, mid, smoothstep(0.0, 0.35, vLife));
    col = mix(col, tail, smoothstep(0.35, 0.9, vLife));
    gl_FragColor = vec4(col * a, a);
  }
`;

/** Llama de partículas aditivas. Se cuelga de la tobera del cohete. */
export function createFlame({ count, pixelRatio }) {
  const geo = new THREE.BufferGeometry();
  const seeds = new Float32Array(count);
  const offsets = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    seeds[i] = Math.random();
    const r = Math.sqrt(Math.random());
    const a = Math.random() * Math.PI * 2;
    offsets[i * 2] = Math.cos(a) * r;
    offsets[i * 2 + 1] = Math.sin(a) * r;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 2));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uSize: { value: 260 },
      uPixelRatio: { value: pixelRatio },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;

  const light = new THREE.PointLight(0xff8a2a, 6, 4, 1.6);
  light.position.y = -0.2;

  const flame = new THREE.Group();
  flame.add(points, light);
  flame.userData.update = (t, intensity, pixelRatio) => {
    material.uniforms.uTime.value = t;
    material.uniforms.uPixelRatio.value = pixelRatio;
    material.uniforms.uIntensity.value = intensity;
    light.intensity = intensity * (5 + Math.sin(t * 40) * 0.8 + Math.sin(t * 23) * 0.6);
    points.visible = intensity > 0.01;
  };
  return flame;
}
