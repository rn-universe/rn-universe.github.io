const THREE = window.THREE;

function makeOrbitLine(radius, color, opacity) {
  const points = [];
  const segments = 160;
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.LineLoop(geometry, material);
}

function makeMoon(parent, index, color, size) {
  const pivot = new THREE.Group();
  pivot.rotation.y = index * 2.1;
  const radius = 0.82 + index * 0.19;
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(size, 12, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.08, emissive: color, emissiveIntensity: 0.12 })
  );
  moon.position.set(radius, 0.04 * index, 0);
  pivot.add(moon);
  parent.add(pivot);
  return { pivot, moon, speed: 0.004 + index * 0.0012 };
}

function makeNode(node) {
  const orbit = new THREE.Group();
  orbit.rotation.y = Math.random() * Math.PI * 2;
  orbit.rotation.z = node.tilt;

  const body = new THREE.Group();
  body.position.set(node.orbit, 0, 0);
  body.userData.payload = node;
  body.userData.selectable = true;

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(node.size, 24, 16),
    new THREE.MeshStandardMaterial({ color: node.color, emissive: node.color, emissiveIntensity: 0.65, roughness: 0.34, metalness: 0.22 })
  );
  sphere.userData.payload = node;
  sphere.userData.selectable = true;
  body.add(sphere);

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(node.size * 1.65, 16, 12),
    new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  body.add(aura);

  const moons = [];
  const moonCount = node.id === 'projects' ? 3 : node.id === 'experiments' ? 2 : 1;
  for (let i = 0; i < moonCount; i += 1) moons.push(makeMoon(body, i, node.color, Math.max(0.055, node.size * (0.13 - i * 0.018))));

  orbit.add(body);
  const line = makeOrbitLine(node.orbit, node.color, node.id === 'archive' ? 0.08 : 0.13);
  line.rotation.z = node.tilt;
  line.userData.systemDecor = true;
  orbit.add(line);
  return { orbit, body, sphere, moons };
}

function makeCore(core) {
  const group = new THREE.Group();
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 36, 24),
    new THREE.MeshStandardMaterial({ color: 0xffe6a6, emissive: 0xffb72e, emissiveIntensity: 2.2, roughness: 0.18, metalness: 0.12 })
  );
  star.userData.payload = core;
  star.userData.selectable = true;
  group.add(star);

  const corona = new THREE.Mesh(
    new THREE.SphereGeometry(1.95, 28, 20),
    new THREE.MeshBasicMaterial({ color: 0xffb735, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(corona);
  group.add(new THREE.PointLight(0xffc66b, 10, 28, 2));

  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.55 + i * 0.3, 0.008, 5, 96),
      new THREE.MeshBasicMaterial({ color: 0xffd987, transparent: true, opacity: 0.25 - i * 0.055, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = Math.PI / 2 + i * 0.28;
    ring.rotation.z = i * 0.65;
    group.add(ring);
  }
  return { group, star, corona };
}

export function buildRNSystem(data) {
  const group = new THREE.Group();
  group.name = 'RN_SYSTEM';
  const core = makeCore(data.core);
  group.add(core.group);
  const nodes = [];
  data.nodes.forEach((node) => {
    const built = makeNode(node);
    group.add(built.orbit);
    nodes.push({ ...built, data: node });
  });

  const dustGeometry = new THREE.BufferGeometry();
  const dust = [];
  for (let i = 0; i < 180; i += 1) {
    const radius = 15 + Math.random() * 18;
    const angle = Math.random() * Math.PI * 2;
    dust.push(Math.cos(angle) * radius, (Math.random() - 0.5) * 4, Math.sin(angle) * radius);
  }
  dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dust, 3));
  group.add(new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0x8aa2cc, size: 0.035, transparent: true, opacity: 0.22, depthWrite: false })));

  return { group, core, nodes };
}
