import type { UserLearningProfile } from '../../learning/progress/types.ts'

export const learningCityUnlocks = [
  { shopKey: 'coffee_shop', challengeId: 'budget-challenge', label: 'Selesaikan Tantangan Anggaran' },
  { shopKey: 'building_xl_white', challengeId: 'safety-challenge', label: 'Selesaikan Tantangan Keamanan Digital' },
]
export function getLearningUnlockRequirement(shopKey: string, profile: Pick<UserLearningProfile, 'completedChallenges'>) {
  const rule = learningCityUnlocks.find((item) => item.shopKey === shopKey)
  return rule && !profile.completedChallenges.includes(rule.challengeId) ? rule.label : null
}
