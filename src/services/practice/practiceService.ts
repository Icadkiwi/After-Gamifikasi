import type { PracticeService } from '../learning/contracts.ts'
import { evaluateStructuredAssessment } from '../assessment/assessmentService.ts'

export const practiceService: PracticeService = {
  evaluate(request, challenge) {
    const expectedId = request.assessment.purpose === 'practice' ? challenge.practiceAssessmentId : challenge.reassessmentId
    if (request.assessment.id !== expectedId || request.assessment.purpose === 'initial') throw new Error('Asesmen tidak sesuai tantangan.')
    const evaluation = evaluateStructuredAssessment(request)
    return { id: evaluation.id, challengeId: challenge.id, evaluation, passed: evaluation.score >= challenge.passingScore }
  },
}
