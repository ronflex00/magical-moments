export type ProposalStep = 0 | 1 | 2 | 3 | 4 | 5;
export type ProposalAnswer = 'yes' | 'time' | 'no' | null;
export interface ProposalState {
  step: ProposalStep;
  memories: number[];
  selectedMemory: number | null;
  constellation: number[];
  sealBroken: boolean;
  letterOpen: boolean;
  ringOpen: boolean;
  answer: ProposalAnswer;
}
export const initialProposalState: ProposalState = {
  step: 0, memories: [], selectedMemory: null, constellation: [], sealBroken: false, letterOpen: false, ringOpen: false, answer: null,
};
export type ProposalAction =
  | { type: 'next' }
  | { type: 'memory'; index: number }
  | { type: 'connect'; index: number }
  | { type: 'seal' }
  | { type: 'back' }
  | { type: 'letter' }
  | { type: 'ring' }
  | { type: 'answer'; answer: ProposalAnswer }
  | { type: 'replay' };

export function proposalReducer(state: ProposalState, action: ProposalAction): ProposalState {
  switch (action.type) {
    case 'next': {
      const unlocked = state.step === 0 || (state.step === 1 && state.memories.length === 3)
        || (state.step === 2 && state.constellation.length === 5)
        || (state.step === 3 && state.letterOpen) || (state.step === 4 && state.ringOpen);
      return unlocked && state.step < 5 ? { ...state, step: (state.step + 1) as ProposalStep } : state;
    }
    case 'memory':
      if (state.step !== 1 || !Number.isInteger(action.index) || action.index < 0 || action.index > 2) return state;
      return {
        ...state, selectedMemory: action.index,
        memories: state.memories.includes(action.index) ? state.memories : [...state.memories, action.index],
      };
    case 'connect': return state.step === 2 && action.index === state.constellation.length && action.index < 5 ? { ...state, constellation: [...state.constellation, action.index] } : state;
    case 'seal': return state.step === 3 ? { ...state, sealBroken: true } : state;
    case 'letter': return state.step === 3 && state.sealBroken ? { ...state, letterOpen: true } : state;
    case 'ring': return state.step === 4 ? { ...state, ringOpen: true } : state;
    case 'answer': return state.step === 5 ? { ...state, answer: action.answer } : state;
    case 'back': return state.step > 0 ? { ...state, step: (state.step - 1) as ProposalStep } : state;
    case 'replay': return { ...initialProposalState, memories: [], constellation: [] };
  }
}
