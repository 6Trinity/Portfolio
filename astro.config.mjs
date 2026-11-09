// @ts-check
import {
  defineConfig
} from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Домен и base path можно переопределить переменными окружения:
 *  - SITE_URL  — основной адрес сайта (собственный домен или https://<user>.github.io)
 *  - BASE_PATH — подкаталог для project-сайта GitHub Pages (например, /Portfolio),
 *                для собственного домена — "/", для user-сайта — "/".
 * По умолчанию настроено под https://6trinity.github.io/Portfolio/
 */
const SITE_URL = (process.env.SITE_URL || 'https://6trinity.github.io').replace(/\/$/, '');
const BASE_PATH =
  process.env.BASE_PATH === undefined ? '/Portfolio/' : process.env.BASE_PATH;

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