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
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
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

let imageTexture = null;
let imageAspect = 1;

function fit(texture) {
  imageAspect = texture.image.width / texture.image.height;
  const viewport = innerWidth / innerHeight;
  if (imageAspect >= viewport) {
    plane.scale.set(imageAspect / viewport, 1, 1);
  } else {
    plane.scale.set(1, viewport / imageAspect, 1);
  }
  plane.position.set(0, 0, 0);
}

function updateZoom() {
  zoomReadout.textContent = `ZOOM ${camera.zoom.toFixed(2)}×`;
}

function mountTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  material.map = texture;
  material.needsUpdate = true;
  imageTexture = texture;

  fit(texture);
  camera.zoom = 1;
  controls.target.set(0, 0, 0);
  controls.update();
  updateZoom();
  loader.classList.add('hidden');
}

const imageLoader = new THREE.TextureLoader();
imageLoader.load(
  './assets/galaxy.jpg?v=20260915-normal',
  mountTexture,
  undefined,
  () => {
    loader.querySelector('.loader-sub').textContent = 'GALAXY IMAGE NOT FOUND · CHECK /assets/galaxy.jpg';
  }
);

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

renderer.domElement.addEventListener('dblclick', () => resetView.click());

addEventListener('resize', () => {
  camera.left = -1;
  camera.right = 1;
  camera.top = 1;
  camera.bottom = -1;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (imageTexture) fit(imageTexture);
});

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

render();
