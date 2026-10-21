import { describe, expect, it } from 'vitest';
import { initialProposalState, proposalReducer, type ProposalState } from './scenes/proposal-state';
const next = (state: ProposalState) => proposalReducer(state, { type: 'next' });
function memoriesCollected() {
  let state = next(initialProposalState);
  for (const index of [0,1,2]) state = proposalReducer(state,{type:'memory',index});
  return next(state);
}
describe('La grande question : histoire, constellation et liberté de réponse', () => {
  it('requiert trois souvenirs distincts avant de réunir les étoiles', () => {
    let state=next(initialProposalState);
    for(const index of [0,0,1]) state=proposalReducer(state,{type:'memory',index});
    expect(state.memories).toEqual([0,1]);
    expect(next(state).step).toBe(1);
    state=proposalReducer(state,{type:'memory',index:2});
    expect(next(state).step).toBe(2);
  });
  it('ne trace la constellation que dans l’ordre et sans saut ni doublon', () => {
    let state=memoriesCollected();
    expect(proposalReducer(state,{type:'connect',index:2})).toBe(state);
    expect(next(state).step).toBe(2);
    for(const index of [0,1,2,3,4]) {
      state=proposalReducer(state,{type:'connect',index});
      if(index<4) expect(next(state).step).toBe(2);
    }
    expect(state.constellation).toEqual([0,1,2,3,4]);
    expect(proposalReducer(state,{type:'connect',index:4})).toBe(state);
    expect(next(state).step).toBe(3);
  });
  it('requiert de briser le sceau, déplier la lettre puis ouvrir la bague', () => {
    let state:ProposalState={...memoriesCollected(),step:3,constellation:[0,1,2,3,4]};
    expect(proposalReducer(state,{type:'letter'})).toBe(state);
    state=proposalReducer(state,{type:'seal'});
    expect(next(state).step).toBe(3);
    state=next(proposalReducer(state,{type:'letter'}));
    expect(state.step).toBe(4);
    expect(next(state).step).toBe(4);
    state=next(proposalReducer(state,{type:'ring'}));
    expect(state.step).toBe(5);
    for(const answer of ['yes','time','no'] as const){
      const answered=proposalReducer(state,{type:'answer',answer});
      expect(answered.answer).toBe(answer);
      expect(next(answered).step).toBe(5);
      expect(proposalReducer(answered,{type:'answer',answer:null}).answer).toBeNull();
    }
  });
  it('ignore les interactions hors scène et les indices invalides', () => {
    for(const action of [{type:'memory',index:0},{type:'connect',index:0},{type:'ring'},{type:'seal'},{type:'answer',answer:'yes'}] as const) expect(proposalReducer(initialProposalState,action)).toBe(initialProposalState);
    const state=next(initialProposalState);
    for(const index of [-1,3,.5,NaN]) expect(proposalReducer(state,{type:'memory',index})).toBe(state);
  });
  it('conserve les découvertes au retour arrière et remet tout à zéro au replay', () => {
    const state=memoriesCollected();
    expect(proposalReducer(state,{type:'back'})).toMatchObject({step:1,memories:[0,1,2]});
    expect(proposalReducer(initialProposalState,{type:'back'})).toBe(initialProposalState);
    expect(proposalReducer({...state,answer:'no',ringOpen:true,sealBroken:true},{type:'replay'})).toEqual(initialProposalState);
  });
});
