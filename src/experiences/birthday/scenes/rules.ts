/** Bornes d’interaction : chaque configuration reste jouable sur petit écran. */
export function getBalloonGoal(requested: number): number {
  return Number.isFinite(requested) ? Math.min(8, Math.max(3, Math.round(requested))) : 3;
}

export function getCandleCount(requested: number): number {
  return Number.isFinite(requested) ? Math.min(8, Math.max(1, Math.round(requested))) : 5;
}

export function getGiftGoal(requested: number): number {
  return Number.isFinite(requested) ? Math.min(8, Math.max(2, Math.round(requested))) : 3;
}

export function balloonsUnlocked(popped: readonly number[], goal: number): boolean {
  return new Set(popped).size >= getBalloonGoal(goal);
}

export function candlesReady(lit: readonly number[], count: number): boolean {
  return new Set(lit).size >= getCandleCount(count);
}

export function giftUnlocked(taps: number, goal: number): boolean {
  return taps >= getGiftGoal(goal);
}
