import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const root = document.getElementById('space');
const loader = document.getElementById('loader');
const fileInput = document.getElementById('galaxy-file');
const zoomReadout = document.getElementById('zoom-readout');
const resetView = document.getElementById('reset-view');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
root.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = false;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.enableZoom = true;
controls.zoomSpeed = 0.9;
controls.panSpeed = 0.85;
controls.minZoom = 1;
controls.maxZoom = 14;
controls.target.set(0, 0, 0);

const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(plane);

function fit(texture) {
  const aspect = texture.image.width / texture.image.height;
  const viewport = innerWidth / innerHeight;
  plane.scale.set(aspect >= viewport ? aspect / viewport : 1, aspect >= viewport ? 1 : viewport / aspect, 1);
}

function mountTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  material.map = texture;
  material.needsUpdate = true;
  fit(texture);
  camera.zoom = 1;
  controls.target.set(0, 0, 0);
  controls.update();
  loader.classList.add('hidden');
  updateZoom();
}

function updateZoom() {
  zoomReadout.textContent = `ZOOM ${camera.zoom.toFixed(2)}×`;
}

function loadLocalFallback() {
  loader.innerHTML = '<div class="loader-title">RN UNIVERSE</div><div class="loader-sub">SELECT YOUR EXACT GALAXY IMAGE BELOW</div>';
  loader.classList.remove('hidden');
}

const imageLoader = new THREE.TextureLoader();
imageLoader.load('./assets/galaxy.jpg?v=20260915-1', mountTexture, undefined, loadLocalFallback);

fileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  imageLoader.load(url, (texture) => {
    mountTexture(texture);
    URL.revokeObjectURL(url);
  });
});

controls.addEventListener('change', updateZoom);
resetView.addEventListener('click', () => {
  camera.zoom = 1;
  controls.target.set(0, 0, 0);
  controls.update();
  updateZoom();
});

addEventListener('resize', () => {
  camera.left = -1;
  camera.right = 1;
  camera.top = 1;
  camera.bottom = -1;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (material.map) fit(material.map);
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
