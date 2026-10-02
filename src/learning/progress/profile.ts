import { competencies } from '../competencies/competencies.ts'
import type { LearningProgress, UserLearningProfile } from './types.ts'

export function createLearningProfile(userId: string, now = new Date().toISOString()): UserLearningProfile {
  if (!userId.trim()) throw new Error('Pengguna diperlukan.')
  return {
    schemaVersion: 1, userId, overallScore: null,
    competencies: Object.fromEntries(competencies.map(({ id }) => [id, { competencyId: id, score: null, masteryLevel: 'unassessed', evidenceIds: [], updatedAt: null }])),
    readModules: [], completedModules: [], completedChallenges: [], assessmentResults: [], practiceResults: [], lastAssessmentId: null, history: [], updatedAt: now,
  }
}

export function summarizeLearning(profile: UserLearningProfile): LearningProgress {
  const records = Object.values(profile.competencies)
  return { completedLessons: profile.completedModules.length, completedChallenges: profile.completedChallenges.length, assessedCompetencies: records.filter((record) => record.score !== null).length, masteredCompetencies: records.filter((record) => record.masteryLevel === 'proficient').length }
}
