import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SYSTEM_DATA, SCALE_DATA } from './data/content.js';

window.THREE = THREE;
const { buildRNSystem } = await import('./scene/system.js');
const { buildMilkyWay } = await import('./scene/galaxy.js');
const { makeCircularPointsMaterial } = await import('./scene/particles.js');

const root = document.getElementById('space');
const fallback = document.getElementById('fallback');
const loader = document.getElementById('loader');
const panel = document.getElementById('panel');
const panelClose = document.getElementById('panel-close');
const panelKicker = document.getElementById('panel-kicker');
const panelTitle = document.getElementById('panel-title');
const panelDescription = document.getElementById('panel-description');
const panelFields = document.getElementById('panel-fields');
const panelExtra = document.getElementById('panel-extra');
const focusLabel = document.getElementById('focus-label');
const scaleName = document.getElementById('scale-name');
const scaleDetail = document.getElementById('scale-detail');
const scaleButtons = [...document.querySelectorAll('[data-scale]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower = window.matchMedia('(max-width: 700px)').matches || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

function showFallback() {
  loader.classList.add('hidden');
  fallback.classList.add('visible');
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (error) { return false; }
}

if (!canUseWebGL() || !window.THREE) {
  showFallback();
} else {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02030a);
  scene.fog = new THREE.FogExp2(0x02030a, 0.00018);
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.08, 5000);
  camera.position.set(0, 6.5, 18.5);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: false, powerPreference: 'high-performance' });
  } catch (error) {
    showFallback();
  }

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.7));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    root.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.minDistance = 0.78;
    controls.maxDistance = 2700;
    controls.rotateSpeed = lowPower ? 0.42 : 0.52;
    controls.zoomSpeed = 0.72;
    if ('zoomToCursor' in controls) controls.zoomToCursor = true;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0x7f9dd8, 0x05060d, 0.5));
    const rim = new THREE.DirectionalLight(0x9dbdff, 0.55);
    rim.position.set(-7, 14, 12);
    scene.add(rim);

    function buildBackgroundStars() {
      const count = lowPower ? 900 : 2200;
      const positions = [];
      let seed = 81;
      const next = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < count; i += 1) {
        const radius = 960 + next() * 1850;
        const theta = next() * Math.PI * 2;
        const phi = Math.acos(2 * next() - 1);
        positions.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      return new THREE.Points(geometry, makeCircularPointsMaterial({ color: 0xdbe6ff, size: lowPower ? 4.4 : 5.4, opacity: 0.62 }));
    }

    function buildSolarNeighborhood() {
      const group = new THREE.Group();
      group.name = 'SOLAR_SYSTEM';
      const radii = [38, 58, 82, 112, 151, 191];
      radii.forEach((radius, index) => {
        const points = [];
        for (let i = 0; i <= 120; i += 1) {
          const angle = i / 120 * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: index % 2 ? 0x637aa9 : 0x879bc6, transparent: true, opacity: 0.07, depthWrite: false }));
        line.rotation.z = (index - 2) * 0.035;
        group.add(line);
        const planet = new THREE.Mesh(new THREE.SphereGeometry(0.7 + index * 0.08, 12, 8), new THREE.MeshStandardMaterial({ color: index % 2 ? 0x7894c6 : 0xd0a878, roughness: 0.8, metalness: 0.05, emissive: index % 2 ? 0x17284d : 0x2e1a12, emissiveIntensity: 0.4 }));
        planet.position.set(radius, (index - 2) * 0.8, 0);
        const planetOrbit = new THREE.Group();
        planetOrbit.rotation.y = index * 1.4;
        planetOrbit.add(planet);
        group.add(planetOrbit);
      });
      return group;
    }

    const starfield = buildBackgroundStars();
    const solar = buildSolarNeighborhood();
    const system = buildRNSystem(SYSTEM_DATA);
    const galaxy = buildMilkyWay(lowPower);
    scene.add(starfield, solar, system.group, galaxy);

    const state = { selected: null, selectedMesh: null, history: [], fly: null, lastScale: 'rn', pointerDown: null };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const tempVector = new THREE.Vector3();
    const clock = new THREE.Clock();

    function easeInOut(value) {
      return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
    }

    function updateScaleReadout() {
      const distance = camera.position.length();
      const scale = distance < 34 ? 'rn' : distance < 430 ? 'solar' : 'galaxy';
      const details = { rn: 'close orbit', solar: 'wider perspective', galaxy: 'outer boundary' };
      scaleName.textContent = scale === 'rn' ? 'RN SYSTEM' : scale === 'solar' ? 'SOLAR SYSTEM' : 'MILKY WAY';
      scaleDetail.textContent = details[scale];
      if (state.lastScale !== scale) {
        state.lastScale = scale;
        scaleButtons.forEach((button) => button.classList.toggle('active', button.dataset.scale === scale));
      }
    }

    function beginFly(position, target, duration) {
      state.fly = { fromPosition: camera.position.clone(), fromTarget: controls.target.clone(), toPosition: new THREE.Vector3(...position), toTarget: new THREE.Vector3(...target), start: performance.now(), duration: reducedMotion ? 30 : duration };
      controls.enabled = false;
    }

    function finishFly() {
      if (!state.fly) return;
      camera.position.copy(state.fly.toPosition);
      controls.target.copy(state.fly.toTarget);
      state.fly = null;
      controls.enabled = true;
      controls.update();
    }

    function stepFly(now) {
      if (!state.fly) return;
      const progress = Math.min(1, (now - state.fly.start) / state.fly.duration);
      const eased = easeInOut(progress);
      camera.position.lerpVectors(state.fly.fromPosition, state.fly.toPosition, eased);
      controls.target.lerpVectors(state.fly.fromTarget, state.fly.toTarget, eased);
      if (progress >= 1) finishFly();
    }

    function makeField(label, value) {
      const item = document.createElement('div');
      const key = document.createElement('div');
      key.className = 'panel-field-label';
      key.textContent = label;
      const val = document.createElement('div');
      val.className = 'panel-field-value';
      val.textContent = value;
      item.append(key, val);
      return item;
    }

    function makeLink(label, href) {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = href;
      if (href !== '#') { link.target = '_blank'; link.rel = 'noreferrer'; }
      return link;
    }

    function renderPanel(payload) {
      panelKicker.textContent = payload.kicker || 'SYSTEM OBJECT';
      panelTitle.textContent = payload.title || payload.label;
      panelDescription.textContent = payload.description || '';
      panelFields.replaceChildren();
      (payload.fields || []).forEach(([label, value]) => panelFields.appendChild(makeField(label, value)));
      panelExtra.replaceChildren();

      if (payload.projects) {
        payload.projects.forEach((project) => {
          const item = document.createElement('section');
          item.className = 'panel-project';
          const name = document.createElement('div'); name.className = 'project-name'; name.textContent = project.name;
          const meta = document.createElement('div'); meta.className = 'project-meta'; meta.textContent = project.date + '  ·  ' + project.technologies;
          const description = document.createElement('p'); description.className = 'project-description'; description.textContent = project.description;
          const links = document.createElement('div'); links.className = 'panel-links'; links.append(makeLink('OPEN', project.url), makeLink('GITHUB', project.github));
          item.append(name, meta, description, links); panelExtra.appendChild(item);
        });
      }

      const listItems = payload.experiments || payload.ideas || payload.notes || payload.archive;
      if (listItems) {
        const list = document.createElement('ul'); list.className = 'panel-list';
        listItems.forEach((item) => { const li = document.createElement('li'); li.textContent = item; list.appendChild(li); });
        panelExtra.appendChild(list);
      }
      panel.classList.add('open');
    }

    function closePanel(restore) {
      panel.classList.remove('open');
      focusLabel.classList.remove('visible');
      if (restore && state.history.length) {
        const previous = state.history.pop();
        beginFly(previous.position.toArray(), previous.target.toArray(), 820);
      }
      state.selected = null;
      state.selectedMesh = null;
    }

    function focusObject(payload, mesh) {
      const worldPosition = new THREE.Vector3();
      mesh.getWorldPosition(worldPosition);
      state.history.push({ position: camera.position.clone(), target: controls.target.clone() });
      state.selected = payload;
      state.selectedMesh = mesh;
      renderPanel(payload);
      const direction = camera.position.clone().sub(worldPosition);
      if (direction.lengthSq() < 0.01) direction.set(0.35, 0.3, 1);
      direction.normalize();
      const distance = payload.kind === 'core' ? 6.7 : Math.max(4.7, (payload.size || 0.4) * 8.5);
      beginFly(worldPosition.clone().add(direction.multiplyScalar(distance)).toArray(), worldPosition.toArray(), 920);
    }

    function pickAt(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      const hit = hits.find((item) => item.object.userData && item.object.userData.selectable && item.object.userData.payload);
      if (hit) focusObject(hit.object.userData.payload, hit.object);
    }

    renderer.domElement.addEventListener('pointerdown', (event) => { state.pointerDown = { x: event.clientX, y: event.clientY }; });
    renderer.domElement.addEventListener('pointerup', (event) => {
      if (!state.pointerDown) return;
      const distance = Math.hypot(event.clientX - state.pointerDown.x, event.clientY - state.pointerDown.y);
      if (distance < 7) pickAt(event.clientX, event.clientY);
      state.pointerDown = null;
    });
    renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());

    scaleButtons.forEach((button) => button.addEventListener('click', () => {
      const destination = SCALE_DATA[button.dataset.scale];
      state.history = [];
      closePanel(false);
      beginFly(destination.position, destination.target, 1100);
    }));
    panelClose.addEventListener('click', () => closePanel(true));
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePanel(true);
      if (event.key === '1') beginFly(SCALE_DATA.rn.position, SCALE_DATA.rn.target, 900);
      if (event.key === '2') beginFly(SCALE_DATA.solar.position, SCALE_DATA.solar.target, 1000);
      if (event.key === '3') beginFly(SCALE_DATA.galaxy.position, SCALE_DATA.galaxy.target, 1100);
    });

    function updateFocusLabel() {
      if (!state.selected || !state.selectedMesh || !panel.classList.contains('open')) return;
      state.selectedMesh.getWorldPosition(tempVector);
      tempVector.project(camera);
      const visible = tempVector.z > -1 && tempVector.z < 1;
      if (!visible) { focusLabel.classList.remove('visible'); return; }
      focusLabel.textContent = state.selected.label;
      focusLabel.style.left = ((tempVector.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      focusLabel.style.top = ((-tempVector.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      focusLabel.classList.add('visible');
    }

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      stepFly(performance.now());
      system.nodes.forEach((node) => {
        node.orbit.rotation.y += node.data.speed;
        node.sphere.rotation.y += 0.002;
        node.moons.forEach((moon) => { moon.pivot.rotation.y += moon.speed; });
      });
      system.core.group.rotation.y = elapsed * 0.06;
      system.core.star.scale.setScalar(1 + Math.sin(elapsed * 1.7) * 0.025);
      galaxy.rotation.y = elapsed * 0.004;
      const galaxyFade = THREE.MathUtils.smoothstep(camera.position.length(), 230, 760);
      galaxy.traverse((object) => {
        if (object.material && object.material.userData && object.material.userData.baseOpacity !== undefined) object.material.opacity = object.material.userData.baseOpacity * galaxyFade;
      });
      solar.children.forEach((child, index) => { if (child.type === 'Group') child.rotation.y += 0.00025 + index * 0.00003; });
      if (!state.fly) controls.update();
      updateScaleReadout();
      updateFocusLabel();
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.7));
    });

    requestAnimationFrame(() => {
      loader.classList.add('hidden');
      animate();
    });
  }
}
