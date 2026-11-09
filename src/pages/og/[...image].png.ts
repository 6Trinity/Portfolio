import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getPublishedProjects } from '../../lib/projects';

const root = process.cwd();

export const getStaticPaths = async () => {
  const projects = await getPublishedProjects();
  return projects.map((project) => ({
    params: { image: project.slug },
    props: { src: project.data.ogImage || project.data.cover.src },
  }));
};

/** Ищем исходник в src/assets/media (пайплайн Astro) или в public/media. */
async function loadSource(src: string): Promise<Buffer | null> {
  const rel = src.replace(/^\/media\//, '');
  const candidates = [
    join(root, 'src', 'assets', 'media', rel),
    join(root, 'public', src.replace(/^\//, '')),
  ];
  for (const candidate of candidates) {
    try {
      return await readFile(candidate);
    } catch {
      /* пробуем следующий путь */
    }
  }
  return null;
}

const headers = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=31536000, immutable',
};

/** Социальное превью 1200×630 для каждой страницы проекта. */
export const GET: APIRoute = async ({ props }) => {
  const { src } = props as { src: string };
  const input = await loadSource(src);

  if (!input) {
    const fallback = await readFile(join(root, 'public', 'media', 'og', 'og-default.png'));
    return new Response(new Uint8Array(fallback), { headers });
  }

  const png = await sharp(input)
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return new Response(new Uint8Array(png), { headers });
};
