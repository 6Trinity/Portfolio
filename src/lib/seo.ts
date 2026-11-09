import { absoluteUrl, about, services, site, url } from './helpers';

export type JsonLd = Record<string, unknown>;

const personId = () => `${absoluteUrl('/')}#person`;
const websiteId = () => `${absoluteUrl('/')}#website`;

export function personSchema(): JsonLd {
  return {
    '@type': 'Person',
    '@id': personId(),
    name: site.name,
    jobTitle: 'Web Developer / Technical SEO Specialist',
    description:
      'Веб-разработчик и специалист по техническому SEO. Разработка коммерческих сайтов, проектирование интерфейсов, поисковая оптимизация и аналитика.',
    url: absoluteUrl('/'),
    image: absoluteUrl(site.ogImage),
    email: `mailto:${site.email}`,
    knowsAbout: services.map((service) => service.title),
    knowsLanguage: ['ru', 'en'],
    sameAs: [site.telegram, site.github].filter(Boolean),
    worksFor: about.experience.slice(0, 1).map((item) => ({
      '@type': 'Organization',
      name: item.company,
    })),
  };
}

export function websiteSchema(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': websiteId(),
    url: absoluteUrl('/'),
    name: `${site.name} — ${site.role}`,
    description: site.description,
    inLanguage: 'ru-RU',
    publisher: { '@id': personId() },
  };
}

export function profilePageSchema(title: string, description: string): JsonLd {
  return {
    '@type': 'ProfilePage',
    '@id': `${absoluteUrl('/')}#profile`,
    url: absoluteUrl('/'),
    name: title,
    description,
    inLanguage: 'ru-RU',
    mainEntity: { '@id': personId() },
    isPartOf: { '@id': websiteId() },
  };
}

export function projectSchema(project: {
  title: string;
  summary: string;
  slug: string;
  cover: string;
  year: number;
  technologies: string[];
  websiteUrl: string;
}): JsonLd {
  return {
    '@type': 'CreativeWork',
    '@id': `${absoluteUrl(`/projects/${project.slug}/`)}#work`,
    name: project.title,
    description: project.summary,
    url: absoluteUrl(`/projects/${project.slug}/`),
    image: absoluteUrl(project.cover),
    ...(project.year ? { dateCreated: String(project.year) } : {}),
    ...(project.technologies.length ? { keywords: project.technologies.join(', ') } : {}),
    creator: { '@id': personId() },
    ...(project.websiteUrl ? { sameAs: [project.websiteUrl] } : {}),
    isPartOf: { '@id': websiteId() },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function projectListSchema(
  projects: { slug: string; data: { title: string } }[],
): JsonLd {
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl('/projects/')}#list`,
    name: 'Избранные проекты',
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: project.data.title,
      url: absoluteUrl(`/projects/${project.slug}/`),
    })),
  };
}

export function graph(...items: (JsonLd | null | undefined)[]): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': items.filter(Boolean),
    },
    null,
    0,
  ).replace(/</g, '\\u003c');
}

export { url };
