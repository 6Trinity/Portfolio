/**
 * Полноэкранный просмотр изображений: навигация, зум, клавиатура, swipe.
 * Блокировка прокрутки снимается при любом способе закрытия.
 */

type LightboxItem = {
  src: string;
  alt: string;
  caption: string;
};

function readItems(): LightboxItem[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-lightbox]')).map((el) => {
    const img = el.querySelector<HTMLImageElement>('img');
    // Уже загруженный вариант (самый крупный из srcset) — без повторной загрузки.
    const loaded = img?.currentSrc || '';
    return {
      src:
        el.dataset.src ||
        el.querySelector<HTMLElement>('[data-full-src]')?.dataset.fullSrc ||
        loaded ||
        el.getAttribute('src') ||
        '',
      alt: el.dataset.alt || el.getAttribute('alt') || '',
      caption: el.dataset.caption || '',
    };
  });
}

export function initLightbox() {
  const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-lightbox]'));
  if (!triggers.length) return;

  const items = readItems();
  const total = items.length;
  let index = 0;
  let zoomed = false;
  let lastFocused: HTMLElement | null = null;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Просмотр изображения');
  overlay.innerHTML = `
    <div class="lightbox__backdrop" data-lb-close></div>
    <div class="lightbox__dialog">
      <div class="lightbox__bar">
        <span class="lightbox__counter mono"><span data-lb-current>01</span> / <span data-lb-total>${String(total).padStart(2, '0')}</span></span>
        <div class="lightbox__tools">
          <button type="button" class="icon-btn lightbox__btn" data-lb-zoom aria-label="Увеличить" aria-pressed="false">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5"/><path d="M11 8.5v5M8.5 11h5"/><path d="m20 20-3.6-3.6"/>
            </svg>
          </button>
          <button type="button" class="icon-btn lightbox__btn" data-lb-close aria-label="Закрыть просмотр">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="lightbox__stage" data-lb-stage>
        <button type="button" class="icon-btn lightbox__nav lightbox__nav--prev" data-lb-prev aria-label="Предыдущее изображение">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>
        </button>
        <img class="lightbox__img" data-lb-img alt="" decoding="async" />
        <button type="button" class="icon-btn lightbox__nav lightbox__nav--next" data-lb-next aria-label="Следующее изображение">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
        </button>
      </div>
      <p class="lightbox__caption" data-lb-caption></p>
    </div>
  `;
  document.body.appendChild(overlay);

  const dialog = overlay.querySelector<HTMLElement>('.lightbox__dialog')!;
  const img = overlay.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const captionEl = overlay.querySelector<HTMLElement>('[data-lb-caption]')!;
  const currentEl = overlay.querySelector<HTMLElement>('[data-lb-current]')!;
  const totalEl = overlay.querySelector<HTMLElement>('[data-lb-total]')!;
  const zoomBtn = overlay.querySelector<HTMLButtonElement>('[data-lb-zoom]')!;
  const prevBtn = overlay.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const nextBtn = overlay.querySelector<HTMLButtonElement>('[data-lb-next]')!;
  const stage = overlay.querySelector<HTMLElement>('[data-lb-stage]')!;
  const focusables = () =>
    Array.from(dialog.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])'));

  let scrollLocked = false;

  function lock(lockValue: boolean) {
    if (lockValue === scrollLocked) return;
    scrollLocked = lockValue;
    if (lockValue) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.setProperty('padding-right', scrollbar > 0 ? `${scrollbar}px` : '');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.removeProperty('padding-right');
    }
  }

  function applyZoom(next: boolean) {
    zoomed = next;
    stage.classList.toggle('is-zoomed', zoomed);
    zoomBtn.setAttribute('aria-pressed', String(zoomed));
    zoomBtn.setAttribute('aria-label', zoomed ? 'Уменьшить' : 'Увеличить');
    zoomBtn.classList.toggle('is-active', zoomed);
  }

  function render(nextIndex: number) {
    index = (nextIndex + total) % total;
    const item = items[index];
    if (!item) return;
    applyZoom(false);
    img.classList.remove('is-loaded');
    img.src = item.src;
    img.alt = item.alt || `Изображение ${index + 1}`;
    if (img.complete) img.classList.add('is-loaded');
    captionEl.textContent = item.caption;
    captionEl.hidden = !item.caption;
    currentEl.textContent = String(index + 1).padStart(2, '0');
    totalEl.textContent = String(total).padStart(2, '0');
    const multiple = total > 1;
    prevBtn.hidden = !multiple;
    nextBtn.hidden = !multiple;
  }

  img.addEventListener('load', () => img.classList.add('is-loaded'));

  function open(startIndex: number) {
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlay.hidden = false;
    lock(true);
    render(startIndex);
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      zoomBtn.focus();
    });
  }

  function close() {
    overlay.classList.remove('is-open');
    lock(false);
    overlay.hidden = true;
    applyZoom(false);
    if (lastFocused) lastFocused.focus({ preventScroll: true });
    lastFocused = null;
  }

  triggers.forEach((trigger, triggerIndex) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      open(triggerIndex);
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(triggerIndex);
      }
    });
  });

  overlay.querySelectorAll('[data-lb-close]').forEach((el) => el.addEventListener('click', close));
  prevBtn.addEventListener('click', () => render(index - 1));
  nextBtn.addEventListener('click', () => render(index + 1));
  zoomBtn.addEventListener('click', () => applyZoom(!zoomed));
  stage.addEventListener('click', (event) => {
    if (event.target === img && zoomed) applyZoom(false);
  });

  document.addEventListener('keydown', (event) => {
    if (overlay.hidden) return;
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'ArrowRight':
        event.preventDefault();
        render(index + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        render(index - 1);
        break;
      case 'Tab': {
        const nodes = focusables().filter((el) => !el.hidden);
        if (!nodes.length) break;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        break;
      }
      default:
        break;
    }
  });

  // Свайп на тач-устройствах.
  let touchStartX = 0;
  let touchStartY = 0;
  stage.addEventListener(
    'touchstart',
    (event) => {
      touchStartX = event.touches[0]?.clientX ?? 0;
      touchStartY = event.touches[0]?.clientY ?? 0;
    },
    { passive: true },
  );
  stage.addEventListener(
    'touchend',
    (event) => {
      if (zoomed) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
        render(index + (deltaX < 0 ? 1 : -1));
      }
    },
    { passive: true },
  );

  window.addEventListener('pagehide', () => lock(false));

  // Стили лайтбокса — подключаются вместе с модулем, только если он нужен.
  const style = document.createElement('style');
  style.textContent = `
    .lightbox { position: fixed; inset: 0; z-index: var(--z-lightbox); display: grid; place-items: center; opacity: 0; transition: opacity 260ms var(--ease-out); }
    .lightbox[hidden] { display: none; }
    .lightbox.is-open { opacity: 1; }
    .lightbox__backdrop { position: absolute; inset: 0; background: rgba(6, 7, 10, 0.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
    .lightbox__dialog { position: relative; display: flex; flex-direction: column; width: min(1240px, 100% - 1.5rem); height: 100%; max-height: 100svh; padding: clamp(0.75rem, 2vw, 1.5rem); gap: 0.75rem; }
    .lightbox__bar { flex: none; }
    .lightbox__caption { flex: none; }
    .lightbox__bar { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .lightbox__counter { color: var(--color-text-secondary); }
    .lightbox__tools { display: flex; gap: 0.5rem; }
    .lightbox__btn { width: 44px; height: 44px; background: rgba(23, 25, 31, 0.8); }
    .lightbox__btn.is-active { border-color: var(--color-line-accent); background: var(--color-accent-soft); color: #fff; }
    .lightbox__stage { position: relative; flex: 1; display: grid; place-items: center; min-height: 0; overflow: hidden; touch-action: pan-y; }
    .lightbox__img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; border-radius: 14px; opacity: 0; transition: opacity 260ms var(--ease-out), transform 320ms var(--ease-out); box-shadow: 0 40px 120px -40px rgba(0,0,0,0.9); cursor: zoom-in; }
    .lightbox__img.is-loaded { opacity: 1; }
    .lightbox__stage.is-zoomed { overflow: auto; place-items: start center; }
    .lightbox__stage.is-zoomed .lightbox__img { max-width: none; max-height: none; width: auto; cursor: zoom-out; }
    .lightbox__nav { position: absolute; top: 50%; z-index: 2; transform: translateY(-50%); width: 48px; height: 48px; background: rgba(23, 25, 31, 0.82); }
    .lightbox__nav--prev { left: 0; }
    .lightbox__nav--next { right: 0; }
    .lightbox__caption { min-height: 1.4em; text-align: center; font-size: 0.875rem; color: var(--color-text-secondary); }
    @media (max-width: 640px) {
      .lightbox__nav { display: none; }
      .lightbox__dialog { width: 100%; padding: 0.75rem; }
    }
  `;
  document.head.appendChild(style);
}
