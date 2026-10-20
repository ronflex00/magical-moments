export type ProposalStep = 0 | 1 | 2 | 3 | 4;
export type ProposalAnswer = 'yes' | 'time' | 'no' | null;
export interface ProposalState {
  step: ProposalStep;
  memories: number[];
  selectedMemory: number | null;
  letterOpen: boolean;
  ringOpen: boolean;
  answer: ProposalAnswer;
}
export const initialProposalState: ProposalState = {
  step: 0, memories: [], selectedMemory: null, letterOpen: false, ringOpen: false, answer: null,
};
export type ProposalAction =
  | { type: 'next' }
  | { type: 'memory'; index: number }
  | { type: 'letter' }
  | { type: 'ring' }
  | { type: 'answer'; answer: ProposalAnswer }
  | { type: 'replay' };

export function proposalReducer(state: ProposalState, action: ProposalAction): ProposalState {
  switch (action.type) {
    case 'next': {
      const unlocked = state.step === 0 || (state.step === 1 && state.memories.length === 3)
        || (state.step === 2 && state.letterOpen) || (state.step === 3 && state.ringOpen);
      return unlocked && state.step < 4 ? { ...state, step: (state.step + 1) as ProposalStep } : state;
    }
    case 'memory':
      if (state.step !== 1 || !Number.isInteger(action.index) || action.index < 0 || action.index > 2) return state;
      return {
        ...state, selectedMemory: action.index,
        memories: state.memories.includes(action.index) ? state.memories : [...state.memories, action.index],
      };
    case 'letter': return state.step === 2 ? { ...state, letterOpen: true } : state;
    case 'ring': return state.step === 3 ? { ...state, ringOpen: true } : state;
    case 'answer': return state.step === 4 ? { ...state, answer: action.answer } : state;
    case 'replay': return { ...initialProposalState, memories: [] };
  }
}
