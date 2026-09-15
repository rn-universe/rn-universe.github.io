import * as THREE from 'three';

window.THREE = THREE;

try {
  await import('./main.js?v=20260915-21');
} catch (error) {
  console.error('RN UNIVERSE failed to initialize:', error);
  const loader = document.getElementById('loader');
  const toast = document.getElementById('toast');
  if (loader) loader.classList.add('hidden');
  if (toast) {
    toast.textContent = '3D ENGINE ERROR · RELOAD PAGE';
    toast.classList.add('visible');
  }
}
