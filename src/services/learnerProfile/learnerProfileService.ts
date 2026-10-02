import { competencies, getMasteryLevel } from '../../learning/competencies/competencies.ts'
import type { AssessmentResult } from '../../learning/assessment/types.ts'
import type { UserLearningProfile } from '../../learning/progress/types.ts'
import type { LearningModule } from '../../learning/modules/types.ts'
import type { LearningRepository } from '../persistence/learningRepository.ts'

// Pure transformation of validated scoring evidence. Persistence stays in the workflow.
export function updateCompetencyProfile(profile: UserLearningProfile, result: AssessmentResult): UserLearningProfile {
  if (profile.userId !== result.userId) throw new Error('Profil dan hasil asesmen berbeda pengguna.')
  if (result.purpose === 'practice') throw new Error('Gunakan hasil asesmen ulang untuk memperbarui penguasaan.')
  if (profile.assessmentResults.some((item) => item.id === result.id)) return profile
  const nextCompetencies = { ...profile.competencies }
  for (const [id, score] of Object.entries(result.competencyScores)) {
    const definition = competencies.find((item) => item.id === id)
    if (!definition || !Number.isFinite(score) || score < 0 || score > 100) throw new Error('Kompetensi atau skor tidak valid.')
    const previous = nextCompetencies[id]
    nextCompetencies[id] = { competencyId: id, score, masteryLevel: getMasteryLevel(score, definition.masteryThreshold), evidenceIds: [...(previous?.evidenceIds ?? []), result.id], updatedAt: result.completedAt }
  }
  const measured = Object.values(nextCompetencies).filter((item) => item.score !== null)
  return { ...profile, competencies: nextCompetencies, overallScore: measured.length ? Math.round(measured.reduce((sum, item) => sum + (item.score ?? 0), 0) / measured.length) : null, assessmentResults: [...profile.assessmentResults, result], lastAssessmentId: result.id, updatedAt: result.completedAt }
}

export function createLearnerProfileService(repository: LearningRepository, modules: LearningModule[]) {
  return {
    getLearnerProfile: (userId: string) => repository.load(userId),
    getCompetencyScores: (userId: string) => repository.load(userId).competencies,
    getLearningHistory: (userId: string) => repository.load(userId).history,
    getCurrentLearningPath(userId: string) {
      const profile = repository.load(userId)
      return modules.map((module) => ({
        moduleId: module.id,
        completed: profile.completedModules.includes(module.id),
        read: profile.readModules.includes(module.id),
        available: Boolean(profile.lastAssessmentId) && module.prerequisiteModuleIds.every((id) => profile.completedModules.includes(id)),
      }))
    },
    updateCompetencyProfile,
    // Reading is progress only; completion/mastery require the assessment workflow.
    updateLearningProgress(profile: UserLearningProfile, module: LearningModule, now: string): UserLearningProfile {
      if (!profile.lastAssessmentId || !module.prerequisiteModuleIds.every((id) => profile.completedModules.includes(id))) throw new Error('Prasyarat materi belum terpenuhi.')
      if (profile.readModules.includes(module.id)) return profile
      return { ...profile, readModules: [...profile.readModules, module.id], updatedAt: now, history: [...profile.history, { id: `read:${module.id}`, kind: 'module-read', title: module.title, occurredAt: now }] }
    },
  }
}
export type LearnerProfileService = ReturnType<typeof createLearnerProfileService>
