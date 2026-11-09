import { getCollection, type CollectionEntry } from 'astro:content';
import { toSlug } from './helpers';

export type Project = CollectionEntry<'projects'>;
export type ProjectData = Project['data'];

export interface ProjectView {
  entry: Project;
  slug: string;
  data: ProjectData;
  href: string;
}

function makeView(entry: Project): ProjectView {
  const slug = toSlug(entry.data.slug ?? entry.id) || toSlug(entry.id) || entry.id;
  return {
    entry,
    slug,
    data: entry.data,
    href: `/projects/${slug}/`,
  };
}

/**
 * Все опубликованные проекты в порядке отображения.
 * Скрытые (published: false) полностью исключены из сборки:
 * на них нельзя перейти ни из карусели, ни из навигации, ни по прямому адресу.
 */
export async function getPublishedProjects(): Promise<ProjectView[]> {
  const entries = await getCollection('projects', ({ data }) => data.published !== false);
  return entries
    .map(makeView)
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'ru'));
}

export async function getFeaturedProjects(): Promise<ProjectView[]> {
  const all = await getPublishedProjects();
  const featured = all.filter((project) => project.data.featured);
  return featured.length ? featured : all;
}

export function getNeighbours(projects: ProjectView[], slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return { prev: undefined, next: undefined, index: 0 };
  return {
    prev: index > 0 ? projects[index - 1] : undefined,
    next: index < projects.length - 1 ? projects[index + 1] : undefined,
    index,
  };
}

/** Первый непустой абзац — для превью/описаний. */
export function firstParagraph(value: string, fallback = ''): string {
  const paragraph = value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find(Boolean);
  return paragraph ?? fallback;
}
