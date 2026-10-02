import { assessmentService } from '../assessment/assessmentService.ts'
import { learningRecommendationService } from '../recommendation/learningRecommendationService.ts'
import { practiceService } from '../practice/practiceService.ts'
import { syncLearningAchievementProgress } from '../../gamification/achievements/achievementService'
import { getUserStats, grantLearningCompletionReward, recordLearningMissionEvent } from '../../gamification/rewards/gamificationService'
import { createLearningRewardService } from '../../gamification/rewards/learningRewardService.ts'
import { challengeRewards } from '../../gamification/rewards/learningRewards.ts'
import { syncStreakFromLearningProfile } from '../../gamification/streak/streakService'
import type { LearningMissionAction } from '../../gamification/missions/missionConfig.ts'
import { getStoredCityProgress } from '../../game/cityProgress'
import { assessments, learningChallenges, learningModules } from '../../learning/modules/catalog.ts'
import type { LearningEvent } from '../../learning/progress/types.ts'
import { LocalLearningRepository } from '../persistence/learningRepository.ts'
import { createLearningService } from './learningService.ts'

const actions: Record<LearningEvent['type'], LearningMissionAction> = {
  LessonCompleted: 'completeLesson', LearningChallengeCompleted: 'completeChallenge', QuestionsEvaluated: 'answerQuestion', CompetencyImproved: 'improveCompetency',
}
const repository = new LocalLearningRepository()
const catalog = { modules: learningModules, challenges: learningChallenges, assessments }
export const learningRewardService = createLearningRewardService(repository, catalog, challengeRewards, {
  hasReceipt: (uid, receiptId) => getUserStats(uid).learningRewardReceipts.includes(receiptId),
  grant: grantLearningCompletionReward,
})
export const learningService = createLearningService(
  repository,
  { assessment: assessmentService, recommendation: learningRecommendationService, practice: practiceService },
  catalog,
  {
    getCityLevel: (uid) => getStoredCityProgress(uid).cityLevel,
    onProgress(profile, events) {
      for (const event of events) recordLearningMissionEvent(profile.userId, actions[event.type], event.id, event.amount, event.competencyIds)
      // Reconcile receipts from saved completion state, so reload/retry can recover a missed delivery.
      for (const challengeId of profile.completedChallenges) learningRewardService.grantLearningReward(profile.userId, challengeId)
      // CD8: one streak day per local day with validated learning progress.
      // Deterministic: derives from profile.updatedAt, idempotent within the day.
      syncStreakFromLearningProfile(profile.userId, profile)
      syncLearningAchievementProgress(profile.userId, profile)
    },
  },
)
