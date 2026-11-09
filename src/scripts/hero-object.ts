/**
 * «Digital Flow» — авторский графический объект первого экрана.
 *
 * Идея: несколько орбитальных потоков информации, по которым движутся
 * точки-данные и структурные узлы. Объект живёт на Canvas, рисуется только
 * когда виден и только при отсутствии prefers-reduced-motion; реагирует
 * на курсор (наклон) и прокрутку (фаза). Наклон выполняется в CSS (transform),
 * поэтому перерисовка кадра идёт с ограничением ~36 fps и останавливается
 * вне экрана или при неактивной вкладке.
 */

type Node = { angle: number; radius: number; size: number; speed: number; color: string };

const ACCENT = [183, 108, 250] as const;
const PINK = [236, 111, 210] as const;
const MINT = [172, 221, 204] as const;

function rgba(color: readonly [number, number, number], alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

export function initHeroObject() {
  const wrap = document.querySelector<HTMLElement>('[data-hero-object]');
  const canvas = wrap?.querySelector<HTMLCanvasElement>('canvas');
  if (!wrap || !canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visible = { value: false };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let lastTime = 0;
  let time = 0;
  let pointerX = 0;
  let pointerY = 0;
  let scrollPhase = 0;

  const nodes: Node[] = [
    { angle: 0.4, radius: 1.32, size: 4.5, speed: 0.0016, color: 'accent' },
    { angle: 2.1, radius: 1.1, size: 3, speed: -0.0021, color: 'mint' },
    { angle: 4.2, radius: 1.45, size: 2.5, speed: 0.0012, color: 'accent' },
    { angle: 5.3, radius: 0.96, size: 3.5, speed: 0.0026, color: 'pink' },
    { angle: 1.2, radius: 1.2, size: 2, speed: -0.0014, color: 'accent' },
  ];

  function resize() {
    const rect = wrap!.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas!.width = Math.round(width * dpr);
    canvas!.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  function orbit(radius: number, tiltX: number, tiltY: number, rotation: number): Array<[number, number]> {
    const steps = 128;
    const points: Array<[number, number]> = [];
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const cosT = Math.cos(tiltX);
    const sinT = Math.sin(tiltX);
    for (let i = 0; i <= steps; i += 1) {
      const a = (i / steps) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius * 0.34;
      const rx = x * cosT - y * sinT;
      const ry = x * sinT + y * cosT;
      const dz = Math.sin(a);
      const depth = 1 + (dz * radius * 0.34) / (radius * 1.8); // имитация перспективы
      points.push([
        (cosR * rx - sinR * ry * 0.4) * depth,
        (sinR * rx * 0.4 + ry * 0.9) * depth + tiltY * 6,
      ]);
    }
    return points;
  }

  function draw(now: number) {
    if (!reduceMotion.matches) {
      const delta = Math.min(50, now - (lastTime || now));
      lastTime = now;
      time += delta;
    }

    const cx = width / 2;
    const cy = height / 2;
    const unit = Math.min(width, height) / 2;
    const t = time / 1000;

    ctx!.clearRect(0, 0, width, height);

    const tiltX = Math.sin(t * 0.12 + scrollPhase) * 0.18 + pointerY * 0.16;
    const tiltY = Math.cos(t * 0.1) * 0.08;
    const rotation = t * 0.045 + pointerX * 0.12 + Math.sin(t * 0.07) * 0.06;

    // Мягкое свечение в центре.
    const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, unit * 1.1);
    glow.addColorStop(0, rgba(ACCENT, 0.2));
    glow.addColorStop(0.38, rgba(PINK, 0.07));
    glow.addColorStop(1, rgba(ACCENT, 0));
    ctx!.fillStyle = glow;
    ctx!.fillRect(0, 0, width, height);

    const orbits: Array<{ radius: number; alpha: number; color: readonly [number, number, number]; width: number }> = [
      { radius: 1.5, alpha: 0.2, color: ACCENT, width: 1 },
      { radius: 1.26, alpha: 0.5, color: ACCENT, width: 1.4 },
      { radius: 1.02, alpha: 0.32, color: MINT, width: 1 },
      { radius: 0.76, alpha: 0.55, color: PINK, width: 1.2 },
      { radius: 0.5, alpha: 0.24, color: ACCENT, width: 1 },
    ];

    ctx!.lineWidth = 1;
    orbits.forEach((o, index) => {
      const points = orbit(o.radius * unit, tiltX + index * 0.14 + pointerX * 0.08, tiltY, rotation);
      ctx!.beginPath();
      points.forEach(([x, y], i) => {
        if (i === 0) ctx!.moveTo(cx + x, cy + y);
        else ctx!.lineTo(cx + x, cy + y);
      });
      const grad = ctx!.createLinearGradient(cx - unit, cy - unit, cx + unit, cy + unit);
      grad.addColorStop(0, rgba(o.color, 0));
      grad.addColorStop(0.3, rgba(o.color, o.alpha));
      grad.addColorStop(0.7, rgba(o.color, o.alpha * 0.8));
      grad.addColorStop(1, rgba(o.color, 0));
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = o.width;
      ctx!.stroke();
    });

    // Перетекающие «ленты» — тонкие волны, проходящие сквозь орбиты.
    for (let band = 0; band < 3; band += 1) {
      const offset = band * 2.1;
      ctx!.beginPath();
      for (let i = 0; i <= 120; i += 1) {
        const p = i / 120;
        const x = (p - 0.5) * width * 1.02;
        const wave =
          Math.sin(p * Math.PI * 2.2 + t * 0.3 + offset + pointerX) * unit * 0.16 +
          Math.sin(p * Math.PI * 5 + t * 0.18 + offset * 1.4) * unit * 0.05;
        const y = cy + wave + (band - 1) * unit * 0.2 + Math.cos(rotation + offset) * unit * 0.06 * (band - 1);
        if (i === 0) ctx!.moveTo(cx + x, y);
        else ctx!.lineTo(cx + x, y);
      }
      const ribbon = ctx!.createLinearGradient(cx - unit, 0, cx + unit, 0);
      ribbon.addColorStop(0, rgba(ACCENT, 0));
      ribbon.addColorStop(0.25, rgba(ACCENT, 0.16 - band * 0.035));
      ribbon.addColorStop(0.55, rgba(PINK, 0.18 - band * 0.04));
      ribbon.addColorStop(0.8, rgba(MINT, 0.12 - band * 0.03));
      ribbon.addColorStop(1, rgba(MINT, 0));
      ctx!.strokeStyle = ribbon;
      ctx!.lineWidth = 1.1;
      ctx!.stroke();
    }

    // Ядро — светящийся узел.
    const coreRadius = unit * (0.16 + Math.sin(t * 0.8) * 0.004);
    const core = ctx!.createRadialGradient(cx - unit * 0.03, cy - unit * 0.04, 0, cx, cy, coreRadius);
    core.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
    core.addColorStop(0.25, rgba(PINK, 0.75));
    core.addColorStop(0.6, rgba(ACCENT, 0.35));
    core.addColorStop(1, rgba(ACCENT, 0));
    ctx!.fillStyle = core;
    ctx!.beginPath();
    ctx!.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx!.fill();

    // Мелкие узлы на орбитах.
    nodes.forEach((node) => {
      const angle = node.angle + t * node.speed * 1000 * 0.06;
      const x = Math.cos(angle) * node.radius * unit;
      const y = Math.sin(angle) * node.radius * unit * 0.34 * (1 + tiltX * 0.2);
      const px = cx + Math.cos(rotation) * x - Math.sin(rotation) * y;
      const py = cy + Math.sin(rotation) * x * 0.5 + y + tiltY * 8;
      const color =
        node.color === 'mint' ? MINT : node.color === 'pink' ? PINK : ACCENT;
      const halo = ctx!.createRadialGradient(px, py, 0, px, py, node.size * 6);
      halo.addColorStop(0, rgba(color, 0.7));
      halo.addColorStop(1, rgba(color, 0));
      ctx!.fillStyle = halo;
      ctx!.beginPath();
      ctx!.arc(px, py, node.size * 6, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = 'rgba(255,255,255,0.85)';
      ctx!.beginPath();
      ctx!.arc(px, py, node.size * 0.55, 0, Math.PI * 2);
      ctx!.fill();
    });
  }

  function loop(now: number) {
    if (reduceMotion.matches || !visible.value) {
      frame = 0;
      return;
    }
    draw(now);
    frame = requestAnimationFrame(loop);
  }

  function start() {
    if (frame || reduceMotion.matches) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  // Видимость и экономия ресурсов.
  const io = new IntersectionObserver(
    ([entry]) => {
      visible.value = Boolean(entry?.isIntersecting);
      if (visible.value) start();
      else stop();
    },
    { threshold: 0.01 },
  );
  io.observe(wrap);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      stop();
      draw(performance.now()); // статичный финальный кадр
    } else {
      start();
    }
  });

  // Реакция на курсор: лёгкий поворот и смещение — только transform.
  let pointerRaf = 0;
  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || reduceMotion.matches) return;
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        pointerX += (nx * 2 - pointerX) * 0.12;
        pointerY += (ny * 2 - pointerY) * 0.12;
        wrap.style.setProperty('--px', pointerX.toFixed(3));
        wrap.style.setProperty('--py', pointerY.toFixed(3));
      });
    },
    { passive: true },
  );

  // Лёгкий параллакс при прокрутке.
  let scrollTicking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        scrollTicking = false;
        const rect = wrap.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, 1 - rect.top / window.innerHeight));
        scrollPhase = progress * 0.9;
        wrap.style.setProperty('--scroll', progress.toFixed(3));
        // Параллакс занимает много кадров подряд — ограничиваем перерисовку.
        if (!frame && visible.value && !reduceMotion.matches) draw(performance.now());
      });
    },
    { passive: true },
  );

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(wrap);
  resize();
  draw(performance.now());
  if (!reduceMotion.matches) start();
}
