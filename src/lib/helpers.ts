import siteJson from '../data/site.json';
import homeJson from '../data/home.json';
import aboutJson from '../data/about.json';
import servicesJson from '../data/services.json';

/* ─────────────────────────────  Типы данных  ───────────────────────────── */

export interface SiteSettings {
  name: string;
  monogram: string;
  role: string;
  title: string;
  description: string;
  url: string;
  basePath: string;
  locale: string;
  lang: string;
  ogImage: string;
  favicon: string;
  email: string;
  telegram: string;
  telegramHandle: string;
  github: string;
  githubHandle: string;
}

export interface ApproachStep {
  title: string;
  description: string;
}

export interface HomeContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    footnote: string;
  };
  work: {
    eyebrow: string;
    title: string;
    subtitle: string;
    allLinkLabel: string;
    allLinkHref: string;
  };
  services: { eyebrow: string; title: string; subtitle: string };
  approach: { eyebrow: string; title: string; subtitle: string; steps: ApproachStep[] };
  about: { eyebrow: string; title: string; text: string; education: string };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    responseNote: string;
  };
}

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export interface ExperienceItem {
  company: string;
  position: string;
  period: string;
  description: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface AboutContent {
  experience: ExperienceItem[];
  skills: SkillGroup[];
}

export const site = siteJson as SiteSettings;
export const home = homeJson as HomeContent;
export const about = aboutJson as AboutContent;
export const services = (servicesJson as { items: ServiceItem[] }).items.filter(
  (item) => item.title?.trim(),
);

/* ─────────────────────────────  Адреса  ───────────────────────────── */

/** Нормализованный base path: всегда начинается и заканчивается на «/». */
export const base = (() => {
  let value = import.meta.env.BASE_URL || '/';
  if (!value.startsWith('/')) value = `/${value}`;
  if (!value.endsWith('/')) value = `${value}/`;
  return value;
})();

const siteOrigin = (site.url || '').replace(/\/$/, '');

/** Префикс базового домена без страницы (для абсолютных URL). */
export const siteBase = siteOrigin ? `${siteOrigin}${base === '/' ? '' : base.replace(/\/$/, '')}` : '';

/**
 * Внутренний адрес с учётом base path.
 * Внешние ссылки, mailto:, tel:, tel и якоря возвращаются без изменений.
 */
export function url(path = '/'): string {
  if (!path) return base;
  if (/^(https?:|mailto:|tel:|#|\/\/)/i.test(path)) return path;
  return `${base}${path.replace(/^\/+/, '')}`;
}

/** Абсолютный URL для canonical / OG / sitemap. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteBase}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Адрес медиафайла из CMS (относительный путь → base + путь). */
export function mediaUrl(path: string): string {
  return url(path.replace(/^\/+/, ''));
}

/** Канонический путь страницы (без домена и base). */
export function canonicalPath(currentPath: string): string {
  return absoluteUrl(url(currentPath));
}

/* ─────────────────────────────  Форматирование  ───────────────────────────── */

export const pad = (n: number): string => String(n).padStart(2, '0');

export function formatYear(year: number): string {
  return year > 0 ? String(year) : '';
}

/** Из slug/id вида "tetriz-agr-moskva" делает безопасный путь. */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
