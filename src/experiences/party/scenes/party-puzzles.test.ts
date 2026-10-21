import { describe, expect, it } from 'vitest';
import { cluesAssembled, codeMatches, getPartyCode, placeClue, type ClueSlots } from './party-puzzles';
describe('Le ticket et le code disco',()=>{
  it('refuse la mauvaise case et les positions invalides',()=>{
    const slots:ClueSlots=[null,null,null];
    for(const index of [1,-1,3,.5]) expect(placeClue(slots,'disco',index)).toBe(slots);
    expect(cluesAssembled(slots)).toBe(false);
  });
  it('assemble les trois pièces distinctes et révèle leur ordre',()=>{
    let slots:ClueSlots=[null,null,null];
    slots=placeClue(slots,'photo',2);
    slots=placeClue(slots,'disco',0);
    expect(cluesAssembled(slots)).toBe(false);
    expect(placeClue(slots,'photo',2)).toBe(slots);
    slots=placeClue(slots,'record',1);
    expect(cluesAssembled(slots)).toBe(true);
  });
  it('compare un code exact à trois chiffres, y compris avec zéro initial',()=>{
    expect(getPartyCode({})).toBe('274');
    expect(getPartyCode({puzzleCode:'027'})).toBe('027');
    expect(codeMatches('027','027')).toBe(true);
    for(const value of ['27',' 027','0270','abc','274']) expect(codeMatches(value,'027')).toBe(false);
  });
});
