/**
 * Глобальные интеракции сайта.
 * Модули подключаются лениво: код карусели/лайтбокса загружается
 * только на страницах, где они действительно нужны.
 */

const BASE = import.meta.env.BASE_URL || '/';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ─────────────────────────  Приведение внутренних ссылок к base  ───────────────────────── */

function withBase(href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (href.startsWith(BASE) || BASE === '/') return href;
  return `${BASE.replace(/\/$/, '')}${href}`;
}

function normalizeLinks(root: ParentNode = document) {
  root.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    link.setAttribute('href', withBase(href));
  });
}

normalizeLinks();

/* ─────────────────────────  Шапка  ───────────────────────── */

function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 16);
    ticking = false;
  };

  update();
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
}

/* ─────────────────────────  Мобильное меню  ───────────────────────── */

function initMenu() {
  const toggleEl = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menuEl = document.querySelector<HTMLElement>('[data-menu]');
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!toggleEl || !menuEl) return;
  // Сужение типов не сохраняется внутри вложенных функций — фиксируем ссылки.
  const toggle: HTMLButtonElement = toggleEl;
  const menu: HTMLElement = menuEl;

  const panel = menu.querySelector<HTMLElement>('.mobile-menu__panel');
  const closeBtn = menu.querySelector<HTMLButtonElement>('[data-menu-close]');
  const focusablesSelector =
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let lastFocused: HTMLElement | null = null;
  let closeTimer = 0;
  let openedAt = 0;

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function lockScroll(lock: boolean) {
    if (lock) {
      // Компенсируем исчезновение скроллбара, чтобы контент не прыгал.
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.setProperty('padding-right', scrollbar > 0 ? `${scrollbar}px` : '');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.removeProperty('padding-right');
    }
  }

  function open() {
    window.clearTimeout(closeTimer);
    openedAt = Date.now();
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Закрыть меню');
    header?.classList.add('is-open');
    lockScroll(true);
    requestAnimationFrame(() => {
      menu.classList.add('is-open');
      (panel?.querySelector<HTMLElement>(focusablesSelector) ?? closeBtn)?.focus();
    });
  }

  function close(restoreFocus = true) {
    if (!isOpen()) return;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
    header?.classList.remove('is-open');
    lockScroll(false);
    closeTimer = window.setTimeout(() => {
      menu.hidden = true;
    }, 280);
    if (restoreFocus && lastFocused) lastFocused.focus();
    lastFocused = null;
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));
  closeBtn?.addEventListener('click', () => close());

  menu.querySelectorAll('[data-menu-link]').forEach((link) => {
    link.addEventListener('click', () => close(false));
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    // Ловушка фокуса внутри панели.
    if (event.key === 'Tab' && panel) {
      const items = Array.from(panel.querySelectorAll<HTMLElement>(focusablesSelector)).filter(
        (el) => el.offsetParent !== null,
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Клик вне области меню закрывает его. Исключение — сам клик/тап по кнопке-
  // бургеру, которым меню открыли: это тот же жест, а не клик «снаружи».
  document.addEventListener('click', (event) => {
    if (!isOpen() || Date.now() - openedAt < 400) return;
    const target = event.target as Node;
    if (toggle.contains(target)) return;
    const targetElement = event.target instanceof Element ? event.target : null;
    const interactiveOutside = targetElement?.closest('a[href], button, input, textarea, select, [role="button"]');
    if (interactiveOutside) return;
    close();
  });

  // Если меню открыто и экран вырос до десктопа — закрываем, чтобы не остался lock.
  window.matchMedia('(min-width: 961px)').addEventListener('change', (event) => {
    if (event.matches) close(false);
  });

  // Страховка: при уходе со страницы снимаем блокировку прокрутки.
  window.addEventListener('pagehide', () => {
    window.clearTimeout(closeTimer);
    menu.hidden = true;
    menu.classList.remove('is-open');
    header?.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    lockScroll(false);
  });
}

/* ─────────────────────────  Плавный скролл к секциям  ───────────────────────── */

function headerOffset(): number {
  const header = document.querySelector<HTMLElement>('[data-header]');
  return (header?.getBoundingClientRect().height ?? 70) + 16;
}

function scrollToHash(hash: string, updateHistory: boolean) {
  if (!hash || hash === '#') return;
  const onHome = document.body.dataset.page === 'home';
  const id = hash.slice(1);

  if (!onHome) {
    window.location.href = `${BASE}#${id}`;
    return;
  }

  const target = document.getElementById(id);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
  window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  if (updateHistory) history.replaceState(null, '', `${BASE}#${id}`);
}

function initAnchorScroll() {
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link) return;
    if (link.hasAttribute('data-lightbox') || link.hasAttribute('download')) return;
    const href = link.getAttribute('href') || '';
    const [path, hash] = href.split('#');
    if (!hash) return;

    const cleanPath = path.replace(BASE, '/').replace(/\/+/g, '/');
    const isSamePage =
      path === '' ||
      path === BASE ||
      path === '/' ||
      cleanPath === window.location.pathname.replace(BASE, '/') ||
      (cleanPath === '/' && document.body.dataset.page === 'home');

    if (!isSamePage) return; // обычный переход
    event.preventDefault();
    scrollToHash(`#${hash}`, true);
  });

  if (document.body.dataset.page === 'home' && window.location.hash) {
    requestAnimationFrame(() => scrollToHash(window.location.hash, false));
  }
}

/* ─────────────────────────  Появление секций  ───────────────────────── */

function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!items.length) return;

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  items.forEach((item) => observer.observe(item));
}

/* ─────────────────────────  Возврат наверх  ───────────────────────── */

function initToTop() {
  document.querySelectorAll<HTMLElement>('[data-to-top]').forEach((button) => {
    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      const skip = document.querySelector<HTMLElement>('.skip-link');
      if (skip) skip.focus({ preventScroll: true });
    });
  });
}

/* ─────────────────────────  Счётчики (без искусственных задержек)  ───────────────────────── */

function initCounters() {
  const counters = document.querySelectorAll<HTMLElement>('[data-count-to]');
  counters.forEach((counter) => {
    const to = Number(counter.dataset.countTo || 0);
    if (!to) return;
    const format = (value: number) =>
      counter.dataset.pad === 'true' ? String(value).padStart(2, '0') : String(value);
    if (reduceMotion.matches) {
      counter.textContent = format(to);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 900;
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = format(Math.round(to * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(counter);
  });
}

/* ─────────────────────────  Запуск  ───────────────────────── */

initHeader();
initMenu();
initAnchorScroll();
initReveal();
initToTop();
initCounters();

// Модули конкретных страниц — по наличию разметки.
if (document.querySelector('[data-carousel]')) {
  import('./carousel').then(({ initCarousels }) => initCarousels()).catch(() => { });
}

if (document.querySelector('[data-lightbox]')) {
  // Ждём load: каруселям нужно доехать до стартовой позиции, иначе первый клик
  // может прийтись на момент ещё не законченной плавной прокрутки и не сработать.
  const startLightbox = () =>
    import('./lightbox').then(({ initLightbox }) => initLightbox()).catch(() => { });
  if (document.readyState === 'complete') {
    requestAnimationFrame(() => requestAnimationFrame(startLightbox));
  } else {
    window.addEventListener('load', () => requestAnimationFrame(startLightbox), { once: true });
  }
}

if (document.querySelector('[data-hero-object]')) {
  import('./hero-object').then(({ initHeroObject }) => initHeroObject()).catch(() => { });
}

export { };
