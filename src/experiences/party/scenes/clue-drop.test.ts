import { describe, expect, it } from 'vitest';
import { findClueDrop } from './clue-drop';

const viewport = { left: 0, top: 0, right: 390, bottom: 700 };
const targets = [0, 1, 2].map(position => ({
  position, occupied: position === 1,
  rect: { left: 20 + position * 120, right: 130 + position * 120, top: 550, bottom: 671 },
}));
describe('Dépôt des pièces dans le viewport', () => {
  it('accepte une prise décentrée lorsque la pièce est dans son cadre', () => {
    expect(findClueDrop({ x: 75, y: 520 }, { x: 75, y: 610 }, targets, viewport)).toMatchObject({ position: 0, via: 'piece' });
  });
  it('préserve le cadre explicitement visé, même occupé ou incorrect', () => {
    expect(findClueDrop({ x: 195, y: 610 }, { x: 75, y: 610 }, targets, viewport)).toMatchObject({ position: 1, occupied: true, via: 'contact' });
  });
  it('refuse les dépôts hors cadre et hors viewport, sans tolérance vers un voisin', () => {
    expect(findClueDrop({ x: 135, y: 610 }, { x: 135, y: 610 }, targets, viewport)).toBeNull();
    expect(findClueDrop({ x: -1, y: 610 }, { x: 75, y: 610 }, targets, viewport)).toBeNull();
    expect(findClueDrop({ x: NaN, y: 610 }, { x: 75, y: 610 }, targets, viewport)).toBeNull();
    expect(findClueDrop({ x: 75, y: 500 }, { x: 75, y: 710 }, targets, viewport)).toBeNull();
  });
  it('utilise les rectangles actuels après scroll et transformation', () => {
    const scrolled = targets.map(target => ({ ...target, rect: { ...target.rect, top: 100, bottom: 225 } }));
    expect(findClueDrop({ x: 75, y: 70 }, { x: 75, y: 160 }, scrolled, viewport)).toMatchObject({ position: 0, via: 'piece' });
    expect(findClueDrop({ x: 75, y: 610 }, null, scrolled, viewport)).toBeNull();
  });
});
