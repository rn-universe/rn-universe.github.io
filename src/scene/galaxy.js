const THREE = window.THREE;
import { makeCircularPointsMaterial } from './particles.js?v=20260914-3';

function randomFactory(seed) {
  let value = seed;
  return function next() {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createPoints(points, color, size, opacity, blending) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const material = makeCircularPointsMaterial({ color, size, opacity });
  material.blending = blending;
  material.userData.baseOpacity = opacity;
  return new THREE.Points(geometry, material);
}

export function buildMilkyWay(lowPower) {
  const group = new THREE.Group();
  group.name = 'MILKY_WAY';
  group.rotation.x = 0.18;
  group.rotation.z = -0.12;

  const random = randomFactory(2741991);
  const starCount = lowPower ? 2300 : 5400;
  const stars = [];
  const arms = 4;
  for (let i = 0; i < starCount; i += 1) {
    const radius = 42 + Math.pow(random(), 0.62) * 760;
    const arm = Math.floor(random() * arms);
    const angle = arm * (Math.PI * 2 / arms) + Math.log(radius / 40) * 1.35 + (random() - 0.5) * (0.5 - radius * 0.00018);
    const spread = (random() - 0.5) * (22 + radius * 0.055);
    const x = Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * spread;
    const z = Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * spread;
    const y = (random() - 0.5) * (18 + radius * 0.045);
    stars.push(x, y, z);
  }
  group.add(createPoints(stars, 0xb7d8ff, lowPower ? 4.2 : 5.4, 0.72, THREE.AdditiveBlending));

  const bulge = [];
  const bulgeCount = lowPower ? 500 : 1200;
  for (let i = 0; i < bulgeCount; i += 1) {
    const radius = Math.pow(random(), 0.55) * 98;
    const angle = random() * Math.PI * 2;
    bulge.push(Math.cos(angle) * radius, (random() - 0.5) * (70 - radius * 0.45), Math.sin(angle) * radius);
  }
  group.add(createPoints(bulge, 0xffd9a0, lowPower ? 5.2 : 6.6, 0.34, THREE.AdditiveBlending));

  const dust = [];
  const dustCount = lowPower ? 650 : 1500;
  for (let i = 0; i < dustCount; i += 1) {
    const radius = 80 + random() * 690;
    const arm = Math.floor(random() * arms);
    const angle = arm * (Math.PI * 2 / arms) + radius * 0.0082 + (random() - 0.5) * 0.45;
    dust.push(Math.cos(angle) * radius, (random() - 0.5) * 16, Math.sin(angle) * radius);
  }
  group.add(createPoints(dust, 0x6f78a8, lowPower ? 3.8 : 4.6, 0.06, THREE.NormalBlending));

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(910, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x202b56, transparent: true, opacity: 0.025, side: THREE.BackSide, depthWrite: false })
  );
  halo.material.userData.baseOpacity = 0.025;
  group.add(halo);
  return group;
}
