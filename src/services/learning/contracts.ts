import type { Answer, AssessmentDefinition, AssessmentResult } from '../../learning/assessment/types.ts'
import type { LearningChallenge, PracticeResult } from '../../learning/challenges/types.ts'
import type { LearningModule } from '../../learning/modules/types.ts'
import type { UserLearningProfile } from '../../learning/progress/types.ts'

export type LearningOperationContext = { requestId: string; userId: string; now: string }
export type AssessmentRequest = { context: LearningOperationContext; assessment: AssessmentDefinition; answers: Answer[] }
export type LearningRecommendation = {
  moduleId: string | null
  reason: string
  explanation: string
  competencyIds: string[]
  sourceIds: string[]
  mode: 'rules-demo' | 'retrieval'
}
export interface AssessmentService {
  evaluate(request: AssessmentRequest): AssessmentResult
}
export interface LearningRecommendationService {
  recommend(profile: UserLearningProfile, modules: LearningModule[]): LearningRecommendation
}
export interface PracticeService {
  evaluate(request: AssessmentRequest, challenge: LearningChallenge): PracticeResult
}
export type LearningDomainServices = { assessment: AssessmentService; recommendation: LearningRecommendationService; practice: PracticeService }
