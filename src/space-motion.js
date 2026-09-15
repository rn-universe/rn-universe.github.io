(() => {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = window.matchMedia('(max-width: 700px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const stars = [];
  const shooters = [];
  const nebulae = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let last = performance.now();
  let t = 0;
  let pointerX = 0.5;
  let pointerY = 0.5;

  const makeNebulae = () => {
    nebulae.length = 0;
    const count = lowPower ? 5 : 9;
    for (let i = 0; i < count; i += 1) {
      nebulae.push({
        x: 0.08 + Math.random() * 0.84,
        y: 0.06 + Math.random() * 0.88,
        r: (0.10 + Math.random() * 0.18) * Math.max(width, height),
        hue: [214, 228, 265, 188, 32][i % 5],
        alpha: 0.018 + Math.random() * 0.024,
        phase: Math.random() * Math.PI * 2,
        drift: 0.00008 + Math.random() * 0.00015,
      });
    }
  };

  const makeStars = () => {
    const count = lowPower ? 700 : 1650;
    stars.length = 0;
    for (let i = 0; i < count; i += 1) {
      const depth = Math.random();
      stars.push({
        x: Math.random(),
        y: Math.random(),
        z: depth,
        size: 0.3 + Math.random() * (lowPower ? 1.6 : 2.2),
        speed: 0.018 + Math.random() * 0.16,
        twinkle: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.18 ? (Math.random() < 0.55 ? 32 : 202) : 215,
      });
    }
  };

  const spawnShooter = () => {
    shooters.push({
      x: Math.random() * 1.2 - 0.1,
      y: Math.random() * 0.55,
      speed: 0.00055 + Math.random() * 0.0008,
      length: 0.025 + Math.random() * 0.065,
      life: 0,
      maxLife: 700 + Math.random() * 900,
      angle: 0.52 + (Math.random() - 0.5) * 0.18,
      hue: Math.random() < 0.7 ? 210 : 35,
    });
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeStars();
    makeNebulae();
  };

  const drawNebula = (nebula) => {
    const drift = Math.sin(t * nebula.drift * 1000 + nebula.phase);
    const x = nebula.x * width + drift * width * 0.018 + (pointerX - 0.5) * width * 0.018;
    const y = nebula.y * height + Math.cos(t * nebula.drift * 700 + nebula.phase) * height * 0.012 + (pointerY - 0.5) * height * 0.014;
    const g = ctx.createRadialGradient(x, y, 0, x, y, nebula.r);
    g.addColorStop(0, `hsla(${nebula.hue}, 72%, 62%, ${nebula.alpha})`);
    g.addColorStop(0.35, `hsla(${nebula.hue}, 70%, 48%, ${nebula.alpha * 0.45})`);
    g.addColorStop(1, `hsla(${nebula.hue}, 70%, 35%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, nebula.r, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (now) => {
    const delta = Math.min(40, now - last);
    last = now;
    t += delta * 0.001;
    ctx.clearRect(0, 0, width, height);

    for (const nebula of nebulae) drawNebula(nebula);

    const cx = width * 0.5;
    const cy = height * 0.5;
    const max = Math.max(width, height);

    for (const star of stars) {
      if (!reduceMotion) {
        star.z -= star.speed * delta * 0.00036;
        if (star.z < 0.018) {
          star.z = 1;
          star.x = Math.random();
          star.y = Math.random();
        }
      }

      const parallax = (1 - star.z) * 0.022;
      const driftX = Math.sin(t * 0.18 + star.twinkle) * 0.00024 + (pointerX - 0.5) * parallax;
      const driftY = Math.cos(t * 0.14 + star.twinkle) * 0.00018 + (pointerY - 0.5) * parallax;
      const x = (star.x + driftX) * width;
      const y = (star.y + driftY) * height;
      const depth = 1 - star.z;
      const radius = star.size * (0.45 + depth * 1.9);
      const alpha = 0.13 + depth * 0.76 + Math.sin(t * 1.55 + star.twinkle) * 0.09;

      if (depth > 0.84) {
        const flare = radius * 4.2;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, flare);
        glow.addColorStop(0, `hsla(${star.hue}, 92%, 92%, ${Math.min(0.22, alpha * 0.24)})`);
        glow.addColorStop(1, `hsla(${star.hue}, 80%, 70%, 0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(x - flare, y - flare, flare * 2, flare * 2);
      }

      ctx.beginPath();
      ctx.fillStyle = `hsla(${star.hue}, 76%, ${78 + depth * 18}%, ${Math.max(0.04, Math.min(0.96, alpha))})`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (!reduceMotion && depth > 0.66) {
        const trail = Math.min(max * 0.02, depth * (6 + star.speed * 65));
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${star.hue}, 72%, 82%, ${Math.max(0.008, depth * 0.2)})`;
        ctx.lineWidth = Math.max(0.35, radius * 0.28);
        ctx.moveTo(x, y);
        ctx.lineTo(x - trail * 0.9, y - trail * 0.22);
        ctx.stroke();
      }
    }

    if (!reduceMotion && Math.random() < (lowPower ? 0.004 : 0.009)) spawnShooter();
    for (let i = shooters.length - 1; i >= 0; i -= 1) {
      const shot = shooters[i];
      shot.life += delta;
      shot.x += shot.speed * delta * Math.cos(shot.angle);
      shot.y += shot.speed * delta * Math.sin(shot.angle);
      const fade = Math.sin(Math.PI * Math.min(1, shot.life / shot.maxLife));
      const sx = shot.x * width;
      const sy = shot.y * height;
      const ex = (shot.x - shot.length * Math.cos(shot.angle)) * width;
      const ey = (shot.y - shot.length * Math.sin(shot.angle)) * height;
      const grad = ctx.createLinearGradient(ex, ey, sx, sy);
      grad.addColorStop(0, `hsla(${shot.hue}, 90%, 82%, 0)`);
      grad.addColorStop(1, `hsla(${shot.hue}, 92%, 92%, ${0.78 * fade})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = lowPower ? 1 : 1.5;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      if (shot.life >= shot.maxLife || sx > width * 1.2 || sy > height * 1.2) shooters.splice(i, 1);
    }

    requestAnimationFrame(draw);
  };

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX / Math.max(1, window.innerWidth);
    pointerY = event.clientY / Math.max(1, window.innerHeight);
  }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(draw);
})();
