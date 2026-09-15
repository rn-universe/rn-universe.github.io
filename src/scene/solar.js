const THREE = window.THREE;

function orbitLine(radius, color = 0x8aa2c9, opacity = 0.12) {
  const points = [];
  for (let i = 0; i <= 192; i += 1) {
    const a = (i / 192) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  material.userData.baseOpacity = opacity;
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material);
}

function body(name, radius, color, roughness = 0.8, emissive = 0x000000, emissiveIntensity = 0) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 16),
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, emissive, emissiveIntensity })
  );
  mesh.name = name;
  mesh.userData.baseRotation = 0.002;
  return mesh;
}

function ring(radius, tube, color, opacity = 0.42, rotation = 0) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 10, 96),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
  );
  mesh.rotation.x = Math.PI / 2 + rotation;
  return mesh;
}

function createPlanet(definition) {
  const orbit = new THREE.Group();
  orbit.rotation.y = definition.phase;
  orbit.rotation.z = definition.inclination;
  const anchor = new THREE.Group();
  anchor.position.set(definition.distance, 0, 0);
  orbit.add(anchor);
  const planet = body(definition.name, definition.radius, definition.color, definition.roughness, definition.emissive, definition.emissiveIntensity);
  planet.rotation.z = definition.axialTilt;
  planet.userData.solarName = definition.name;
  anchor.add(planet);
  if (definition.atmosphere) {
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(definition.radius * 1.055, 20, 14),
      new THREE.MeshBasicMaterial({ color: definition.atmosphere, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    anchor.add(atmosphere);
  }
  if (definition.rings) {
    anchor.add(ring(definition.rings.radius, definition.rings.tube, definition.rings.color, definition.rings.opacity, definition.rings.tilt));
    anchor.add(ring(definition.rings.radius * 1.22, definition.rings.tube * 0.55, definition.rings.color, definition.rings.opacity * 0.55, definition.rings.tilt));
  }
  const moons = [];
  (definition.moons || []).forEach((moon, index) => {
    const pivot = new THREE.Group();
    pivot.rotation.y = index * 2.2;
    const moonMesh = body(moon.name, moon.radius, moon.color, 0.86);
    moonMesh.position.x = moon.distance;
    pivot.add(moonMesh);
    anchor.add(pivot);
    moons.push({ pivot, speed: moon.speed });
  });
  const line = orbitLine(definition.distance, definition.orbitColor || 0x7891b8, definition.orbitOpacity || 0.1);
  orbit.add(line);
  return { orbit, anchor, planet, moons, speed: definition.speed, line };
}

function makeComet(color, scale = 1) {
  const comet = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23 * scale, 12, 8), new THREE.MeshBasicMaterial({ color: 0xeaf7ff, transparent: true, opacity: 0.96 }));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.62 * scale, 12, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
  const tailPoints = [];
  for (let i = 0; i < 18; i += 1) {
    const t = i / 17;
    tailPoints.push(new THREE.Vector3(-t * 10 * scale, Math.sin(t * 2.4) * 0.18 * scale, Math.cos(t * 4) * 0.12 * scale));
  }
  const tail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(tailPoints), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.34, depthWrite: false }));
  comet.add(head, glow, tail);
  comet.userData.glow = glow;
  return comet;
}

