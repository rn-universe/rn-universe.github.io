import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const root = document.getElementById('space');
const loader = document.getElementById('loader');
const scaleLabel = document.getElementById('scale-label');
const scaleSub = document.getElementById('scale-sub');
const scaleChip = document.getElementById('scale-chip');
const zoomReadout = document.getElementById('zoom-readout');
const helpPanel = document.getElementById('help-panel');
const helpButton = document.getElementById('help');

const lowPower = matchMedia('(max-width: 700px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 7000);
camera.position.set(0, 165, 980);

const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
root.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.045;
controls.enablePan = false;
controls.rotateSpeed = lowPower ? 0.36 : 0.5;
controls.zoomSpeed = lowPower ? 0.58 : 0.78;
controls.minDistance = 28;
controls.maxDistance = 3400;
controls.target.set(0, 0, 0);
if ('zoomToCursor' in controls) controls.zoomToCursor = true;

const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), lowPower ? 0.72 : 0.95, 0.8, 0.72);
bloom.threshold = 0.02;
bloom.radius = 0.9;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloom);

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const random = rng(9021001);

function makeGalaxyStars(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const arms = 5;
  const colorA = new THREE.Color().setRGB(0.35, 0.55, 1.0);
  const colorB = new THREE.Color().setRGB(1.0, 0.72, 0.42);
  const colorC = new THREE.Color().setRGB(0.92, 0.95, 1.0);

  for (let i = 0; i < count; i += 1) {
    const coreBias = Math.pow(random(), 1.42);
    const radius = 20 + coreBias * 545;
    const arm = Math.floor(random() * arms);
    const spiral = radius * 0.0205;
    const jitter = (random() - 0.5) * (0.16 + radius * 0.0020);
    const angle = arm * (Math.PI * 2 / arms) + spiral + jitter;
    const tangent = (random() - 0.5) * (16 + radius * 0.085);
    const radial = radius + (random() - 0.5) * (9 + radius * 0.05);
    const x = Math.cos(angle) * radial + Math.cos(angle + Math.PI / 2) * tangent;
    const z = Math.sin(angle) * radial + Math.sin(angle + Math.PI / 2) * tangent;
    const thickness = (1 - radial / 620) * 17 + 2;
    const y = (random() - 0.5) * Math.max(2, thickness);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const outer = Math.min(1, radial / 520);
    const starType = random();
    const c = starType < 0.17 ? colorB : starType < 0.6 ? colorA : colorC;
    const mix = Math.min(1, 0.15 + outer * 0.45 + random() * 0.35);
    colors[i * 3] = c.r * (0.75 + mix * 0.25);
    colors[i * 3 + 1] = c.g * (0.75 + mix * 0.25);
    colors[i * 3 + 2] = c.b * (0.8 + mix * 0.2);
    sizes[i] = 0.65 + random() * (radial < 130 ? 2.2 : 1.2);
    phases[i] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(devicePixelRatio || 1, 2) },
    },
    vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aPhase; varying vec3 vColor; varying float vPhase; uniform float uTime; uniform float uPixelRatio; void main(){vColor=aColor;vPhase=aPhase;vec4 mv=modelViewMatrix*vec4(position,1.0);float tw=0.92+0.11*sin(uTime*1.7+aPhase);gl_PointSize=aSize*uPixelRatio*(420.0/-mv.z)*tw;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying vec3 vColor; varying float vPhase; uniform float uTime; void main(){vec2 p=gl_PointCoord-0.5;float d=length(p);if(d>0.5)discard;float glow=smoothstep(0.5,0.0,d);float halo=smoothstep(0.5,0.12,d);float tw=0.82+0.18*sin(uTime*1.8+vPhase);gl_FragColor=vec4(vColor*(0.55+0.75*halo)*tw,glow*(0.55+0.45*halo));}`,
  });
  return { points: new THREE.Points(geometry, material), material };
}

function makeDust(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const radius = 70 + Math.pow(random(), 0.55) * 500;
    const arm = Math.floor(random() * 5);
    const angle = arm * (Math.PI * 2 / 5) + radius * 0.0205 + (random() - 0.5) * 0.22;
    const band = (random() - 0.5) * (34 + radius * 0.05);
    positions[i * 3] = Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * band;
    positions[i * 3 + 1] = (random() - 0.5) * (6 + radius * 0.015);
    positions[i * 3 + 2] = Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * band;
    const warm = random();
    colors[i * 3] = warm < 0.5 ? 0.22 : 0.38;
    colors[i * 3 + 1] = warm < 0.5 ? 0.09 : 0.18;
    colors[i * 3 + 2] = warm < 0.5 ? 0.12 : 0.36;
    phases[i] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute vec3 aColor;attribute float aPhase;varying vec3 vColor;varying float vPhase;void main(){vColor=aColor;vPhase=aPhase;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=(2.0+2.0*sin(aPhase))*260.0/-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying vec3 vColor;varying float vPhase;uniform float uTime;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);if(d>.5)discard;float a=smoothstep(.5,.05,d)*.1;gl_FragColor=vec4(vColor,a);}`,
  });
  return { points: new THREE.Points(geometry, material), material };
}

