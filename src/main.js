import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createSolarView } from './solar-view.js?v=20260915-1';

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

const solar = createSolarView();
scene.add(solar);
const solarCamera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.05, 1200);
solarCamera.position.set(0, 18, 46);
const solarControls = new OrbitControls(solarCamera, renderer.domElement);
solarControls.enableDamping = true;
solarControls.dampingFactor = 0.05;
solarControls.minDistance = 10;
solarControls.maxDistance = 240;
solarControls.enablePan = true;
solarControls.enabled = false;
solarControls.target.set(0, 0, 0);
solar.add(new THREE.HemisphereLight(0x7e92bc, 0x03040a, .42));
const solarRim = new THREE.DirectionalLight(0xa5c7ff, .6);
solarRim.position.set(12, 25, 18);
solar.add(solarRim);

let mode = 'galaxy';
let imageTexture = null;
let imageAspect = 1;
const clock = new THREE.Clock();
let simTime = 0;

function fit(texture) {
  imageAspect = texture.image.width / texture.image.height;
  const viewport = innerWidth / innerHeight;
  plane.scale.set(imageAspect >= viewport ? imageAspect / viewport : 1, imageAspect >= viewport ? 1 : viewport / imageAspect, 1);
  plane.position.z = 0;
}

function fitSolarBackdrop() {
  const width = 900;
  plane.scale.set(imageAspect >= 1 ? width : width * imageAspect, imageAspect >= 1 ? width / imageAspect : width, 1);
  plane.position.z = -280;
}

function setMode(next) {
  mode = next;
  if (mode === 'galaxy') {
    solar.visible = false;
    controls.enabled = true;
    solarControls.enabled = false;
    plane.position.z = 0;
  } else {
    solar.visible = true;
    controls.enabled = false;
    solarControls.enabled = true;
    fitSolarBackdrop();
    solarCamera.aspect = innerWidth / innerHeight;
    solarCamera.updateProjectionMatrix();
  }
}

function updateZoom() {
  if (mode === 'galaxy') {
    zoomReadout.textContent = `ZOOM ${camera.zoom.toFixed(2)}×`;
    if (camera.zoom >= 9) setMode('solar');
  } else {
    zoomReadout.textContent = 'SOLAR SYSTEM · DEEP ZOOM';
  }
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
  setMode('galaxy');
  loader.classList.add('hidden');
  updateZoom();
}

const imageLoader = new THREE.TextureLoader();
imageLoader.load('./assets/galaxy.jpg?v=20260915-final', mountTexture, undefined, () => {
  loader.querySelector('.loader-sub').textContent = 'GALAXY IMAGE NOT FOUND · CHECK /assets/galaxy.jpg';
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  imageLoader.load(url, (texture) => { mountTexture(texture); URL.revokeObjectURL(url); });
});

controls.addEventListener('change', updateZoom);
solarControls.addEventListener('change', () => { if (mode === 'solar') zoomReadout.textContent = 'SOLAR SYSTEM · DEEP ZOOM'; });

resetView.addEventListener('click', () => {
  setMode('galaxy');
  camera.zoom = 1;
  controls.target.set(0, 0, 0);
  controls.update();
  updateZoom();
});
renderer.domElement.addEventListener('dblclick', () => resetView.click());

addEventListener('resize', () => {
  camera.left = -1; camera.right = 1; camera.top = 1; camera.bottom = -1; camera.updateProjectionMatrix();
  solarCamera.aspect = innerWidth / innerHeight;
  solarCamera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (imageTexture) { if (mode === 'galaxy') fit(imageTexture); else fitSolarBackdrop(); }
});

function render() {
  requestAnimationFrame(render);
  const dt = Math.min(.05, clock.getDelta());
  simTime += dt;
  if (solar.userData.advance) solar.userData.advance(simTime);
  if (mode === 'galaxy') renderer.render(scene, camera);
  else renderer.render(scene, solarCamera);
}
render();