export function buildSolarSystem(lowPower) {
  const group = new THREE.Group();
  group.name = 'SOLAR_SYSTEM_REALISTIC';

  const sun = new THREE.Mesh(new THREE.SphereGeometry(4.1, lowPower ? 28 : 40, lowPower ? 20 : 28), new THREE.MeshBasicMaterial({ color: 0xffc04d }));
  sun.name = 'SUN';
  group.add(sun);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(5.8, 28, 20), new THREE.MeshBasicMaterial({ color: 0xff9f2e, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(glow);
  const sunLight = new THREE.PointLight(0xffcf82, 6.5, 700, 1.35);
  group.add(sunLight);

  const plane = new THREE.Mesh(new THREE.CircleGeometry(206, 64), new THREE.MeshBasicMaterial({ color: 0x5e7198, transparent: true, opacity: 0.018, side: THREE.DoubleSide, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2;
  group.add(plane);

  const planets = [
    { name: 'MERCURY', distance: 13, radius: 0.32, color: 0x9a8a7b, roughness: 0.95, speed: 0.010, phase: 0.3, inclination: 0.015, axialTilt: 0.04 },
    { name: 'VENUS', distance: 19, radius: 0.58, color: 0xd3ad72, roughness: 0.86, speed: 0.0076, phase: 2.0, inclination: 0.01, axialTilt: 2.64, atmosphere: 0xd48d50 },
    { name: 'EARTH', distance: 27, radius: 0.62, color: 0x3e78ba, roughness: 0.65, speed: 0.0062, phase: 4.2, inclination: 0.0, axialTilt: 0.41, atmosphere: 0x77cfff, moons: [{ name: 'MOON', distance: 1.15, radius: 0.17, color: 0xbab7b2, speed: 0.045 }] },
    { name: 'MARS', distance: 37, radius: 0.48, color: 0xb45135, roughness: 0.9, speed: 0.0051, phase: 1.2, inclination: 0.018, axialTilt: 0.44, atmosphere: 0xb66a55, moons: [{ name: 'PHOBOS', distance: 0.82, radius: 0.07, color: 0x84736c, speed: 0.065 }, { name: 'DEIMOS', distance: 1.02, radius: 0.045, color: 0x8d7e74, speed: 0.052 }] },
    { name: 'JUPITER', distance: 69, radius: 2.35, color: 0xb99265, roughness: 0.86, speed: 0.0032, phase: 5.0, inclination: 0.02, axialTilt: 0.055, atmosphere: 0xd3b18a, moons: [{ name: 'IO', distance: 3.1, radius: 0.18, color: 0xd8c27b, speed: 0.026 }, { name: 'EUROPA', distance: 3.8, radius: 0.15, color: 0xc9c2b4, speed: 0.021 }, { name: 'GANYMEDE', distance: 4.7, radius: 0.22, color: 0x8f8b83, speed: 0.016 }] },
    { name: 'SATURN', distance: 96, radius: 2.0, color: 0xd4b278, roughness: 0.9, speed: 0.0026, phase: 3.1, inclination: 0.018, axialTilt: 0.47, atmosphere: 0xe0c99b, rings: { radius: 3.45, tube: 0.16, color: 0xbda67d, opacity: 0.42, tilt: 0.1 } },
    { name: 'URANUS', distance: 126, radius: 1.18, color: 0x77c6d0, roughness: 0.84, speed: 0.0020, phase: 0.8, inclination: 0.012, axialTilt: 1.71, atmosphere: 0x8be1e8, rings: { radius: 1.58, tube: 0.035, color: 0x8fb9bf, opacity: 0.15, tilt: 0.0 } },
    { name: 'NEPTUNE', distance: 156, radius: 1.14, color: 0x3f68bb, roughness: 0.82, speed: 0.0017, phase: 5.7, inclination: 0.015, axialTilt: 0.49, atmosphere: 0x5d9aff },
  ];

  const built = planets.map(createPlanet);
  built.forEach((planet) => group.add(planet.orbit));

  const belt = new THREE.Group();
  const beltPoints = [];
  let seed = 901;
  const next = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < (lowPower ? 260 : 850); i += 1) {
    const r = 46 + next() * 11;
    const a = next() * Math.PI * 2;
    beltPoints.push(Math.cos(a) * r, (next() - 0.5) * 2.2, Math.sin(a) * r);
  }
  const beltGeo = new THREE.BufferGeometry();
  beltGeo.setAttribute('position', new THREE.Float32BufferAttribute(beltPoints, 3));
  belt.add(new THREE.Points(beltGeo, new THREE.PointsMaterial({ color: 0xb7a58c, size: lowPower ? 0.23 : 0.34, transparent: true, opacity: 0.52, depthWrite: false })));
  group.add(belt);

  const comets = [makeComet(0x9fd8ff, 1.0), makeComet(0xa8f0c8, 0.72), makeComet(0xffd59a, 0.58)];
  comets.forEach((comet) => group.add(comet));

  const windCount = lowPower ? 260 : 760;
  const windPositions = new Float32Array(windCount * 3);
  const windVelocities = new Float32Array(windCount);
  for (let i = 0; i < windCount; i += 1) {
    const r = 7 + Math.random() * 190;
    const a = Math.random() * Math.PI * 2;
    windPositions[i * 3] = Math.cos(a) * r;
    windPositions[i * 3 + 1] = (Math.random() - 0.5) * 26;
    windPositions[i * 3 + 2] = Math.sin(a) * r;
    windVelocities[i] = 0.015 + Math.random() * 0.03;
  }
  const windGeo = new THREE.BufferGeometry();
  windGeo.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
  const wind = new THREE.Points(windGeo, new THREE.PointsMaterial({ color: 0xbad7ff, size: lowPower ? 0.09 : 0.13, transparent: true, opacity: 0.34, depthWrite: false, blending: THREE.AdditiveBlending }));
  wind.name = 'SOLAR_WIND';
  group.add(wind);

  group.userData.advance = (elapsed) => {
    built.forEach((item, index) => {
      item.orbit.rotation.y += item.speed;
      item.planet.rotation.y += 0.004 + index * 0.0007;
      item.moons.forEach((moon) => { moon.pivot.rotation.y += moon.speed; });
    });
    sun.rotation.y = elapsed * 0.03;
    glow.scale.setScalar(1 + Math.sin(elapsed * 1.1) * 0.025);
    belt.rotation.y = elapsed * 0.00095;

    comets.forEach((comet, index) => {
      const phase = index * 2.1;
      const angle = elapsed * (0.0032 + index * 0.0007) + phase;
      const radius = 78 + Math.sin(elapsed * (0.0018 + index * 0.0003) + phase) * (38 + index * 11);
      comet.position.set(Math.cos(angle) * radius, Math.sin(elapsed * 0.004 + phase) * (3.5 + index), Math.sin(angle) * radius);
      comet.rotation.y = angle + Math.PI * 0.5;
      comet.userData.glow.scale.setScalar(1 + Math.sin(elapsed * (2.2 + index)) * 0.12);
    });

    const positions = wind.geometry.attributes.position.array;
    for (let i = 0; i < windCount; i += 1) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      const angle = Math.atan2(z, x) + windVelocities[i];
      const r = Math.min(205, Math.hypot(x, z) + windVelocities[i] * 5.5);
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      positions[i * 3 + 1] += Math.sin(elapsed * 1.3 + i) * 0.003;
      if (r > 202) {
        positions[i * 3] = 7 + Math.cos(i) * 2;
        positions[i * 3 + 2] = 7 + Math.sin(i) * 2;
      }
    }
    wind.geometry.attributes.position.needsUpdate = true;
  };
  return group;
}
