export type AssessmentQuestion = {
  id: string
  competencyId: string
  prompt: string
  options: { id: string; label: string }[]
  correctOptionId: string
  explanation: string
  weight: number
  sourceIds: string[]
}

export type AssessmentDefinition = {
  id: string
  version: number
  title: string
  purpose: 'initial' | 'practice' | 'reassessment'
  questions: AssessmentQuestion[]
  contentStatus: 'demo' | 'reviewed'
}

export type Answer = { questionId: string; optionId: string }
export type ScoringEvidence = {
  questionId: string
  competencyId: string
  selectedOptionId: string
  correct: boolean
  earnedPoints: number
  possiblePoints: number
  feedback: string
  sourceIds: string[]
}

export type AssessmentResult = {
  id: string
  userId: string
  assessmentId: string
  assessmentVersion: number
  purpose: AssessmentDefinition['purpose']
  score: number
  competencyScores: Record<string, number>
  evidence: ScoringEvidence[]
  completedAt: string
  evaluator: 'rules-demo'
}
