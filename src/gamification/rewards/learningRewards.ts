import type { GameReward } from './types.ts'

// One-time completion grants are separate from the daily mission bonus budget.
export const challengeRewards: Record<string, GameReward[]> = {
  'budget-challenge': [{ type: 'exp', amount: 100 }, { type: 'coin', amount: 800 }, { type: 'diamond', amount: 10 }],
  'safety-challenge': [{ type: 'exp', amount: 150 }, { type: 'coin', amount: 1000 }, { type: 'diamond', amount: 20 }],
}