function makeBackgroundStars(count) {
  const positions = new Float32Array(count * 3);
  const rand = rng(710221);
  for (let i = 0; i < count; i += 1) {
    const radius = 900 + rand() * 2200;
    const u = rand() * 2 - 1;
    const phi = Math.acos(u);
    const theta = rand() * Math.PI * 2;
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.cos(phi) * radius;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xaebcdf, size: lowPower ? 0.85 : 1.15, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending });
  return new THREE.Points(geometry, material);
}

function makeGlow(color, size) {
  const geometry = new THREE.SphereGeometry(size, 48, 32);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms: { uColor: { value: new THREE.Color(color) } },
    vertexShader: `varying vec3 vPos;void main(){vPos=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform vec3 uColor;varying vec3 vPos;void main(){float a=pow(max(0.0,1.0-length(vPos)),1.6);gl_FragColor=vec4(uColor,a*.55);}`,
  });
  return new THREE.Mesh(geometry, material);
}

const galaxy = new THREE.Group();
galaxy.rotation.x = 0.28;
galaxy.rotation.z = -0.08;
scene.add(galaxy);

galaxy.add(makeBackgroundStars(lowPower ? 6000 : 15000));
const starField = makeGalaxyStars(lowPower ? 30000 : 90000);
galaxy.add(starField.points);
const dust = makeDust(lowPower ? 7000 : 20000);
galaxy.add(dust.points);
const bulge = makeGalaxyStars(lowPower ? 12000 : 30000);
galaxy.add(bulge.points);
bulge.points.scale.setScalar(0.22);

const core = new THREE.Mesh(new THREE.SphereGeometry(58, 64, 40), new THREE.MeshBasicMaterial({ color: 0xffdca0, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }));
galaxy.add(core);
const coreGlow1 = makeGlow(0xffb36f, 85);
galaxy.add(coreGlow1);
const coreGlow2 = makeGlow(0xffe6c5, 38);
galaxy.add(coreGlow2);
galaxy.add(new THREE.PointLight(0xffbb7d, 8, 900, 2));

const armGlowPoints = makeGalaxyStars(lowPower ? 4500 : 12000);
armGlowPoints.points.scale.setScalar(1.02);
galaxy.add(armGlowPoints.points);

const spiralHalo = new THREE.Mesh(new THREE.RingGeometry(120, 580, 256, 12), new THREE.MeshBasicMaterial({ color: 0x24477e, transparent: true, opacity: 0.035, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
galaxy.add(spiralHalo);

let running = !reduceMotion;
let t = 0;
const clock = new THREE.Clock();
const scaleNames = ['GALAXY EDGE', 'OUTER DISK', 'SPIRAL ARMS', 'STELLAR FIELDS', 'GALACTIC CORE'];

function updateHUD() {
  const distance = camera.position.distanceTo(controls.target);
  const zoom = Math.max(0.2, 980 / distance);
  zoomReadout.textContent = `ZOOM ${zoom.toFixed(1)}×`;
  let index = 0;
  if (distance < 820) index = 1;
  if (distance < 560) index = 2;
  if (distance < 300) index = 3;
  if (distance < 145) index = 4;
  scaleLabel.textContent = 'MILKY WAY';
  scaleSub.textContent = scaleNames[index];
  scaleChip.textContent = index === 0 ? 'GALACTIC VIEW' : `ZOOMING · ${scaleNames[index]}`;
}

function resetView() {
  const from = camera.position.clone();
  const to = new THREE.Vector3(0, 165, 980);
  const fromTarget = controls.target.clone();
  const toTarget = new THREE.Vector3(0, 0, 0);
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - start) / 800);
    const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    camera.position.lerpVectors(from, to, eased);
    controls.target.lerpVectors(fromTarget, toTarget, eased);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

renderer.domElement.addEventListener('dblclick', resetView);
helpButton.addEventListener('click', () => helpPanel.classList.toggle('hidden'));

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(0.05, clock.getDelta());
  if (running) {
    t += delta;
    starField.points.rotation.y = t * 0.0007;
    starField.points.rotation.x = Math.sin(t * 0.12) * 0.003;
    galaxy.rotation.y = t * 0.0021;
    starField.material.uniforms.uTime.value = t;
    armGlowPoints.material.uniforms.uTime.value = t;
    dust.material.uniforms.uTime.value = t;
    coreGlow1.scale.setScalar(1 + Math.sin(t * 0.42) * 0.018);
    coreGlow2.scale.setScalar(1 + Math.sin(t * 0.9) * 0.028);
  }
  controls.update();
  updateHUD();
  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.resolution.set(innerWidth, innerHeight);
});

loader.classList.add('fade');
setTimeout(() => loader.remove(), 800);
animate();