import type { LearningCatalog } from '../../services/learning/learningService.ts'
import type { LearningRepository } from '../../services/persistence/learningRepository.ts'
import type { GameReward } from './types.ts'

export type RewardEligibility = {
  eligible: boolean
  reason: 'eligible' | 'unknown-challenge' | 'unconfigured-reward' | 'not-completed' | 'missing-evidence' | 'already-granted'
}
export type LearningRewardWallet = {
  hasReceipt(userId: string, receiptId: string): boolean
  grant(userId: string, receiptId: string, rewards: GameReward[]): { granted: boolean }
}

export function createLearningRewardService(repository: LearningRepository, catalog: LearningCatalog, rewards: Record<string, GameReward[]>, wallet: LearningRewardWallet) {
  function checkRewardEligibility(userId: string, challengeId: string): RewardEligibility {
    const challenge = catalog.challenges.find((item) => item.id === challengeId)
    if (!challenge) return { eligible: false, reason: 'unknown-challenge' }
    const configured = rewards[challengeId]
    if (!configured?.length || configured.some((reward) => !Number.isFinite(reward.amount) || reward.amount < 0)) return { eligible: false, reason: 'unconfigured-reward' }
    const profile = repository.load(userId)
    if (!profile.completedChallenges.includes(challengeId) || !profile.completedModules.includes(challenge.moduleId)) return { eligible: false, reason: 'not-completed' }
    const reassessment = catalog.assessments.find((item) => item.id === challenge.reassessmentId)
    const evidence = profile.practiceResults.find((result) =>
      result.challengeId === challengeId && result.passed &&
      result.evaluation.userId === userId && result.evaluation.purpose === 'reassessment' &&
      result.evaluation.assessmentId === challenge.reassessmentId &&
      result.evaluation.assessmentVersion === reassessment?.version &&
      result.evaluation.score >= challenge.passingScore &&
      profile.assessmentResults.some((item) => item.id === result.evaluation.id && item.userId === userId && item.purpose === 'reassessment' && item.score === result.evaluation.score),
    )
    if (!evidence) return { eligible: false, reason: 'missing-evidence' }
    if (wallet.hasReceipt(userId, `challenge:${challengeId}`)) return { eligible: false, reason: 'already-granted' }
    return { eligible: true, reason: 'eligible' }
  }
  return {
    checkRewardEligibility,
    grantLearningReward(userId: string, challengeId: string) {
      // Eligibility is checked again on every grant; a previous check is not permission.
      const eligibility = checkRewardEligibility(userId, challengeId)
      if (!eligibility.eligible) return { granted: false, eligibility }
      const result = wallet.grant(userId, `challenge:${challengeId}`, rewards[challengeId])
      return { granted: result.granted, eligibility }
    },
  }
}
export type LearningRewardService = ReturnType<typeof createLearningRewardService>
