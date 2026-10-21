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
  return new Set(popped.filter(id => isLuckyBalloon(id, goal))).size >= getBalloonGoal(goal);
}

export function isLuckyBalloon(id: number, goal: number): boolean { return Number.isInteger(id) && id >= 0 && id < getBalloonGoal(goal); }
export function collectStar(found: number[], id: number): number[] { return Number.isInteger(id) && id >= 0 && id < 3 && !found.includes(id) ? [...found, id] : found; }
export function starsUnlocked(found: readonly number[]): boolean { return [0, 1, 2].every(id => found.includes(id)); }

export function candlesReady(lit: readonly number[], count: number): boolean {
  return new Set(lit).size >= getCandleCount(count);
}

export function giftUnlocked(taps: number, goal: number): boolean {
  return taps >= getGiftGoal(goal);
}
