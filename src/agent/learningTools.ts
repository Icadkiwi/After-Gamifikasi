import type { LearningService } from '../services/learning/learningService.ts'
import type { KnowledgeRetrievalService } from '../services/knowledge/knowledgeRetrievalService.ts'
import type { LearningRewardService } from '../gamification/rewards/learningRewardService.ts'
import { AgentToolRegistry } from './toolRegistry.ts'
import type { AgentToolSpecification, LearnerContext, LearnerSubmission, ToolInputSchema, ToolName } from './types.ts'

export type LearningToolServices = {
  learning: LearningService
  rewards: LearningRewardService
  knowledge: KnowledgeRetrievalService
  getCityLevel(userId: string): number
}

const string = { type: 'string' as const }
const purpose = { type: 'string' as const, enum: ['practice', 'reassessment'] }
function spec<N extends ToolName>(name: N, description: string, properties: ToolInputSchema['properties'] = {}, mutates = false, required = Object.keys(properties)): AgentToolSpecification & { name: N } {
  return { name, description, mutates, inputSchema: { type: 'object', properties, required, additionalProperties: false } }
}

// The application binds identity and learner submissions before a model can select tools.
// This is an adapter, not an authentication boundary. Future server code must verify UID.
export function createLearningToolRegistry(services: LearningToolServices, userId: string, learnerSubmissions: LearnerSubmission[] = []) {
  if (!userId.trim()) throw new Error('Identitas pengguna diperlukan.')
  const submissions = new Map<string, LearnerSubmission>()
  for (const submission of learnerSubmissions) {
    if (submission.userId !== userId || !submission.id.trim() || submissions.has(submission.id)) throw new Error('Pemilik atau ID submission tidak valid.')
    submissions.set(submission.id, structuredClone(submission))
  }
  const getSubmission = (id: string) => {
    const submission = submissions.get(id)
    if (!submission) throw new Error('Jawaban dari pengguna belum tersedia.')
    return submission
  }
  const observe = (): LearnerContext => {
    const profile = services.learning.getProfile(userId)
    return {
      overallScore: profile.overallScore, competencies: profile.competencies,
      readModules: profile.readModules, completedModules: profile.completedModules,
      completedChallenges: profile.completedChallenges,
      history: profile.history.slice(-20), learningPath: services.learning.getCurrentLearningPath(userId),
      cityLevel: services.getCityLevel(userId),
    }
  }
  const registry = new AgentToolRegistry(observe)
  registry.register(spec('getLearnerProfile', 'Read measured competencies, progress, the last 20 history entries and city level.'), observe)
  registry.register(spec('getLearningRecommendation', 'Recommend the next available module using deterministic rules.'), () => services.learning.recommend(userId))
  registry.register(spec('getLearningModule', 'Read a module after the learning prerequisites are satisfied.', { moduleId: string }), ({ moduleId }) => services.learning.getModule(userId, moduleId))
  registry.register(spec('startAssessment', 'Get initial assessment questions without answer keys.', { assessmentId: string }), ({ assessmentId }) => services.learning.startAssessment(userId, assessmentId))
  registry.register(spec('scoreAssessment', 'Score an existing learner submission; the model cannot supply answers or scores.', { submissionId: string }, true), ({ submissionId }) => {
    const submission = getSubmission(submissionId)
    return services.learning.assess(userId, submission.assessmentId, submission.answers, submission.id)
  })
  registry.register(spec('markModuleRead', 'Record reading progress. Does not award mastery or completion.', { moduleId: string }, true), ({ moduleId }) => ({ readModules: services.learning.readModule(userId, moduleId).readModules }))
  registry.register(spec('startPractice', 'Get practice or reassessment questions after all learning and city gates pass.', { challengeId: string, purpose }), ({ challengeId, purpose }) => services.learning.startPractice(userId, challengeId, purpose))
  registry.register(spec('evaluatePractice', 'Evaluate an existing learner submission through the practice/reassessment workflow.', { challengeId: string, purpose, submissionId: string }, true), ({ challengeId, purpose, submissionId }) => {
    const submission = getSubmission(submissionId)
    // On retries, the workflow checks identity/purpose and returns the saved result.
    const profile = services.learning.getProfile(userId)
    const existing = profile.practiceResults.find((result) => result.id === submission.id)
    const assessmentId = existing?.evaluation.assessmentId ?? services.learning.startPractice(userId, challengeId, purpose).id
    if (submission.assessmentId !== assessmentId) throw new Error('Submission tidak sesuai asesmen.')
    return services.learning.practice(userId, challengeId, purpose, submission.answers, submission.id)
  })
  registry.register(spec('retrieveKnowledge', 'Retrieve verified local passages. Empty results are explicit; semantic RAG is not implemented.', { competencyId: string, topic: { ...string, maxLength: 500 }, difficulty: { ...string, enum: ['foundation', 'developing', 'proficient'] } }, false, ['competencyId', 'topic']), (query) => services.knowledge.retrieveKnowledge(query))
  registry.register(spec('checkRewardEligibility', 'Check saved completion evidence and the existing reward receipt.', { challengeId: string }), ({ challengeId }) => services.rewards.checkRewardEligibility(userId, challengeId))
  registry.register(spec('grantLearningReward', 'Grant only configured, eligible, unclaimed challenge rewards within capacity rules.', { challengeId: string }, true), ({ challengeId }) => services.rewards.grantLearningReward(userId, challengeId))
  return registry
}
