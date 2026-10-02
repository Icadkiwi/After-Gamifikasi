import { createLearningProfile } from '../../learning/progress/profile.ts'
import type { UserLearningProfile } from '../../learning/progress/types.ts'

export interface LearningRepository {
  load(userId: string): UserLearningProfile
  save(profile: UserLearningProfile): void
}
export const LEARNING_UPDATED_EVENT = 'after-gamifikasi:learning-updated'
export function learningStorageKey(userId: string) {
  if (!userId.trim()) throw new Error('Pengguna diperlukan.')
  return `after-gamifikasi-learning-v1:${encodeURIComponent(userId)}`
}

export class LocalLearningRepository implements LearningRepository {
  load(userId: string): UserLearningProfile {
    const raw = localStorage.getItem(learningStorageKey(userId))
    if (!raw) return createLearningProfile(userId)
    let value: UserLearningProfile
    try { value = JSON.parse(raw) as UserLearningProfile } catch { throw new Error('Data belajar lokal tidak dapat dibaca. Data asli tetap disimpan.') }
    if (value.schemaVersion !== 1 || value.userId !== userId || !value.competencies || !Array.isArray(value.assessmentResults) || !Array.isArray(value.practiceResults) || !Array.isArray(value.history) || !Array.isArray(value.readModules) || !Array.isArray(value.completedModules) || !Array.isArray(value.completedChallenges)) {
      throw new Error('Format atau pemilik data belajar tidak sesuai. Data asli tetap disimpan.')
    }
    return { ...value, competencies: { ...createLearningProfile(userId).competencies, ...value.competencies } }
  }
  save(profile: UserLearningProfile) {
    try { localStorage.setItem(learningStorageKey(profile.userId), JSON.stringify(profile)) }
    catch { throw new Error('Progres belum tersimpan. Periksa izin atau kapasitas penyimpanan browser.') }
    window.dispatchEvent(new CustomEvent(LEARNING_UPDATED_EVENT, { detail: { userId: profile.userId } }))
  }
}
