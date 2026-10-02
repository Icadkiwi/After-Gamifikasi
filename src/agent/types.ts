import type { Answer, AssessmentResult } from '../learning/assessment/types.ts'
import type { PracticeResult } from '../learning/challenges/types.ts'
import type { LearningModule } from '../learning/modules/types.ts'
import type { LearningHistoryEntry, MasteryRecord } from '../learning/progress/types.ts'
import type { LearningService } from '../services/learning/learningService.ts'
import type { LearningRecommendation } from '../services/learning/contracts.ts'
import type { KnowledgeQuery, KnowledgeRetrievalResult } from '../services/knowledge/knowledgeRetrievalService.ts'
import type { LearningRewardService, RewardEligibility } from '../gamification/rewards/learningRewardService.ts'

export type LearnerContext = {
  overallScore: number | null
  competencies: Record<string, MasteryRecord>
  readModules: string[]
  completedModules: string[]
  completedChallenges: string[]
  history: LearningHistoryEntry[]
  learningPath: ReturnType<LearningService['getCurrentLearningPath']>
  cityLevel: number
}

// Supplied by the authenticated application, never by model tool arguments.
export type LearnerSubmission = { id: string; userId: string; assessmentId: string; answers: Answer[] }
export type PracticeInput = { challengeId: string; purpose: 'practice' | 'reassessment' }
export type ToolInputs = {
  getLearnerProfile: Record<string, never>
  getLearningRecommendation: Record<string, never>
  getLearningModule: { moduleId: string }
  startAssessment: { assessmentId: string }
  scoreAssessment: { submissionId: string }
  markModuleRead: { moduleId: string }
  startPractice: PracticeInput
  evaluatePractice: PracticeInput & { submissionId: string }
  retrieveKnowledge: KnowledgeQuery
  checkRewardEligibility: { challengeId: string }
  grantLearningReward: { challengeId: string }
}
export type ToolOutputs = {
  getLearnerProfile: LearnerContext
  getLearningRecommendation: LearningRecommendation
  getLearningModule: LearningModule
  startAssessment: ReturnType<LearningService['startAssessment']>
  scoreAssessment: AssessmentResult
  markModuleRead: { readModules: string[] }
  startPractice: ReturnType<LearningService['startPractice']>
  evaluatePractice: PracticeResult
  retrieveKnowledge: KnowledgeRetrievalResult
  checkRewardEligibility: RewardEligibility
  grantLearningReward: ReturnType<LearningRewardService['grantLearningReward']>
}
export type ToolName = keyof ToolInputs
export type AgentError = { code: string; message: string }
export type AgentToolResult<N extends ToolName = ToolName> =
  | { ok: true; tool: N; output: ToolOutputs[N] }
  | { ok: false; error: AgentError }
export type ToolInputSchema = {
  type: 'object'
  properties: Record<string, { type: 'string'; enum?: readonly string[]; maxLength?: number }>
  required: readonly string[]
  additionalProperties: false
}
export type AgentToolSpecification = {
  name: ToolName
  description: string
  inputSchema: ToolInputSchema
  mutates: boolean
}
export type ToolAction = { [N in ToolName]: { type: 'call-tool'; tool: N; input: ToolInputs[N] } }[ToolName]
export type AgentAction = ToolAction | { type: 'complete' | 'await-input'; message: string }
export type AgentObservation = { step: number; tool: string; result: AgentToolResult }
export type AgentStatus = 'running' | 'completed' | 'awaiting-input' | 'step-limit' | 'failed' | 'cancelled' | 'not-configured'
export type AgentState = {
  goal: string
  status: AgentStatus
  steps: number
  learner: LearnerContext | null
  observations: AgentObservation[]
  message?: string
  error?: AgentError
}
export type AgentDecisionContext = {
  goal: string
  learner: LearnerContext
  step: number
  availableTools: AgentToolSpecification[]
  observations: AgentObservation[]
}
