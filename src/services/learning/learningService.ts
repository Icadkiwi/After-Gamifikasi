import type { LearningDomainServices, LearningRecommendation } from './contracts.ts'
import { createLearnerProfileService } from '../learnerProfile/learnerProfileService.ts'
import type { Answer, AssessmentDefinition } from '../../learning/assessment/types.ts'
import type { LearningChallenge } from '../../learning/challenges/types.ts'
import type { LearningModule } from '../../learning/modules/types.ts'
import type { LearningEvent, UserLearningProfile } from '../../learning/progress/types.ts'
import type { LearningRepository } from '../persistence/learningRepository.ts'

export type LearningCatalog = { modules: LearningModule[]; challenges: LearningChallenge[]; assessments: AssessmentDefinition[] }
export type LearningIntegration = { onProgress(profile: UserLearningProfile, events: LearningEvent[]): void; getCityLevel(userId: string): number }

// Application boundary: deterministic services exchange evidence; React never grades answers.
export function createLearningService(repository: LearningRepository, services: LearningDomainServices, catalog: LearningCatalog, integration: LearningIntegration) {
  const profiles = createLearnerProfileService(repository, catalog.modules)
  function requireModule(profile: UserLearningProfile, moduleId: string) {
    const module = catalog.modules.find((item) => item.id === moduleId)
    if (!module) throw new Error('Materi tidak ditemukan.')
    if (!profile.lastAssessmentId) throw new Error('Selesaikan asesmen awal terlebih dahulu.')
    if (!module.prerequisiteModuleIds.every((id) => profile.completedModules.includes(id))) throw new Error('Selesaikan materi prasyarat terlebih dahulu.')
    return module
  }
  function definition(id: string) {
    const result = catalog.assessments.find((item) => item.id === id)
    if (!result) throw new Error('Asesmen tidak ditemukan.')
    return result
  }
  function persist(profile: UserLearningProfile, events: LearningEvent[]) {
    repository.save(profile)
    integration.onProgress(profile, events)
    return profile
  }
  const event = (userId: string, type: LearningEvent['type'], entityId: string, competencyIds: string[], occurredAt: string, amount = 1): LearningEvent => ({ id: `${type}:${entityId}`, userId, type, entityId, competencyIds, occurredAt, amount })
  function requirePractice(profile: UserLearningProfile, challengeId: string, purpose: 'practice' | 'reassessment') {
    const challenge = catalog.challenges.find((item) => item.id === challengeId)
    if (!challenge) throw new Error('Tantangan tidak ditemukan.')
    const module = requireModule(profile, challenge.moduleId)
    if (!profile.readModules.includes(module.id)) throw new Error('Baca materi sebelum mencoba tantangan.')
    if (integration.getCityLevel(profile.userId) < (challenge.requiredCityLevel ?? 1)) throw new Error(`Tantangan memerlukan kota level ${challenge.requiredCityLevel}.`)
    if (purpose === 'reassessment') {
      const lastPractice = profile.practiceResults.filter((item) => item.challengeId === challengeId && item.evaluation.purpose === 'practice').at(-1)
      if (!lastPractice?.passed) throw new Error('Lulus latihan skenario sebelum asesmen ulang.')
    }
    return { challenge, module, assessment: definition(purpose === 'practice' ? challenge.practiceAssessmentId : challenge.reassessmentId) }
  }
  // Tools may show questions, but receive neither answer keys nor pre-answer feedback.
  function publicAssessment(assessment: AssessmentDefinition) {
    return { ...assessment, questions: assessment.questions.map((question) => ({ id: question.id, competencyId: question.competencyId, prompt: question.prompt, options: question.options })) }
  }
  return {
    getProfile: profiles.getLearnerProfile,
    getCompetencyScores: profiles.getCompetencyScores,
    getLearningHistory: profiles.getLearningHistory,
    getCurrentLearningPath: profiles.getCurrentLearningPath,
    getModule: (userId: string, moduleId: string) => requireModule(repository.load(userId), moduleId),
    startAssessment(userId: string, assessmentId: string) {
      const profile = repository.load(userId)
      if (profile.lastAssessmentId) throw new Error('Asesmen awal sudah selesai. Gunakan asesmen ulang pada tantangan.')
      const assessment = definition(assessmentId)
      if (assessment.purpose !== 'initial') throw new Error('Gunakan asesmen awal yang sesuai.')
      return publicAssessment(assessment)
    },
    startPractice(userId: string, challengeId: string, purpose: 'practice' | 'reassessment') {
      return publicAssessment(requirePractice(repository.load(userId), challengeId, purpose).assessment)
    },
    reconcile(userId: string) { integration.onProgress(repository.load(userId), []) },
    recommend(userId: string): LearningRecommendation { return services.recommendation.recommend(repository.load(userId), catalog.modules) },
    assess(userId: string, assessmentId: string, answers: Answer[], requestId: string, now = new Date().toISOString()) {
      const profile = repository.load(userId)
      const existing = profile.assessmentResults.find((result) => result.id === requestId)
      if (existing) {
        if (existing.userId !== userId || existing.assessmentId !== assessmentId || existing.purpose !== 'initial') throw new Error('ID request sudah dipakai untuk asesmen lain.')
        return existing
      }
      if (profile.lastAssessmentId) throw new Error('Asesmen awal sudah selesai. Gunakan asesmen ulang pada tantangan.')
      const assessment = definition(assessmentId)
      if (assessment.purpose !== 'initial') throw new Error('Gunakan asesmen awal yang sesuai.')
      const result = services.assessment.evaluate({ context: { requestId, userId, now }, assessment, answers })
      const next = profiles.updateCompetencyProfile(profile, result)
      next.history = [...next.history, { id: requestId, kind: 'assessment', title: assessment.title, occurredAt: now, score: result.score }]
      persist(next, result.evidence.map((item) => event(userId, 'QuestionsEvaluated', item.questionId, [item.competencyId], now)))
      return result
    },
    readModule(userId: string, moduleId: string, now = new Date().toISOString()) {
      const profile = repository.load(userId)
      const module = requireModule(profile, moduleId)
      if (profile.readModules.includes(moduleId)) return profile
      return persist(profiles.updateLearningProgress(profile, module, now), [])
    },
    practice(userId: string, challengeId: string, purpose: 'practice' | 'reassessment', answers: Answer[], requestId: string, now = new Date().toISOString()) {
      const profile = repository.load(userId)
      const existing = profile.practiceResults.find((result) => result.id === requestId)
      if (existing) {
        if (existing.evaluation.userId !== userId || existing.challengeId !== challengeId || existing.evaluation.purpose !== purpose) throw new Error('ID request sudah dipakai untuk tantangan lain.')
        return existing
      }
      const { challenge, module, assessment } = requirePractice(profile, challengeId, purpose)
      const result = services.practice.evaluate({ context: { requestId, userId, now }, assessment, answers }, challenge)
      let next = { ...profile, practiceResults: [...profile.practiceResults, result], updatedAt: now }
      const events = result.evaluation.evidence.map((item) => event(userId, 'QuestionsEvaluated', item.questionId, [item.competencyId], now))
      if (purpose === 'reassessment') {
        next = profiles.updateCompetencyProfile(next, result.evaluation)
        for (const competencyId of module.competencyIds) {
          if ((next.competencies[competencyId]?.score ?? 0) > (profile.competencies[competencyId]?.score ?? 0)) events.push(event(userId, 'CompetencyImproved', requestId + ':' + competencyId, [competencyId], now))
        }
        if (result.passed) {
          next.completedModules = [...new Set([...next.completedModules, module.id])]
          next.completedChallenges = [...new Set([...next.completedChallenges, challenge.id])]
          events.push(event(userId, 'LessonCompleted', module.id, module.competencyIds, now), event(userId, 'LearningChallengeCompleted', challenge.id, module.competencyIds, now))
        }
      }
      next.history = [...next.history, { id: requestId, kind: purpose, title: assessment.title, occurredAt: now, score: result.evaluation.score }]
      persist(next, events)
      return result
    },
  }
}

export type LearningService = ReturnType<typeof createLearningService>
