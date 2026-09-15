import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

const root = document.getElementById('space');
const loader = document.getElementById('loader');
const card = document.getElementById('card');
const cardKicker = document.getElementById('card-kicker');
const cardTitle = document.getElementById('card-title');
const cardCopy = document.getElementById('card-copy');
const toast = document.getElementById('toast');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 700px)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
} catch (error) {
  throw new Error('WebGL unavailable', { cause: error });
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050a);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 5000);
camera.position.set(0, 7, 24);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
root.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.045;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 4.5;
controls.maxDistance = 900;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.8;
if ('zoomToCursor' in controls) controls.zoomToCursor = true;

scene.add(new THREE.AmbientLight(0x8294b8, 0.28));
const keyLight = new THREE.PointLight(0xbfd8ff, 2.8, 260, 1.4);
keyLight.position.set(12, 18, 10);
scene.add(keyLight);

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function particleField(count, radius, color, size, opacity, seed) {
  const random = rng(seed);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = radius * (0.5 + random() * 0.5);
    const u = random() * 2 - 1;
    const a = random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = Math.cos(a) * s * r;
    positions[i * 3 + 1] = u * r;
    positions[i * 3 + 2] = Math.sin(a) * s * r;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
}

const starfield = new THREE.Group();
starfield.add(particleField(mobile ? 3200 : 7600, 1300, 0xd7e5ff, mobile ? 0.7 : 0.9, 0.82, 11));
starfield.add(particleField(mobile ? 700 : 1700, 1050, 0xffc88f, mobile ? 0.8 : 1.0, 0.35, 19));
scene.add(starfield);

const universe = new THREE.Group();
scene.add(universe);

const core = new THREE.Group();
universe.add(core);
const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xf1f6ff });
const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(2.1, 36, 24), coreMaterial);
core.add(coreMesh);
const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(3.6, 28, 18), new THREE.MeshBasicMaterial({ color: 0x77b7ff, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false }));
core.add(coreGlow);
const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.035, 8, 160), new THREE.MeshBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
ring.rotation.x = Math.PI * 0.36;
core.add(ring);

const labels = [
  ['PROJECTS', 7.0, 0x63a9ff, 'Work, builds and shipped experiments.'],
  ['EXPERIMENTS', 8.2, 0x80e4c2, 'Things being tested, measured and broken.'],
  ['IDEAS', 9.4, 0xffbd78, 'Early concepts and strange directions.'],
  ['NOTES', 10.6, 0xc8a6ff, 'Observations, learning and fragments.'],
  ['ABOUT', 11.8, 0xe7edf7, 'The person behind RN.'],
  ['ARCHIVE', 13.0, 0x8da2c5, 'Older work and preserved history.'],
];
const orbitGroups = [];
const selectable = [];

for (let i = 0; i < labels.length; i += 1) {
  const [name, radius, color, description] = labels[i];
  const orbit = new THREE.Group();
  orbit.rotation.y = (i / labels.length) * Math.PI * 2;
  const linePoints = [];
  for (let j = 0; j <= 160; j += 1) {
    const a = (j / 160) * Math.PI * 2;
    linePoints.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  orbit.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(linePoints), new THREE.LineBasicMaterial({ color: 0x7387aa, transparent: true, opacity: 0.13, depthWrite: false })));
  const anchor = new THREE.Group();
  anchor.position.x = radius;
  orbit.add(anchor);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 18), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.16, roughness: 0.45 }));
  anchor.add(mesh);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.0, 18, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false }));
  anchor.add(halo);
  core.add(orbit);
  orbitGroups.push({ orbit, speed: 0.04 - i * 0.002 });
  selectable.push({ mesh, name, description });
}

function showMessage(text) {
  toast.textContent = text;
  toast.classList.add('visible');
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => toast.classList.remove('visible'), 2000);
}

function resetView(animated = true) {
  const from = camera.position.clone();
  const fromTarget = controls.target.clone();
  const to = new THREE.Vector3(0, 7, 24);
  const target = new THREE.Vector3(0, 0, 0);
  const duration = reducedMotion || !animated ? 0 : 700;
  if (!duration) {
    camera.position.copy(to);
    controls.target.copy(target);
    controls.update();
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    camera.position.lerpVectors(from, to, e);
    controls.target.lerpVectors(fromTarget, target, e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function pick(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(selectable.map((item) => item.mesh), false)[0]?.object || null;
}

let down = null;
renderer.domElement.addEventListener('pointerdown', (event) => { down = { x: event.clientX, y: event.clientY }; });
renderer.domElement.addEventListener('pointerup', (event) => {
  if (!down) return;
  if (Math.hypot(event.clientX - down.x, event.clientY - down.y) < 8) {
    const mesh = pick(event.clientX, event.clientY);
    const item = selectable.find((entry) => entry.mesh === mesh);
    if (item) {
      cardKicker.textContent = `RN SYSTEM · ${item.name}`;
      cardTitle.textContent = item.name;
      cardCopy.textContent = item.description;
      card.classList.remove('hidden');
      showMessage(`SELECTED · ${item.name}`);
    }
  }
  down = null;
});

document.getElementById('close').addEventListener('click', () => card.classList.add('hidden'));
document.getElementById('reset-camera').addEventListener('click', () => resetView(true));
document.getElementById('help').addEventListener('click', () => showMessage('DRAG TO ORBIT · SCROLL TO ZOOM · TAP AN ORBITING OBJECT'));

const clock = new THREE.Clock();
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  if (!reducedMotion) {
    starfield.rotation.y = elapsed * 0.003;
    starfield.rotation.x = Math.sin(elapsed * 0.08) * 0.006;
    core.rotation.y = elapsed * 0.08;
    ring.rotation.z = elapsed * 0.22;
    coreGlow.scale.setScalar(1 + Math.sin(elapsed * 1.6) * 0.035);
    orbitGroups.forEach((entry, index) => {
      entry.orbit.rotation.y += entry.speed * dt;
      entry.orbit.children[1].rotation.y += (0.8 + index * 0.05) * dt;
    });
  }
  controls.update();
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

loader.classList.add('hidden');
showMessage('RN UNIVERSE READY');
resetView(false);
animate();
