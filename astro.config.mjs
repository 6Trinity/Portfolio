// @ts-check
import {
  defineConfig
} from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * По умолчанию настроено для собственного домена martynov.space.
 * Для локальной проверки GitHub Pages project-сайта можно задать:
 *  - SITE_URL=https://<user>.github.io
 *  - BASE_PATH=/<repo>/
 */
const SITE_URL = (process.env.SITE_URL || 'https://martynov.space').replace(/\/$/, '');
const BASE_PATH = process.env.BASE_PATH === undefined ? '/' : process.env.BASE_PATH;

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'monthly',
      lastmod: new Date(),
    }),
  ],
  vite: {
    build: {
      // esbuild надёжнее сохраняет var() в transition shorthand (lightningcss
      // переписывает их в невалидные значения и ломает появление секций).
      cssMinify: 'esbuild',
    },
  },
});