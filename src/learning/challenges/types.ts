import type { AssessmentResult } from '../assessment/types.ts'

export type LearningChallenge = {
  id: string
  moduleId: string
  title: string
  scenario: string
  practiceAssessmentId: string
  reassessmentId: string
  passingScore: number
  requiredCityLevel?: number
}

export type PracticeResult = {
  id: string
  challengeId: string
  evaluation: AssessmentResult
  passed: boolean
}
