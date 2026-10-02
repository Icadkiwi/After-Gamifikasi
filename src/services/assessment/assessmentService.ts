import type { AssessmentService, AssessmentRequest } from '../learning/contracts.ts'
import type { AssessmentResult } from '../../learning/assessment/types.ts'

export function evaluateStructuredAssessment({ context, assessment, answers }: AssessmentRequest): AssessmentResult {
  if (!context.userId || !context.requestId || !assessment.questions.length) throw new Error('Asesmen tidak valid.')
  if (new Set(assessment.questions.map((question) => question.id)).size !== assessment.questions.length) throw new Error('ID soal harus unik.')
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.optionId]))
  if (answerMap.size !== answers.length || answers.length !== assessment.questions.length) throw new Error('Jawab setiap soal tepat satu kali.')
  const totals: Record<string, { earned: number; possible: number }> = {}
  const evidence = assessment.questions.map((question) => {
    const selectedOptionId = answerMap.get(question.id)
    if (!selectedOptionId || !question.options.some((option) => option.id === selectedOptionId)) throw new Error('Pilihan jawaban tidak valid.')
    if (!Number.isFinite(question.weight) || question.weight <= 0) throw new Error('Bobot soal tidak valid.')
    if (!question.options.some((option) => option.id === question.correctOptionId)) throw new Error('Kunci soal tidak valid.')
    const correct = selectedOptionId === question.correctOptionId
    const earnedPoints = correct ? question.weight : 0
    const total = totals[question.competencyId] ?? { earned: 0, possible: 0 }
    totals[question.competencyId] = { earned: total.earned + earnedPoints, possible: total.possible + question.weight }
    return { questionId: question.id, competencyId: question.competencyId, selectedOptionId, correct, earnedPoints, possiblePoints: question.weight, feedback: question.explanation, sourceIds: question.sourceIds }
  })
  const possible = evidence.reduce((sum, item) => sum + item.possiblePoints, 0)
  return {
    id: context.requestId, userId: context.userId, assessmentId: assessment.id, assessmentVersion: assessment.version,
    purpose: assessment.purpose, score: Math.round(evidence.reduce((sum, item) => sum + item.earnedPoints, 0) / possible * 100),
    competencyScores: Object.fromEntries(Object.entries(totals).map(([id, total]) => [id, Math.round(total.earned / total.possible * 100)])),
    evidence, completedAt: context.now, evaluator: 'rules-demo',
  }
}

export const assessmentService: AssessmentService = {
  evaluate: evaluateStructuredAssessment,
}
