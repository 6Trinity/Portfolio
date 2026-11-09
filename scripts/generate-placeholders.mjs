/**
 * Генерация нейтральных временных обложек и OG-изображения.
 * Файлы помечены как заглушки и заменяются через CMS без правки кода.
 *
 * Запуск: npm run media:placeholders
 */
import { mkdir, access, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Обложки проектов лежат в src/assets/media — Astro оптимизирует их при сборке.
const outDir = join(root, 'src', 'assets', 'media');
const ogDir = join(root, 'public', 'media', 'og');
const publicDir = join(root, 'public');

const palette = {
  bg: '#0B0C10',
  surface: '#17191F',
  elevated: '#24262D',
  text: '#F4F3F0',
  muted: '#9B9DA6',
  accent: '#B76CFA',
  pink: '#EC6FD2',
  mint: '#ACDDCC',
};

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function flowGraphic(seed, w, h) {
  // Параметрическая графика: набор плавных линий, детерминированных по seed.
  const lines = [];
  const count = 7;
  for (let i = 0; i < count; i += 1) {
    const offset = (seed * 37 + i * 53) % 100;
    const amp = 40 + ((seed * 17 + i * 29) % 90);
    const y0 = h * (0.3 + i * 0.075);
    const phase = (offset / 100) * Math.PI * 2;
    const path = [];
    const steps = 40;
    for (let s = 0; s <= steps; s += 1) {
      const x = (s / steps) * w;
      const y = y0 + Math.sin((s / steps) * Math.PI * 2 + phase) * amp;
      path.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    const opacity = 0.12 + (i % 4) * 0.06;
    const stroke = i % 3 === 0 ? palette.mint : palette.accent;
    lines.push(
      `<path d="${path.join(' ')}" fill="none" stroke="${stroke}" stroke-opacity="${opacity.toFixed(2)}" stroke-width="${(1 + (i % 3) * 0.4).toFixed(1)}"/>`,
    );
  }
  for (let r = 0; r < 4; r += 1) {
    const cx = w * (0.55 + Math.sin(seed + r) * 0.18);
    const cy = h * (0.42 + Math.cos(seed * 1.3 + r) * 0.22);
    const rr = 50 + ((seed * 13 + r * 41) % 130);
    lines.push(
      `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rr}" fill="none" stroke="${palette.accent}" stroke-opacity="${(0.18 - r * 0.03).toFixed(2)}" stroke-width="1"/>`,
    );
  }
  return lines.join('\n');
}

function coverSvg({ title, category, seed, width = 1600, height = 1000 }) {
  const name = esc(title);
  const cat = esc(category);
  const fontSize = name.length > 40 ? 52 : 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="g1" cx="18%" cy="12%" r="70%">
      <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.38"/>
      <stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="88%" cy="92%" r="60%">
      <stop offset="0" stop-color="${palette.pink}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${palette.pink}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.accent}"/>
      <stop offset="1" stop-color="${palette.pink}"/>
    </linearGradient>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M80 0H0V80" fill="none" stroke="${palette.text}" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="${palette.bg}"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <rect width="100%" height="100%" fill="url(#g1)"/>
  <rect width="100%" height="100%" fill="url(#g2)"/>
  ${flowGraphic(seed, width, height)}
  <g font-family="'Segoe UI', Arial, sans-serif">
    <text x="96" y="${height - 210}" fill="${palette.accent}" font-size="22" font-family="'Courier New', monospace" letter-spacing="6">${cat}</text>
    <text x="92" y="${height - 128}" fill="${palette.text}" font-size="${fontSize}" font-weight="600" letter-spacing="-1.5">${name}</text>
    <rect x="92" y="${height - 82}" width="56" height="3" rx="1.5" fill="url(#g3)"/>
    <text x="96" y="${height - 44}" fill="${palette.muted}" font-size="20" font-family="'Courier New', monospace" letter-spacing="3">ПРЕВЬЮ ЗАГЛУШКА · REPLACE VIA CMS</text>
  </g>
</svg>`;
}

function mobileSvg({ title, category, seed, width = 760, height = 1560 }) {
  return coverSvg({ title, category, seed, width, height });
}

function ogSvg({ width = 1200, height = 630 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="a" cx="80%" cy="10%" r="80%">
      <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b" cx="5%" cy="95%" r="60%">
      <stop offset="0" stop-color="${palette.mint}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${palette.mint}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="t" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#F4F3F0"/>
      <stop offset="0.7" stop-color="#D8B4FE"/>
      <stop offset="1" stop-color="${palette.mint}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${palette.bg}"/>
  <rect width="100%" height="100%" fill="url(#a)"/>
  <rect width="100%" height="100%" fill="url(#b)"/>
  ${flowGraphic(11, width, height)}
  <circle cx="1010" cy="250" r="120" fill="none" stroke="${palette.accent}" stroke-opacity="0.5"/>
  <circle cx="1010" cy="250" r="70" fill="none" stroke="${palette.pink}" stroke-opacity="0.35"/>
  <circle cx="1010" cy="250" r="14" fill="${palette.text}" fill-opacity="0.9"/>
  <text x="72" y="150" fill="${palette.accent}" font-size="20" font-family="'Courier New', monospace" letter-spacing="5">WEB DEVELOPMENT / TECHNICAL SEO</text>
  <text x="68" y="268" fill="url(#t)" font-size="64" font-weight="600" font-family="'Segoe UI', Arial, sans-serif" letter-spacing="-2">Егор Мартынов</text>
  <text x="70" y="330" fill="${palette.muted}" font-size="26" font-family="'Segoe UI', Arial, sans-serif">Создаю сайты, в которых дизайн, код и SEO</text>
  <text x="70" y="366" fill="${palette.muted}" font-size="26" font-family="'Segoe UI', Arial, sans-serif">работают вместе.</text>
  <rect x="70" y="420" width="72" height="3" rx="1.5" fill="${palette.accent}"/>
  <text x="70" y="490" fill="${palette.text}" font-size="20" font-family="'Courier New', monospace" letter-spacing="2">6trinity.github.io</text>
</svg>`;
}

function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#B76CFA"/>
      <stop offset="1" stop-color="#EC6FD2"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="#0B0C10"/>
  <path d="M15 48V16h34v8H25v4.6h18v7.4H25v4.6h25V48H15Z" fill="url(#g)"/>
  <circle cx="50" cy="14" r="3.2" fill="#ACDDCC"/>
</svg>`;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const projects = [
  {
    slug: 'mks-mks-modul-karkas-stroy',
    title: 'МКС — Модуль Каркас Строй',
    category: 'WEB DEVELOPMENT / UI/UX / SEO',
    seed: 3,
  },
  {
    slug: 'tetriz-tetriz-agr-moskva',
    title: 'Tetriz Architects — АГР Москва',
    category: 'LANDING PAGE / TECHNICAL SEO',
    seed: 7,
  },
  {
    slug: 'tetriz-tetriz-presentation',
    title: 'Tetriz Architects — Презентационные материалы',
    category: 'WEB DESIGN / FRONTEND',
    seed: 12,
  },
  {
    slug: 'tetriz-tetriz-reconstruction',
    title: 'Tetriz Architects — Реконструкция',
    category: 'LANDING PAGE / SEO',
    seed: 19,
  },
  {
    slug: 'tetriz-tetriz-kapitalnyy-remont-fasadov',
    title: 'Tetriz Architects — Капитальный ремонт фасадов',
    category: 'WEB DESIGN / LANDING PAGE',
    seed: 23,
  },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  await mkdir(ogDir, { recursive: true });

  for (const project of projects) {
    const deskPath = join(outDir, `${project.slug}.png`);
    if (!(await exists(deskPath))) {
      await sharp(Buffer.from(coverSvg(project))).png({ compressionLevel: 9 }).toFile(deskPath);
    }

    const mobilePath = join(outDir, `${project.slug}-02.png`);
    if (!(await exists(mobilePath))) {
      await sharp(Buffer.from(mobileSvg(project))).png({ compressionLevel: 9 }).toFile(mobilePath);
    }
  }

  const ogPath = join(ogDir, 'og-default.png');
  if (!(await exists(ogPath))) {
    await sharp(Buffer.from(ogSvg({}))).png({ compressionLevel: 9 }).toFile(ogPath);
  }

  const faviconPath = join(publicDir, 'favicon.svg');
  await writeFile(faviconPath, faviconSvg(), 'utf8');

  const iconPng = join(publicDir, 'apple-touch-icon.png');
  if (!(await exists(iconPng))) {
    await sharp(Buffer.from(faviconSvg())).resize(180, 180).png().toFile(iconPng);
  }

  const ico = join(publicDir, 'favicon.ico');
  if (!(await exists(ico))) {
    const png32 = await sharp(Buffer.from(faviconSvg())).resize(32, 32).png().toBuffer();
    const header = Buffer.alloc(22);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(1, 4);
    header.writeUInt8(32, 6);
    header.writeUInt8(32, 7);
    header.writeUInt8(0, 8);
    header.writeUInt8(0, 9);
    header.writeUInt16LE(1, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(png32.length, 14);
    header.writeUInt32LE(22, 18);
    await writeFile(ico, Buffer.concat([header, png32]));
  }

  console.log('Временные медиафайлы готовы: src/assets/media, public/media/og, public/favicon.svg');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
