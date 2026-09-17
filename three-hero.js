/**
 * three-hero.js — ThreeUI-inspired Interactive 3D Canvas Background
 * Mohamed Elnady Portfolio
 *
 * Features:
 * - Interactive 3D particle wave field & floating geometric constellation
 * - Dynamic mouse tracking & spring lerp physics
 * - Full Dark/Light theme reactivity (color & fog adaptation)
 * - Battery & GPU optimization (IntersectionObserver pauses rendering when off-screen)
 * - Accessible: respects prefers-reduced-motion
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const container = document.getElementById('heroThreeContainer');
  if (!container) return;

  // Check WebGL support
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLAvailable() || typeof THREE === 'undefined') {
    return;
  }

  // Accessibility: prefers-reduced-motion check
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scene setup
  const scene = new THREE.Scene();

  // Camera setup
  const fov = 60;
  let aspect = container.clientWidth / container.clientHeight || 1;
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
  camera.position.set(0, 28, 65);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  container.appendChild(renderer.domElement);

  // Particle texture generation (soft glowing orb)
  function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  const particleTexture = createParticleTexture();

  // Theme palettes (Dark mode vs Light mode)
  const palettes = {
    dark: {
      color1: new THREE.Color('#00d4aa'), // Signature Teal
      color2: new THREE.Color('#38bdf8'), // Electric Sky Blue
      color3: new THREE.Color('#818cf8'), // Neon Indigo
      ringColor: new THREE.Color('#38bdf8'),
      particleOpacity: 0.85,
      fogColor: new THREE.Color('#070e18')
    },
    light: {
      color1: new THREE.Color('#0d9488'), // Darker Teal
      color2: new THREE.Color('#2563eb'), // Vibrant Blue
      color3: new THREE.Color('#6366f1'), // Royal Indigo
      ringColor: new THREE.Color('#0d9488'),
      particleOpacity: 0.65,
      fogColor: new THREE.Color('#f8fafc')
    }
  };

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  let currentPalette = palettes[getCurrentTheme()];

  // 1. Particle Grid / Wave Field
  const cols = 55;
  const rows = 40;
  const particleCount = cols * rows;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);

  const spacingX = 2.4;
  const spacingZ = 2.4;
  const offsetX = (cols * spacingX) / 2;
  const offsetZ = (rows * spacingZ) / 2;

  let idx = 0;
  for (let ix = 0; ix < cols; ix++) {
    for (let iz = 0; iz < rows; iz++) {
      const x = ix * spacingX - offsetX;
      const z = iz * spacingZ - offsetZ;
      const y = Math.sin(ix * 0.25) * Math.cos(iz * 0.25) * 3;

      particlePositions[idx * 3] = x;
      particlePositions[idx * 3 + 1] = y;
      particlePositions[idx * 3 + 2] = z;

      // Color interpolation along diagonal
      const t = (ix / cols + iz / rows) * 0.5;
      const c = new THREE.Color();
      if (t < 0.5) {
        c.copy(currentPalette.color1).lerp(currentPalette.color2, t * 2);
      } else {
        c.copy(currentPalette.color2).lerp(currentPalette.color3, (t - 0.5) * 2);
      }

      particleColors[idx * 3] = c.r;
      particleColors[idx * 3 + 1] = c.g;
      particleColors[idx * 3 + 2] = c.b;

      particleSizes[idx] = 1.4 + Math.random() * 1.8;

      idx++;
    }
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

  const particleMaterial = new THREE.PointsMaterial({
    size: 2.5,
    map: particleTexture,
    vertexColors: true,
    transparent: true,
    opacity: currentPalette.particleOpacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particleField = new THREE.Points(particleGeometry, particleMaterial);
  particleField.position.y = -8;
  scene.add(particleField);

  // 2. ThreeUI Wireframe Geometry: Floating Rings Accent
  const torusGeo = new THREE.TorusGeometry(14, 0.35, 16, 100);
  const torusMat = new THREE.MeshBasicMaterial({
    color: currentPalette.ringColor,
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });
  const torusMesh = new THREE.Mesh(torusGeo, torusMat);
  torusMesh.position.set(22, 10, -10);
  torusMesh.rotation.x = Math.PI * 0.35;
  torusMesh.rotation.y = Math.PI * 0.15;
  scene.add(torusMesh);

  // Inner subtle accent ring
  const innerRingGeo = new THREE.TorusGeometry(8, 0.2, 12, 60);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: currentPalette.color1,
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.position.set(22, 10, -10);
  innerRing.rotation.x = -Math.PI * 0.2;
  scene.add(innerRing);

  // Mouse Interaction (Spring interpolation)
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  function onPointerMove(e) {
    const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || windowHalfX;
    const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || windowHalfY;
    mouse.targetX = (clientX - windowHalfX) * 0.04;
    mouse.targetY = (clientY - windowHalfY) * 0.04;
  }

  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });

  // Theme change listener
  function updateThemeColors() {
    currentPalette = palettes[getCurrentTheme()];
    particleMaterial.opacity = currentPalette.particleOpacity;
    particleMaterial.blending = getCurrentTheme() === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending;
    torusMat.color.copy(currentPalette.ringColor);
    innerRingMat.color.copy(currentPalette.color1);

    const colors = particleGeometry.attributes.color.array;
    let i = 0;
    for (let ix = 0; ix < cols; ix++) {
      for (let iz = 0; iz < rows; iz++) {
        const t = (ix / cols + iz / rows) * 0.5;
        const c = new THREE.Color();
        if (t < 0.5) {
          c.copy(currentPalette.color1).lerp(currentPalette.color2, t * 2);
        } else {
          c.copy(currentPalette.color2).lerp(currentPalette.color3, (t - 0.5) * 2);
        }
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        i++;
      }
    }
    particleGeometry.attributes.color.needsUpdate = true;
  }

  // Observe theme changes on <html>
  const observer = new MutationObserver(() => updateThemeColors());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Handle Resize
  function onWindowResize() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onWindowResize, { passive: true });

  // Visibility & IntersectionObserver (Pause loop when off-screen)
  let isVisible = true;
  let animationFrameId = null;

  if (typeof IntersectionObserver !== 'undefined') {
    const heroSection = document.getElementById('hero');
    if (heroSection) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationFrameId) {
            animate();
          }
        });
      }, { threshold: 0.05 });
      io.observe(heroSection);
    }
  }

  // Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    if (!isVisible) {
      animationFrameId = null;
      return;
    }

    animationFrameId = requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const speedMultiplier = reduceMotion ? 0.15 : 1.0;

    // Smooth spring lerp for mouse interaction
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;

    camera.position.x = mouse.x * 0.8;
    camera.position.y = 28 - mouse.y * 0.6;
    camera.lookAt(0, 0, 0);

    // Wave animation for particle positions
    const positions = particleGeometry.attributes.position.array;
    let pIdx = 0;
    for (let ix = 0; ix < cols; ix++) {
      for (let iz = 0; iz < rows; iz++) {
        const u = ix * 0.18 + elapsedTime * 0.8 * speedMultiplier;
        const v = iz * 0.18 + elapsedTime * 0.5 * speedMultiplier;

        // Wave formula combining sine waves
        const wave = Math.sin(u) * Math.cos(v) * 3.5 + Math.sin(u * 0.5 + v * 0.7) * 1.5;

        // Dynamic height
        const xPos = positions[pIdx * 3];
        const zPos = positions[pIdx * 3 + 2];
        const distFromCenter = Math.sqrt(xPos * xPos + zPos * zPos);
        const dynamicHeight = wave + Math.sin(distFromCenter * 0.1 - elapsedTime * speedMultiplier) * 1.2;

        positions[pIdx * 3 + 1] = dynamicHeight;
        pIdx++;
      }
    }
    particleGeometry.attributes.position.needsUpdate = true;

    // Gentle rotation of floating wireframe rings
    torusMesh.rotation.z += 0.0025 * speedMultiplier;
    torusMesh.rotation.y += 0.0018 * speedMultiplier;
    innerRing.rotation.z -= 0.0035 * speedMultiplier;

    renderer.render(scene, camera);
  }

  // Start animation
  animate();
})();
