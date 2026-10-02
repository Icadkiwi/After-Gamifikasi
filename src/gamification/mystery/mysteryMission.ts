import { assessments } from '../../learning/modules/catalog'

// CD7 — Mystery Learning Mission (deterministic).
// The rotation only reuses questions from the validated existing catalog;
// no new financial content is invented here and no reward is attached.
// Deterministic outcome: the same date always yields the same question.

export type MysteryMission = Readonly<{
  assessmentId: string
  assessmentTitle: string
  questionId: string
  prompt: string
  options: Readonly<{ id: string; label: string }[]>
  correctOptionId: string
  explanation: string
}>

function hashDateKey(dateKey: string) {
  // FNV-1a 32-bit: stable, dependency-free, evenly spread for daily rotation.
  let hash = 0x811c9dc5
  for (let index = 0; index < dateKey.length; index += 1) {
    hash ^= dateKey.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function flattenCatalogQuestions() {
  return assessments.flatMap((assessment) =>
    assessment.questions.map((question) => ({ assessment, question })),
  )
}

export function getMysteryMissionForDate(dateKey: string): MysteryMission | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null

  // Calendar-valid check: rejects e.g. 2026-02-30 or 2026-13-99, which would
  // otherwise silently normalize to a different real date.
  const [year, month, day] = dateKey.split('-').map(Number)
  const asDate = new Date(Date.UTC(year, month - 1, day))
  if (
    asDate.getUTCFullYear() !== year ||
    asDate.getUTCMonth() !== month - 1 ||
    asDate.getUTCDate() !== day
  ) {
    return null
  }

  const pool = flattenCatalogQuestions()
  if (pool.length === 0) return null

  const selected = pool[hashDateKey(dateKey) % pool.length]

  return {
    assessmentId: selected.assessment.id,
    assessmentTitle: selected.assessment.title,
    questionId: selected.question.id,
    prompt: selected.question.prompt,
    options: selected.question.options.map((option) => ({ id: option.id, label: option.label })),
    correctOptionId: selected.question.correctOptionId,
    explanation: selected.question.explanation,
  }
}

export function checkMysteryAnswer(mission: MysteryMission, optionId: unknown) {
  if (typeof optionId !== 'string') return { correct: false as const }
  return { correct: optionId === mission.correctOptionId }
}
