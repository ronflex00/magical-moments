import { describe, expect, it } from 'vitest';
import { balloonsUnlocked, candlesReady, getBalloonGoal, getCandleCount, getGiftGoal, giftUnlocked, isLuckyBalloon, collectStar, starsUnlocked } from './scenes/rules';

describe('Birthday Quest : conditions de progression', () => {
  it('ne compte jamais les ballons sans étoile dans la progression', () => {
    expect(isLuckyBalloon(3,3)).toBe(false);
    expect(isLuckyBalloon(2,3)).toBe(true);
    expect(balloonsUnlocked([3,4,5],3)).toBe(false);
    expect(balloonsUnlocked([0,1,3],3)).toBe(false);
  });
  it('exige les trois étoiles distinctes du jardin et ignore les objets vides', () => {
    let found = collectStar([],0);
    found = collectStar(found,0);
    found = collectStar(found,-1);
    expect(found).toEqual([0]);
    expect(starsUnlocked(found)).toBe(false);
    found = collectStar(collectStar(found,2),1);
    expect(starsUnlocked(found)).toBe(true);
    expect(collectStar(found,3)).toBe(found);
  });
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
