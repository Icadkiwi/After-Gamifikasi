import type { AssessmentResult } from '../assessment/types.ts'
import type { PracticeResult } from '../challenges/types.ts'
import type { MasteryLevel } from '../competencies/competencies.ts'

export type MasteryRecord = {
  competencyId: string
  score: number | null
  masteryLevel: MasteryLevel
  evidenceIds: string[]
  updatedAt: string | null
}

export type LearningHistoryEntry = {
  id: string
  kind: 'assessment' | 'module-read' | 'practice' | 'reassessment'
  title: string
  occurredAt: string
  score?: number
}

export type UserLearningProfile = {
  schemaVersion: 1
  userId: string
  overallScore: number | null
  competencies: Record<string, MasteryRecord>
  readModules: string[]
  completedModules: string[]
  completedChallenges: string[]
  assessmentResults: AssessmentResult[]
  practiceResults: PracticeResult[]
  lastAssessmentId: string | null
  history: LearningHistoryEntry[]
  updatedAt: string
}

export type LearningProgress = {
  completedLessons: number
  completedChallenges: number
  assessedCompetencies: number
  masteredCompetencies: number
}

export type LearningEvent = {
  id: string
  userId: string
  type: 'LessonCompleted' | 'LearningChallengeCompleted' | 'QuestionsEvaluated' | 'CompetencyImproved'
  entityId: string
  competencyIds: string[]
  amount: number
  occurredAt: string
}
