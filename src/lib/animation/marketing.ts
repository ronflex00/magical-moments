import { applyMotionQuality, observeMotionScope, tactileFeedback } from './settings';

/** Effets DOM de la vitrine : aucun îlot React et aucune boucle de rendu continue. */
export function initMarketing(): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const limited = applyMotionQuality();
  const cleanups = [...document.querySelectorAll<HTMLElement>('[data-motion-scope]')].map(observeMotionScope);
  const hero = document.querySelector<HTMLElement>('.hero-art');
  const gift = document.querySelector<HTMLButtonElement>('.surprise-art');
  const message = document.querySelector<HTMLElement>('#hero-surprise');
  const reset = document.querySelector<HTMLButtonElement>('.hero-reset');
  const confetti = document.querySelector<HTMLElement>('.hero-confetti');
  const motionToggle = document.querySelector<HTMLButtonElement>('.motion-toggle');
  motionToggle?.addEventListener('click', () => {
    const paused = document.documentElement.dataset.motionPaused !== 'true';
    document.documentElement.dataset.motionPaused = String(paused);
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.setAttribute('aria-label', paused ? 'Reprendre les animations ambiantes' : 'Mettre les animations ambiantes en pause');
    motionToggle.textContent = paused ? '▷' : 'Ⅱ';
  }, { signal });
  let pointerFrame = 0;
  let scrollFrame = 0;

  function giftState(open: boolean) {
    gift?.setAttribute('aria-expanded', String(open));
    hero?.classList.toggle('is-open', open);
    if (message) message.hidden = !open;
    if (reset) reset.hidden = !open;
    if (confetti) {
      confetti.replaceChildren();
      if (open && !reduce.matches) for (let i = 0; i < (limited ? 8 : 16); i++) {
        const piece = document.createElement('i');
        piece.style.setProperty('--piece', String(i));
        piece.textContent = i % 3 === 0 ? '✧' : '';
        confetti.append(piece);
      }
    }
    tactileFeedback();
  }
  gift?.addEventListener('click', () => giftState(gift.getAttribute('aria-expanded') !== 'true'), { signal });
  reset?.addEventListener('click', () => { giftState(false); gift?.focus({ preventScroll: true }); }, { signal });

  hero?.addEventListener('pointermove', event => {
    if (!fine.matches || reduce.matches || limited) return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      hero.style.setProperty('--px', `${x * 16}px`);
      hero.style.setProperty('--py', `${y * 14}px`);
      hero.style.setProperty('--tilt-x', `${-y * 5}deg`);
      hero.style.setProperty('--tilt-y', `${x * 6}deg`);
    });
  }, { signal, passive: true });
  function resetPointer() { cancelAnimationFrame(pointerFrame); hero?.style.setProperty('--px', '0px'); hero?.style.setProperty('--py', '0px'); hero?.style.setProperty('--tilt-x', '0deg'); hero?.style.setProperty('--tilt-y', '0deg'); }
  hero?.addEventListener('pointerleave', resetPointer, { signal });
  reduce.addEventListener('change', () => { resetPointer(); updateScroll(); }, { signal });

  const revealNodes = [...document.querySelectorAll<HTMLElement>('.section-heading,.experience-card,.how-heading,.how-grid li,.personal-copy,.personal-playground,.contact-inner')];
  const reveal = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); reveal?.unobserve(entry.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -20px 0px' });
  revealNodes.forEach((node, index) => {
    node.classList.add('paper-reveal');
    node.style.setProperty('--reveal-delay', `${index % 3 * .08}s`);
    reveal?.observe(node);
    if (!reveal) node.classList.add('is-revealed');
  });

  const how = document.querySelector<HTMLElement>('#comment');
  function updateScroll() {
    scrollFrame = 0;
    if (document.hidden) return;
    // Toutes les lectures précèdent les écritures ; une frame au plus par événement scroll.
    const heroRect = hero?.getBoundingClientRect();
    const howRect = how?.getBoundingClientRect();
    const viewport = innerHeight;
    if (heroRect && heroRect.bottom > 0 && heroRect.top < viewport) {
      hero?.style.setProperty('--scroll-depth', reduce.matches || limited ? '0px' : `${Math.max(-16, Math.min(20, (viewport / 2 - heroRect.top - heroRect.height / 2) * .04))}px`);
    }
    if (howRect) how?.style.setProperty('--thread-progress', String(Math.max(0, Math.min(1, (viewport * .85 - howRect.top) / (howRect.height * .65)))));
  }
  function queueScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }
  window.addEventListener('scroll', queueScroll, { signal, passive: true });
  window.addEventListener('resize', queueScroll, { signal, passive: true });
  document.addEventListener('visibilitychange', queueScroll, { signal });
  updateScroll();

  document.querySelectorAll<HTMLElement>('.experience-card,.hero-actions .button,.nav-cta').forEach(element => {
    let frame = 0;
    element.addEventListener('pointermove', event => {
      if (!fine.matches || reduce.matches || limited) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        element.style.setProperty('--hover-x', `${((event.clientX - rect.left) / rect.width - .5) * 4}deg`);
        element.style.setProperty('--hover-y', `${-((event.clientY - rect.top) / rect.height - .5) * 4}deg`);
      });
    }, { signal, passive: true });
    element.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); element.style.setProperty('--hover-x', '0deg'); element.style.setProperty('--hover-y', '0deg'); }, { signal });
    cleanups.push(() => cancelAnimationFrame(frame));
  });

  const preview = document.querySelector<HTMLElement>('.personal-playground');
  const name = preview?.querySelector<HTMLInputElement>('.preview-name-input');
  const note = preview?.querySelector<HTMLSelectElement>('.preview-message-input');
  name?.addEventListener('input', () => { const target = preview?.querySelector('.preview-name'); if (target) target.textContent = `Pour ${name.value.trim() || 'vous'}.`; }, { signal });
  note?.addEventListener('change', () => { const target = preview?.querySelector('.preview-message'); if (target) target.textContent = note.value; }, { signal });
  preview?.querySelectorAll<HTMLButtonElement>('[data-preview-color]').forEach(button => button.addEventListener('click', () => {
    preview.querySelector<HTMLElement>('.personal-art')?.style.setProperty('--preview-color', button.dataset.previewColor ?? '#cf6c60');
    preview.querySelectorAll('[data-preview-color]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    tactileFeedback();
  }, { signal }));

  // Pas d’interception des liens : transitions natives entre documents, sinon navigation normale.
  document.querySelectorAll<HTMLAnchorElement>('.experience-card a').forEach(link => link.addEventListener('click', () => tactileFeedback(), { signal }));
  return () => { controller.abort(); cleanups.forEach(cleanup => cleanup()); reveal?.disconnect(); cancelAnimationFrame(pointerFrame); cancelAnimationFrame(scrollFrame); };
}
