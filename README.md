# Егор Мартынов — портфолио

Персональный сайт-портфолио: **Web Development / Technical SEO**.
Статическая генерация на Astro, контент редактируется через Pages CMS, публикация — GitHub Pages.

---

## Стек

| Слой | Технология |
|---|---|
| Генерация | Astro (static output) |
| Типизация | TypeScript, Content Collections + Zod |
| Стили | CSS с дизайн-токенами (custom properties) |
| Интерактив | Vanilla TypeScript, без UI-фреймворков |
| Изображения | `astro:assets` + sharp (WebP, адаптивные `srcset`) |
| CMS | Pages CMS (`.pages.yml`, авторизация через GitHub) |
| CI/CD | GitHub Actions → GitHub Pages |

Клиентского JS ровно столько, сколько нужно: глобальный скрипт и лениво
подгружаемые модули карусели, лайтбокса и графического объекта hero.

---

## Структура проекта

```
.
├─ .github/workflows/deploy.yml   # сборка и публикация
├─ .pages.yml                     # конфигурация Pages CMS
├─ astro.config.mjs               # site / base / sitemap
├─ scripts/generate-placeholders.mjs
├─ public/
│  ├─ favicon.svg, favicon.ico, apple-touch-icon.png
│  └─ media/og/og-default.png     # социальное изображение по умолчанию
├─ src/
│  ├─ assets/media/               # обложки проектов (оптимизируются при сборке)
│  ├─ components/
│  │  ├─ sections/                # Hero, Work, Services, Approach, About, Contact, Marquee
│  │  ├─ Header.astro, Footer.astro, Logo.astro, Icon.astro
│  │  ├─ MediaImage.astro         # картинка из CMS + заглушка, если файла нет
│  │  ├─ ProjectGallery.astro, ProjectNav.astro, CaseSection.astro
│  │  └─ Seo.astro                # title, description, canonical, OG, Twitter, JSON-LD
│  ├─ content.config.ts           # схема коллекции projects
│  ├─ content/projects/*.md       # кейсы (создаются через CMS)
│  ├─ data/                       # site.json, home.json, services.json, about.json
│  ├─ layouts/BaseLayout.astro
│  ├─ lib/                        # helpers, projects, seo
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ projects/index.astro     # архив работ
│  │  ├─ projects/[slug].astro    # универсальный шаблон кейса
│  │  ├─ og/[...image].png.ts     # OG-превью 1200×630 для каждого проекта
│  │  ├─ robots.txt.ts
│  │  └─ 404.astro
│  ├─ scripts/                    # site.ts, carousel.ts, lightbox.ts, hero-object.ts
│  └─ styles/                     # tokens.css, base.css, ui.css
└─ tsconfig.json
```

---

## Локальный запуск

Требуется Node.js 20+ (в CI используется 22).

```bash
npm install
npm run dev        # http://localhost:4321/
npm run build      # сборка в dist/
npm run preview    # предпросмотр собранного сайта
npm run check      # проверка типов (astro check)
```

По умолчанию сайт собирается для `https://martynov.space/` с корневым base path `/`.
Для локальной проверки GitHub Pages project-сайта задайте `$env:SITE_URL` и
`$env:BASE_PATH` перед запуском (PowerShell).

### Переменные окружения

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `SITE_URL` | `https://martynov.space` | Домен для canonical, OG, sitemap |
| `BASE_PATH` | `/` | Base path публикации; для project-сайта — `/<repo>/` |

Внутренние ссылки в компонентах формируйте через `url()` из `src/lib/helpers.ts`,
чтобы они учитывали `BASE_PATH`.

---

## Публикация на GitHub Pages

1. Создайте репозиторий и запушьте код в ветку `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Workflow `.github/workflows/deploy.yml` соберёт сайт и опубликует `dist/`.
   Сборка идёт только при успешном `npm run check` и `npm run build` — при ошибке
   публикации не будет.
4. Workflow публикует сайт на `https://martynov.space/` с корневым путём.

### GitHub Pages / собственный домен

В **Settings → Pages → Custom domain** укажите `martynov.space` и включите
**Enforce HTTPS**, когда сертификат будет готов. Файл `public/CNAME` добавляется
в публикацию автоматически. Workflow собирает для корня домена; пути ресурсов
и внутренние ссылки не содержат `/Portfolio/`.

Перенос на другой статический хостинг (Netlify, Cloudflare Pages, Vercel) не требует
изменения кода: достаточно `npm run build` и публикации папки `dist/`.

