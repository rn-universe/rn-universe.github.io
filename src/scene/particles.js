const THREE = window.THREE;

export function makeCircularPointsMaterial({ color, size, opacity }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSize: { value: size },
      uOpacity: { value: opacity },
    },
    vertexShader: [
      'uniform float uSize;',
      'void main() {',
      '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = clamp(uSize * (260.0 / max(1.0, -mvPosition.z)), 0.75, 7.0);',
      '  gl_Position = projectionMatrix * mvPosition;',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uColor;',
      'uniform float uOpacity;',
      'void main() {',
      '  float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));',
      '  float softness = 1.0 - smoothstep(0.34, 0.5, distanceFromCenter);',
      '  if (softness < 0.01) discard;',
      '  gl_FragColor = vec4(uColor, softness * uOpacity);',
      '}',
    ].join('\n'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
