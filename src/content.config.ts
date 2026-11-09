import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Общие фрагменты схемы.
 * Все поля кроме обязательных помечены .optional() / .default(),
 * чтобы пустые значения из CMS не ломали сборку.
 */
const text = (fallback = '') =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? fallback);

const textArray = z
  .array(z.string().trim())
  .optional()
  .transform((value) => (value ?? []).filter(Boolean));

const image = z.object({
  src: z.string().trim(),
  alt: text(),
  caption: text(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().trim().min(1),
    // Необязательный слаг: если не задан, берётся имя файла (или frontmatter `slug`).
    slug: z.string().trim().optional(),
    category: z.union([z.string(), z.array(z.string())]).transform((value) =>
      (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean),
    ),
    year: z.union([z.number(), z.string()]).transform((value) => Number(value) || 0),
    client: text(),
    summary: text(),
    cover: image,
    gallery: z.array(image).optional().default([]),
    role: text(),
    services: textArray,
    technologies: textArray,
    // Содержание кейса. Пустые строки не выводятся на странице.
    overview: text(),
    challenge: text(),
    solution: text(),
    results: text(),
    body: text(),
    websiteUrl: text(),
    featured: z.coerce.boolean().optional().default(false),
    order: z.coerce.number().optional().default(999),
    published: z
      .union([z.boolean(), z.enum(['true', 'false', 'on', 'off', 'yes', 'no'])])
      .optional()
      .default(true)
      .transform((value) => (typeof value === 'boolean' ? value : ['true', 'on', 'yes'].includes(value))),
    seoTitle: text(),
    seoDescription: text(),
    ogImage: text(),
  }),
});

export const collections = { projects };
