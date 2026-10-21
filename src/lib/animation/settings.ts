export const motionSettings = {
  scene: 0.38,
  ease: [0.22, 1, 0.36, 1] as const,
  hintDelay: 14_000,
};

export function applyMotionQuality(): boolean {
  const device = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  const gentle = Boolean(device.connection?.saveData || (device.deviceMemory ?? 8) <= 2);
  document.documentElement.dataset.motionQuality = gentle ? 'gentle' : 'full';
  return gentle;
}

/** Une observation, aucune boucle permanente, nettoyage au démontage. */
export function observeMotionScope(element: HTMLElement): () => void {
  let visible = true;
  const update = () => { element.dataset.motionActive = String(visible && !document.hidden); };
  const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
    update();
  }, { rootMargin: '60px' });
  observer?.observe(element);
  document.addEventListener('visibilitychange', update);
  update();
  return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', update); };
}

export function tactileFeedback(): void {
  if (typeof navigator !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate?.(12);
}
