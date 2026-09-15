const THREE = window.THREE;

let starTexture;

function getStarTexture() {
  if (starTexture) return starTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.16, 'rgba(255,255,255,0.96)');
  gradient.addColorStop(0.42, 'rgba(255,255,255,0.38)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  starTexture = new THREE.CanvasTexture(canvas);
  starTexture.needsUpdate = true;
  return starTexture;
}

export function makeCircularPointsMaterial({ color, size, opacity }) {
  const material = new THREE.PointsMaterial({
    color,
    size,
    map: getStarTexture(),
    transparent: true,
    opacity,
    alphaTest: 0.01,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  material.userData.baseOpacity = opacity;
  return material;
}
