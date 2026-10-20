import { describe, expect, it } from 'vitest';
import { balloonsUnlocked, candlesReady, getBalloonGoal, getCandleCount, getGiftGoal, giftUnlocked } from './scenes/rules';

describe('Birthday Quest : conditions de progression', () => {
  it('demande toujours au moins trois ballons distincts', () => {
    expect(getBalloonGoal(1)).toBe(3);
    expect(balloonsUnlocked([0, 0, 1], 3)).toBe(false);
    expect(balloonsUnlocked([0, 1, 2], 3)).toBe(true);
    expect(balloonsUnlocked([0, 1, 2], 4)).toBe(false);
  });

  it('attend que toutes les bougies soient allumées', () => {
    expect(candlesReady([0, 1, 1], 3)).toBe(false);
    expect(candlesReady([0, 1, 2], 3)).toBe(true);
  });

  it('révèle le cadeau seulement au nombre de tapotements configuré', () => {
    expect(giftUnlocked(2, 3)).toBe(false);
    expect(giftUnlocked(3, 3)).toBe(true);
    expect(giftUnlocked(4, 3)).toBe(true);
  });

  it('conserve des objectifs jouables pour les données extrêmes', () => {
    expect(getBalloonGoal(100)).toBe(8);
    expect(getBalloonGoal(Number.NaN)).toBe(3);
    expect(getCandleCount(0)).toBe(1);
    expect(getCandleCount(Infinity)).toBe(5);
    expect(getGiftGoal(0)).toBe(2);
    expect(getGiftGoal(99)).toBe(8);
  });
});
