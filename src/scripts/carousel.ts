/**
 * Лёгкая карусель на CSS Scroll Snap.
 * - кнопки вперёд/назад, клавиатура, drag мышью, свайп (нативный скролл);
 * - индикатор «01 / 05», прогресс-бар и «активная» карточка;
 * - без автопрокрутки, без бесконечного цикла.
 */

type CarouselOptions = {
  loop?: boolean;
};

function initCarousel(root: HTMLElement, options: CarouselOptions = {}) {
  const trackEl = root.querySelector<HTMLElement>('[data-carousel-track]');
  if (!trackEl) return;
  // Сужение типов не сохраняется внутри вложенных функций — фиксируем ссылку.
  const track: HTMLElement = trackEl;

  const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-carousel-slide]'));
  if (!slides.length) return;

  const prevBtn = root.querySelector<HTMLButtonElement>('[data-carousel-prev]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-carousel-next]');
  const currentEl = root.querySelector<HTMLElement>('[data-carousel-current]');
  const totalEl = root.querySelector<HTMLElement>('[data-carousel-total]');
  const progressEl = root.querySelector<HTMLElement>('[data-carousel-progress]');
  const statusEl = root.querySelector<HTMLElement>('[data-carousel-status]');

  const pad = (value: number) => String(value).padStart(2, '0');
  if (totalEl) totalEl.textContent = pad(slides.length);

  let activeIndex = 0;
  let scrollTimer = 0;
  let rafId = 0;

  const slideCenter = (slide: HTMLElement) => slide.offsetLeft + slide.offsetWidth / 2;
  const currentCenter = () => track.scrollLeft + track.clientWidth / 2;

  function nearestIndex(): number {
    const center = currentCenter();
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const distance = Math.abs(slideCenter(slide) - center);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  }

  function updateProgress() {
    const max = track.scrollWidth - track.clientWidth;
    const ratio = max > 0 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 1;
    if (progressEl) progressEl.style.transform = `scaleX(${Math.max(0.06, ratio)})`;
  }

  function setActive(index: number, announce = true) {
    const nextIndex = Math.min(slides.length - 1, Math.max(0, index));
    if (nextIndex === activeIndex) {
      updateButtons();
      return;
    }
    slides[activeIndex]?.classList.remove('is-active');
    slides[activeIndex]?.removeAttribute('aria-current');
    activeIndex = nextIndex;
    slides[activeIndex]?.classList.add('is-active');
    slides[activeIndex]?.setAttribute('aria-current', 'true');

    if (currentEl) currentEl.textContent = pad(activeIndex + 1);
    if (statusEl && announce) {
      const title = slides[activeIndex]?.dataset.title || '';
      statusEl.textContent = `Проект ${activeIndex + 1} из ${slides.length}${title ? `: ${title}` : ''}`;
    }
    updateButtons();
  }

  function updateButtons() {
    if (!options.loop) {
      if (prevBtn) prevBtn.disabled = activeIndex <= 0;
      if (nextBtn) nextBtn.disabled = activeIndex >= slides.length - 1;
    }
  }

  function goTo(index: number) {
    const target = options.loop
      ? (index + slides.length) % slides.length
      : Math.min(slides.length - 1, Math.max(0, index));
    const slide = slides[target];
    if (!slide) return;
    const left = slideCenter(slide) - track.clientWidth / 2;
    track.scrollTo({ left, behavior: 'smooth' });
    setActive(target);
  }

  const onScroll = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(updateProgress);
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => setActive(nearestIndex()), 80);
  };

  track.addEventListener('scroll', onScroll, { passive: true });

  prevBtn?.addEventListener('click', () => goTo(activeIndex - 1));
  nextBtn?.addEventListener('click', () => goTo(activeIndex + 1));

  // Стрелки клавиатуры, когда фокус внутри карусели.
  track.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href]');
      const slide = target.closest<HTMLElement>('[data-carousel-slide]');
      if (!link || !slide) return;
      const index = slides.indexOf(slide);
      if (index === -1 || index === nearestIndex()) return;
      event.preventDefault();
      event.stopPropagation();
      goTo(index);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(activeIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goTo(slides.length - 1);
    }
  });

  // Наводим фокус на карточку перед кликом, чтобы Tab и стрелки работали.
  slides.forEach((slide) => {
    slide.addEventListener('focusin', () => {
      const index = slides.indexOf(slide);
      if (index !== activeIndex) goTo(index);
    });
  });

  // Drag мышью (на тач-устройствах работает нативный swipe).
  let isPointerDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    isPointerDown = true;
    moved = false;
    startX = event.clientX;
    startScroll = track.scrollLeft;
  });

  track.addEventListener('pointermove', (event) => {
    if (!isPointerDown) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 5 && !moved) {
      moved = true;
      track.classList.add('is-dragging');
    }
    if (!moved) return;
    track.scrollLeft = startScroll - delta;
  });

  const endDrag = () => {
    if (!isPointerDown) return;
    isPointerDown = false;
    if (moved) {
      track.classList.remove('is-dragging');
      goTo(nearestIndex());
      // Клик после перетаскивания не должен открывать проект.
      const blockClick = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      track.addEventListener('click', blockClick, { capture: true, once: true });
      window.setTimeout(() => track.removeEventListener('click', blockClick, { capture: true }), 0);
    }
    moved = false;
  };

  // Клик по боковой карточке не открывает проект, а прокручивает к ней карусель.
  // Перехватываем на фазе захвата: ссылка внутри карточки не должна успеть
  // начать переход. Клик после drag блокируется отдельным обработчиком выше.
  track.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const slide = target.closest<HTMLElement>('[data-carousel-slide]');
      if (!slide) return;
      const index = slides.indexOf(slide);
      if (index === -1 || index === nearestIndex()) return;
      event.preventDefault();
      event.stopPropagation();
      goTo(index);
    },
    { capture: true },
  );

  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('dragstart', (event) => event.preventDefault());

  // Стартовое состояние.
  requestAnimationFrame(() => {
    slides[0]?.classList.add('is-active');
    slides[0]?.setAttribute('aria-current', 'true');
    if (currentEl) currentEl.textContent = pad(1);
    updateButtons();
    updateProgress();
    if (!options.loop && track.scrollWidth <= track.clientWidth + 4) {
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    }
  });

  root.addEventListener('carousel:refresh', () => {
    cancelAnimationFrame(rafId);
    updateProgress();
    setActive(nearestIndex(), false);
  });

  // При смене размера экрана пересчитываем позицию без скачка.
  let resizeTimer = 0;
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => goTo(activeIndex), 160);
    },
    { passive: true },
  );
}

export function initCarousels() {
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((root) => {
    const mode = root.dataset.carousel;
    initCarousel(root, { loop: mode === 'loop' });
  });
}
