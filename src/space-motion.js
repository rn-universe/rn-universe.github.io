(() => {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = window.matchMedia('(max-width: 700px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const stars = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let last = performance.now();
  let t = 0;

  const makeStars = () => {
    const count = lowPower ? 420 : 900;
    stars.length = 0;
    for (let i = 0; i < count; i += 1) {
      const depth = Math.random();
      stars.push({
        x: Math.random(),
        y: Math.random(),
        z: depth,
        size: 0.35 + Math.random() * (lowPower ? 1.3 : 1.9),
        speed: 0.02 + Math.random() * 0.11,
        twinkle: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.16 ? (Math.random() < 0.5 ? 32 : 205) : 215,
      });
    }
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
  };

  const draw = (now) => {
    const delta = Math.min(40, now - last);
    last = now;
    t += delta * 0.001;
    ctx.clearRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.5;
    const max = Math.max(width, height);

    for (const star of stars) {
      if (!reduceMotion) {
        star.z -= star.speed * delta * 0.00032;
        if (star.z < 0.02) {
          star.z = 1;
          star.x = Math.random();
          star.y = Math.random();
        }
      }

      const driftX = Math.sin(t * 0.18 + star.twinkle) * 0.00024;
      const driftY = Math.cos(t * 0.14 + star.twinkle) * 0.00018;
      const x = (star.x + driftX) * width;
      const y = (star.y + driftY) * height;
      const depth = 1 - star.z;
      const radius = star.size * (0.45 + depth * 1.7);
      const alpha = 0.18 + depth * 0.7 + Math.sin(t * 1.3 + star.twinkle) * 0.08;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${star.hue}, 76%, ${78 + depth * 18}%, ${Math.max(0.04, Math.min(0.95, alpha))})`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (!reduceMotion && depth > 0.74) {
        const trail = Math.min(max * 0.015, depth * 8);
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${star.hue}, 72%, 82%, ${Math.max(0.01, depth * 0.18)})`;
        ctx.lineWidth = Math.max(0.35, radius * 0.33);
        ctx.moveTo(x, y);
        ctx.lineTo(x - trail * 0.9, y - trail * 0.22);
        ctx.stroke();
      }
    }

    requestAnimationFrame(draw);
  };

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(draw);
})();
