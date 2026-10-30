import * as THREE from 'three';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vTwinkle;
  varying float vDepth;

  void main() {
    vec3 p = position;
    // El scroll desplaza el campo hacia arriba (más rápido las estrellas cercanas) y se repite sin costuras
    p.y = mod(p.y + uScroll * (0.6 + aSeed * 0.8) + 9.0, 18.0) - 9.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.2 + aSeed * 2.2) * uPixelRatio * (18.0 / -mv.z);
    vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 40.0);
    vDepth = clamp(1.0 - (-mv.z - 8.0) / 30.0, 0.25, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying float vTwinkle;
  varying float vDepth;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vTwinkle * vDepth * uOpacity;
    gl_FragColor = vec4(vec3(1.0, 0.92, 0.8) * a, a);
  }
`;

/** Campo de estrellas cálidas detrás de la escena. Se apaga en las secciones de papel. */
export function createStars({ count, pixelRatio }) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 2] = -4 - Math.random() * 26;
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uOpacity: { value: 1 },
      uPixelRatio: { value: pixelRatio },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(geo, material);
  stars.frustumCulled = false;
  stars.renderOrder = -2;
  stars.userData.update = (t, opacity, scroll, pr) => {
    material.uniforms.uTime.value = t;
    material.uniforms.uOpacity.value = opacity;
    material.uniforms.uScroll.value = scroll;
    material.uniforms.uPixelRatio.value = pr;
    stars.visible = opacity > 0.01;
  };
  return stars;
}
