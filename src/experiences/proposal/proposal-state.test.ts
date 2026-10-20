import { describe, expect, it } from 'vitest';
import { initialProposalState, proposalReducer, type ProposalState } from './scenes/proposal-state';

const next = (state: ProposalState) => proposalReducer(state, { type: 'next' });
describe('The Big Question : progression et liberté de réponse', () => {
  it('ne quitte le ciel des souvenirs que lorsque trois étoiles distinctes ont été découvertes', () => {
    let state = next(initialProposalState);
    expect(state.step).toBe(1);
    expect(next(state).step).toBe(1);
    state = proposalReducer(state, { type: 'memory', index: 0 });
    state = proposalReducer(state, { type: 'memory', index: 0 });
    state = proposalReducer(state, { type: 'memory', index: 1 });
    expect(state.memories).toEqual([0, 1]);
    expect(next(state).step).toBe(1);
    state = proposalReducer(state, { type: 'memory', index: 2 });
    expect(next(state).step).toBe(2);
  });

  it('requiert l’ouverture de la lettre puis de la boîte et propose les trois réponses', () => {
    let state = next(initialProposalState);
    for (const index of [0, 1, 2]) state = proposalReducer(state, { type: 'memory', index });
    state = next(state);
    expect(next(state).step).toBe(2);
    state = proposalReducer(state, { type: 'letter' });
    state = next(state);
    expect(state.step).toBe(3);
    expect(next(state).step).toBe(3);
    state = proposalReducer(state, { type: 'ring' });
    state = next(state);
    expect(state.step).toBe(4);
    for (const answer of ['yes', 'time', 'no'] as const) {
      const answered = proposalReducer(state, { type: 'answer', answer });
      expect(answered.answer).toBe(answer);
      expect(answered.step).toBe(4);
      expect(next(answered).step).toBe(4);
      expect(proposalReducer(answered, { type: 'answer', answer: null }).answer).toBeNull();
    }
  });

  it('ignore les découvertes invalides et les actions hors de leur scène', () => {
    expect(proposalReducer(initialProposalState, { type: 'memory', index: 0 })).toBe(initialProposalState);
    expect(proposalReducer(initialProposalState, { type: 'answer', answer: 'yes' })).toBe(initialProposalState);
    expect(proposalReducer(initialProposalState, { type: 'ring' })).toBe(initialProposalState);
    const playing = next(initialProposalState);
    for (const index of [-1, 3, .5, NaN]) expect(proposalReducer(playing, { type: 'memory', index })).toBe(playing);
  });

  it('rejoue sans conserver les souvenirs ni la réponse précédente', () => {
    const played: ProposalState = { step: 4, memories: [0, 1, 2], selectedMemory: 2, ringOpen: true, letterOpen: true, answer: 'no' };
    expect(proposalReducer(played, { type: 'replay' })).toEqual(initialProposalState);
    expect(initialProposalState.memories).toEqual([]);
  });
});
