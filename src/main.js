import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SYSTEM_DATA, SCALE_DATA } from './data/content.js';

window.THREE = THREE;
const { buildRNSystem } = await import('./scene/system.js?v=20260915-6');
const { buildMilkyWay } = await import('./scene/galaxy.js?v=20260915-6');
const { buildSolarSystem } = await import('./scene/solar.js?v=20260915-2');
const { makeCircularPointsMaterial } = await import('./scene/particles.js?v=20260915-6');

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
      const count = lowPower ? 2300 : 6200;
      const positions = [];
      let seed = 81;
      const next = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < count; i += 1) {
        const radius = 850 + next() * 2200;
        const theta = next() * Math.PI * 2;
        const phi = Math.acos(2 * next() - 1);
        positions.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const points = new THREE.Points(geometry, makeCircularPointsMaterial({ color: 0xdbe6ff, size: lowPower ? 4.1 : 5.2, opacity: 0.9 }));
      points.name = 'DEEP_SPACE_STARS';
      points.userData.advance = (elapsed) => {
        points.rotation.y = elapsed * 0.00028;
        points.rotation.x = Math.sin(elapsed * 0.025) * 0.002;
      };
      return points;
    }

    const starfield = buildBackgroundStars();
    const solar = buildSolarSystem(lowPower);
    const system = buildRNSystem(SYSTEM_DATA);
    const galaxy = buildMilkyWay(lowPower);
    scene.add(starfield, solar, system.group, galaxy);

    const state = {
      selected: null,
      selectedMesh: null,
      hovered: null,
      hoveredMesh: null,
      history: [],
      fly: null,
      lastScale: 'rn',
      pointerDown: null,
      pointer: { x: 0, y: 0 },
    };
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

    function setHover(mesh) {
      if (state.hoveredMesh === mesh) return;
      clearHover();
      if (!mesh) return;
      state.hoveredMesh = mesh;
      state.hovered = mesh.userData.payload;
      const payload = mesh.userData.payload;
      const visual = mesh.userData.visual || mesh;
      if (visual.scale) visual.scale.setScalar(mesh.userData.baseScale ? mesh.userData.baseScale * 1.18 : 1.18);
      if (visual.material && 'emissiveIntensity' in visual.material) visual.material.emissiveIntensity = (visual.userData.baseEmissive || 0.65) * 1.8;
      focusLabel.textContent = payload.label;
      focusLabel.classList.add('hovering');
      focusLabel.classList.add('visible');
    }

    function clearHover() {
      if (!state.hoveredMesh) return;
      const mesh = state.hoveredMesh;
      const visual = mesh.userData.visual || mesh;
      if (visual.scale) visual.scale.setScalar(mesh.userData.baseScale || 1);
      if (visual.material && 'emissiveIntensity' in visual.material) visual.material.emissiveIntensity = visual.userData.baseEmissive || 0.65;
      state.hoveredMesh = null;
      state.hovered = null;
      focusLabel.classList.remove('hovering');
      if (!state.selected) focusLabel.classList.remove('visible');
    }

    function findSelectable(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      return hits.find((item) => item.object.userData && item.object.userData.selectable && item.object.userData.payload);
    }

    function focusObject(payload, mesh) {
      clearHover();
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
      const hit = findSelectable(clientX, clientY);
      if (hit) focusObject(hit.object.userData.payload, hit.object);
    }

    function updateHover(clientX, clientY) {
      if (state.fly || !window.matchMedia('(hover: hover)').matches) return;
      const hit = findSelectable(clientX, clientY);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
      setHover(hit ? hit.object : null);
    }

    renderer.domElement.addEventListener('pointermove', (event) => {
      state.pointer.x = event.clientX;
      state.pointer.y = event.clientY;
      updateHover(event.clientX, event.clientY);
    });
    renderer.domElement.addEventListener('pointerleave', () => {
      renderer.domElement.style.cursor = 'grab';
      clearHover();
    });
    renderer.domElement.addEventListener('pointerdown', (event) => { state.pointerDown = { x: event.clientX, y: event.clientY }; renderer.domElement.style.cursor = 'grabbing'; });
    renderer.domElement.addEventListener('pointerup', (event) => {
      renderer.domElement.style.cursor = 'grab';
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
      clearHover();
      beginFly(destination.position, destination.target, 1100);
    }));
    panelClose.addEventListener('click', () => closePanel(true));
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePanel(true);
      if (event.key === '1') beginFly(SCALE_DATA.rn.position, SCALE_DATA.rn.target, 900);
      if (event.key === '2') beginFly(SCALE_DATA.solar.position, SCALE_DATA.solar.target, 1000);
      if (event.key === '3') beginFly(SCALE_DATA.galaxy.position, SCALE_DATA.galaxy.target, 1100);
    });

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

    function updateFocusLabel() {
      const mesh = state.selectedMesh || state.hoveredMesh;
      if (!mesh) return;
      mesh.getWorldPosition(tempVector);
      tempVector.project(camera);
      const visible = tempVector.z > -1 && tempVector.z < 1;
      if (!visible) { focusLabel.classList.remove('visible'); return; }
      const payload = state.selected || state.hovered;
      focusLabel.textContent = payload ? payload.label : '';
      focusLabel.style.left = ((tempVector.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      focusLabel.style.top = ((-tempVector.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      focusLabel.classList.add('visible');
    }

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      stepFly(performance.now());
      if (starfield.userData.advance) starfield.userData.advance(elapsed);
      system.nodes.forEach((node) => {
        node.orbit.rotation.y += node.data.speed;
        node.sphere.rotation.y += 0.002;
        node.moons.forEach((moon) => { moon.pivot.rotation.y += moon.speed; });
      });
      system.core.group.rotation.y = elapsed * 0.06;
      system.core.star.scale.setScalar(1 + Math.sin(elapsed * 1.7) * 0.025);
      if (galaxy.userData.advance) galaxy.userData.advance(elapsed, clock.getDelta());
      if (solar.userData.advance) solar.userData.advance(elapsed);
      const galaxyFade = THREE.MathUtils.smoothstep(camera.position.length(), 120, 610);
      const rnOrbitFade = 1 - THREE.MathUtils.smoothstep(camera.position.length(), 22, 160);
      const solarFade = 1 - THREE.MathUtils.smoothstep(camera.position.length(), 165, 445);
      galaxy.traverse((object) => {
        if (object.material && object.material.userData && object.material.userData.baseOpacity !== undefined) {
          const opacity = object.material.userData.baseOpacity * galaxyFade;
          object.material.opacity = opacity;
          if (object.material.uniforms && object.material.uniforms.uOpacity) object.material.uniforms.uOpacity.value = opacity;
        }
      });
      system.group.traverse((object) => {
        if (object.material && object.material.userData && object.material.userData.rnOrbit) object.material.opacity = object.material.userData.baseOpacity * rnOrbitFade;
      });
      solar.traverse((object) => {
        if (object.material && object.material.userData && object.material.userData.baseOpacity !== undefined) object.material.opacity = object.material.userData.baseOpacity * solarFade;
      });
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
      renderer.domElement.style.cursor = 'grab';
      loader.classList.add('hidden');
      animate();
    });
  }
}