---

## Управление контентом (Pages CMS)

1. Откройте [app.pagescms.org](https://app.pagescms.org) и войдите через GitHub.
2. Выдайте доступ только к репозиторию сайта.
3. Выберите репозиторий — CMS прочитает `.pages.yml`.

Разделы:

| Раздел | Файл | Что редактируется |
|---|---|---|
| Главная страница | `src/data/home.json` | Hero, заголовки секций, этапы подхода, тексты «Обо мне» и контактов |
| Портфолио | `src/content/projects/*.md` | Проекты целиком |
| Услуги | `src/data/services.json` | Названия, описания, списки возможностей, порядок |
| Обо мне | `src/data/about.json` | Опыт работы, технологии по группам |
| Контакты и настройки | `src/data/site.json` | Имя, URL, email, Telegram, GitHub, OG, favicon |

### Как добавить проект

1. **Портфолио → Создать проект.**
2. Заполните название, slug (латиница, дефисы), категорию, год, клиента, краткое описание.
3. Загрузите обложку (поле «Обложка» → «Файл»). Файл попадёт в `src/assets/media/`.
4. Добавьте изображения в «Галерею» — у каждого свои alt и подпись.
5. Заполните разделы кейса: «О проекте», «Задача», «Моё участие и реализация», «Результат».
6. Укажите технологии, публичный URL, SEO Title/Description.
7. Включите «Показывать в карусели на главной» и «Опубликован».
8. Сохраните — CMS закоммитит файл, GitHub Actions пересоберёт сайт.

После публикации проект автоматически получает страницу `/projects/<slug>/`,
появляется в карусели и архиве, попадает в sitemap и внутреннюю навигацию.

**Порядок карточек** задаётся числовым полем `order` (меньше — раньше).
**Скрытие проекта** — выключите «Опубликован»: страница не собирается вовсе,
на неё нельзя перейти ни по ссылке, ни из навигации.

### Как изменить заголовок главной

**Главная страница → Hero → Заголовок** → сохранить. Компоненты править не нужно.

---

## SEO и техническое качество

- Уникальные `title` / `description` на каждой странице, canonical, Open Graph, Twitter Cards.
- JSON-LD: `Person`, `WebSite`, `ProfilePage` на главной; `CreativeWork` + `BreadcrumbList`
  на кейсах; `ItemList` в архиве.
- `sitemap-index.xml` генерируется `@astrojs/sitemap`, `robots.txt` — из `src/pages/robots.txt.ts`.
- Один `h1` на страницу, логичная иерархия `h2`/`h3`, alt-тексты у всех изображений.
- Изображения: WebP, адаптивные `srcset`, `loading="lazy"` вне первого экрана,
  фиксированные пропорции (нет CLS).
- Доступность: клавиатурная навигация, видимый focus, `aria-*` у карусели и меню,
  ловушка фокуса в модальных окнах, поддержка `prefers-reduced-motion`.

Показатели Lighthouse не заявляются как достигнутые — их нужно измерить на
опубликованном сайте (`npx lighthouse <url>` или PageSpeed Insights).

---

## Что заменить реальными материалами

1. **Обложки и скриншоты проектов.** Сейчас в `src/assets/media/` лежат
   сгенерированные заглушки с подписью «ПРЕВЬЮ ЗАГЛУШКА · REPLACE VIA CMS».
   Замените их через CMS (или положите файлы с теми же именами).
2. **OG-изображение по умолчанию** — `public/media/og/og-default.png`.
3. **Тексты кейсов Tetriz** (презентационные материалы, реконструкция,
   капитальный ремонт фасадов) — черновики и скрыты из публикации (`published: false`).
   Публикуйте после проверки и дополнения подтверждёнными деталями.
4. **Периоды работы** в `src/data/about.json` — поле `period` пустое.
5. **Строка об образовании** — `home.json → about.education`.
6. **Домен и base path** — переменные `SITE_URL` / `BASE_PATH` в GitHub Actions.
7. **Проверка публичных URL** проектов Tetriz и МКС — ссылки ведут на реальные сайты,
   убедитесь, что публикация материалов согласована.

Перегенерировать заглушки: `npm run media:placeholders` (существующие файлы не перезаписываются).

---

## Лицензия и права

Код — авторский проект Егора Мартынова. Тексты, изображения и скриншоты проектов
принадлежат соответствующим правообладателям; публикация материалов работодателей
требует согласования.
