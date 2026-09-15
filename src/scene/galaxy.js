const THREE = window.THREE;
import { makeCircularPointsMaterial } from './particles.js?v=20260915-6';

function randomFactory(seed) {
  let value = seed;
  return function next() { value = (value * 1664525 + 1013904223) % 4294967296; return value / 4294967296; };
}
function createPoints(points, color, size, opacity, blending = THREE.AdditiveBlending) {
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const material = makeCircularPointsMaterial({ color, size, opacity }); material.blending = blending; material.userData.baseOpacity = opacity; return new THREE.Points(geometry, material);
}
function createRing(radius, opacity = 0.05) {
  const points = []; const segments = 240;
  for (let i = 0; i <= segments; i += 1) { const angle = (i / segments) * Math.PI * 2; points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)); }
  const material = new THREE.LineBasicMaterial({ color: 0x7186b6, transparent: true, opacity, depthWrite: false }); material.userData.baseOpacity = opacity;
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material);
}

export function buildMilkyWay(lowPower) {
  const group = new THREE.Group(); group.name = 'MILKY_WAY'; group.rotation.x = 0.18; group.rotation.z = -0.12;
  const random = randomFactory(2741991); const starCount = lowPower ? 6800 : 19000; const stars = [], warmStars = [], coolStars = []; const arms = 4;
  for (let i = 0; i < starCount; i += 1) {
    const radius = 28 + Math.pow(random(), 0.62) * 790; const arm = Math.floor(random() * arms); const spiral = Math.log(radius / 34) * 1.42;
    const angle = arm * (Math.PI * 2 / arms) + spiral + (random() - 0.5) * (0.46 - radius * 0.00012); const spread = (random() - 0.5) * (14 + radius * 0.07);
    const x = Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * spread; const z = Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * spread; const y = (random() - 0.5) * (8 + radius * 0.034);
    const point = [x, y, z]; const roll = random(); if (roll < 0.2) warmStars.push(...point); else if (roll > 0.78) coolStars.push(...point); else stars.push(...point);
  }
  const stellarDisk = new THREE.Group(); stellarDisk.name = 'STELLAR_DISK';
  stellarDisk.add(createPoints(stars, 0xdde8ff, lowPower ? 3.8 : 5.0, 0.8)); stellarDisk.add(createPoints(warmStars, 0xffc58a, lowPower ? 3.5 : 4.5, 0.56)); stellarDisk.add(createPoints(coolStars, 0x9ecbff, lowPower ? 3.3 : 4.2, 0.54)); group.add(stellarDisk);

  const bulge = [], bulgeWarm = []; const bulgeCount = lowPower ? 1400 : 3600;
  for (let i = 0; i < bulgeCount; i += 1) { const radius = Math.pow(random(), 0.5) * 120; const angle = random() * Math.PI * 2; const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius * 0.72; const y = (random() - 0.5) * (64 - radius * 0.3); (i % 3 ? bulge : bulgeWarm).push(x, y, z); }
  const stellarBulge = new THREE.Group(); stellarBulge.name = 'STELLAR_BULGE'; stellarBulge.add(createPoints(bulge, 0xffd7b2, lowPower ? 4.5 : 5.6, 0.31)); stellarBulge.add(createPoints(bulgeWarm, 0xffa56f, lowPower ? 4.2 : 5.1, 0.2)); group.add(stellarBulge);

  const dust = []; const dustCount = lowPower ? 1500 : 4200;
  for (let i = 0; i < dustCount; i += 1) { const radius = 70 + random() * 690; const arm = Math.floor(random() * arms); const angle = arm * (Math.PI * 2 / arms) + radius * 0.0083 + (random() - 0.5) * 0.55; const spread = (random() - 0.5) * 34; dust.push(Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * spread, (random() - 0.5) * 12, Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * spread); }
  const dustLayer = createPoints(dust, 0x566a9c, lowPower ? 2.7 : 3.5, 0.07, THREE.NormalBlending); dustLayer.name = 'DUST_LANES'; group.add(dustLayer);

  const gas = []; const gasCount = lowPower ? 800 : 2200;
  for (let i = 0; i < gasCount; i += 1) { const radius = 90 + random() * 620; const arm = Math.floor(random() * arms); const angle = arm * (Math.PI * 2 / arms) + radius * 0.008 + (random() - 0.5) * 0.22; const cluster = Math.pow(random(), 2.8); gas.push(Math.cos(angle) * (radius + cluster * 28), (random() - 0.5) * (6 + cluster * 9), Math.sin(angle) * (radius + cluster * 28)); }
  const gasLayer = createPoints(gas, 0x7a7fc2, lowPower ? 3.2 : 4.1, 0.075); gasLayer.name = 'INTERSTELLAR_GAS'; group.add(gasLayer);

  const movingStarStreamPoints = []; const movingCount = lowPower ? 360 : 900;
  for (let i = 0; i < movingCount; i += 1) { const radius = 220 + random() * 650; const a = random() * Math.PI * 2; movingStarStreamPoints.push(Math.cos(a) * radius, (random() - 0.5) * 110, Math.sin(a) * radius); }
  const movingStarStream = createPoints(movingStarStreamPoints, 0xe8efff, lowPower ? 2.8 : 3.7, 0.24); movingStarStream.name = 'MOVING_STAR_STREAM'; group.add(movingStarStream);

  const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(132, 48, 24), new THREE.MeshBasicMaterial({ color: 0xffa95d, transparent: true, opacity: 0.035, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })); coreGlow.material.userData.baseOpacity = 0.035; group.add(coreGlow);
  const coreRing = createRing(150, 0.022); coreRing.rotation.x = 0.035; group.add(coreRing);
  const outerRing = createRing(790, 0.012); outerRing.scale.y = 0.35; group.add(outerRing);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(910, 40, 20), new THREE.MeshBasicMaterial({ color: 0x202b56, transparent: true, opacity: 0.02, side: THREE.BackSide, depthWrite: false })); halo.material.userData.baseOpacity = 0.02; group.add(halo);

  const solarAngle = -0.62; const solarRadius = 470; const solarPosition = new THREE.Vector3(Math.cos(solarAngle) * solarRadius, 0, Math.sin(solarAngle) * solarRadius);
  const marker = new THREE.Group(); marker.position.copy(solarPosition); marker.name = 'SOLAR_NEIGHBORHOOD_MARKER';
  const markerGlow = new THREE.Mesh(new THREE.SphereGeometry(7.5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf7d98b, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false }));
  const markerCore = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf7d98b, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false }));
  marker.add(markerGlow, markerCore); const markerOrbit = createRing(9, 0.08); markerOrbit.rotation.x = Math.PI / 2; marker.add(markerOrbit); group.add(marker);
  group.userData.solarNeighborhood = solarPosition.clone();
  group.userData.advance = (elapsed, delta = 0.016) => {
    const motion = lowPower ? 1 : 1.7;
    stellarDisk.rotation.y = elapsed * 0.0062 * motion;
    stellarDisk.rotation.x = Math.sin(elapsed * 0.11) * 0.006;
    stellarBulge.rotation.y = elapsed * 0.0026;
    dustLayer.rotation.y = elapsed * 0.0054;
    gasLayer.rotation.y = -elapsed * 0.0039;
    movingStarStream.rotation.y = elapsed * 0.014;
    movingStarStream.position.x = Math.sin(elapsed * 0.21) * 2.6;
    movingStarStream.position.z = Math.cos(elapsed * 0.17) * 2.6;
    marker.rotation.y = elapsed * 0.25;
    const pulse = 1 + Math.sin(elapsed * 2.1) * 0.12; markerGlow.scale.setScalar(pulse); markerCore.scale.setScalar(1 + Math.sin(elapsed * 3.1) * 0.09); coreGlow.scale.setScalar(1 + Math.sin(elapsed * 0.5) * 0.025);
  };
  return group;
}
