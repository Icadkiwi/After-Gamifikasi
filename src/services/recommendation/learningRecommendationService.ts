import type { LearningRecommendationService } from '../learning/contracts.ts'

export const learningRecommendationService: LearningRecommendationService = {
  recommend(profile, modules) {
    if (!profile.lastAssessmentId) return { moduleId: null, reason: 'Asesmen awal diperlukan.', explanation: 'Jawab asesmen awal untuk menentukan titik mulai belajar.', competencyIds: [], sourceIds: [], mode: 'rules-demo' }
    const available = modules.filter((module) => !profile.completedModules.includes(module.id) && module.prerequisiteModuleIds.every((id) => profile.completedModules.includes(id)))
    const score = (ids: string[]) => ids.reduce((sum, id) => sum + (profile.competencies[id]?.score ?? 0), 0) / Math.max(ids.length, 1)
    const next = available.sort((a, b) => score(a.competencyIds) - score(b.competencyIds))[0]
    return {
      moduleId: next?.id ?? null,
      reason: next ? 'Prioritas kompetensi terendah dari materi yang prasyaratnya terpenuhi.' : 'Seluruh materi yang tersedia sudah diselesaikan.',
      explanation: next ? `${score(next.competencyIds) < 50 ? 'Mulai dengan contoh perhitungan dan aturan dasar, lalu periksa setiap langkah.' : 'Pemahaman awalmu sudah terbentuk; terapkan pada skenario dan tinjau alasan setiap pilihan.'} Pelajari ${next.title}, coba skenarionya, lalu ukur kembali pemahamanmu.` : 'Kamu dapat mengulang latihan tanpa hadiah penyelesaian ganda. Materi tambahan menunggu kurasi.',
      competencyIds: next?.competencyIds ?? [], sourceIds: next?.sourceIds ?? [], mode: 'rules-demo',
    }
  },
}
