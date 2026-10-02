import type { GameReward } from '../rewards/types.ts'

export type LearningMissionAction = 'completeLesson' | 'completeChallenge' | 'answerQuestion' | 'improveCompetency'
export type LearningMissionDefinition = {
  id: string
  title: string
  description: string
  competencyId?: string
  requirement: { action: LearningMissionAction | 'allMissions'; target: number }
  rewards: GameReward[]
}
export type LearningMission = LearningMissionDefinition & { progress: number; completed: boolean; claimed: boolean }

export const dailyMissionDefinitions: LearningMissionDefinition[] = [
  { id: 'learn-lesson', title: 'Kuasai 1 materi', description: 'Baca materi dan lulus asesmen ulang tantangannya.', requirement: { action: 'completeLesson', target: 1 }, rewards: [{ type: 'coin', amount: 15 }, { type: 'exp', amount: 30 }] },
  { id: 'learn-challenge', title: 'Selesaikan 1 tantangan', description: 'Lulus skenario latihan dan asesmen ulang.', requirement: { action: 'completeChallenge', target: 1 }, rewards: [{ type: 'coin', amount: 35 }, { type: 'exp', amount: 40 }] },
  { id: 'learn-questions', title: 'Jawab 5 soal', description: 'Kirim jawaban untuk 5 soal berbeda hari ini dan pelajari umpan baliknya.', requirement: { action: 'answerQuestion', target: 5 }, rewards: [{ type: 'coin', amount: 15 }, { type: 'exp', amount: 20 }] },
  { id: 'learn-daily-complete', title: 'Selesaikan semua misi belajar', description: 'Klaim bonus setelah seluruh misi pembelajaran selesai.', requirement: { action: 'allMissions', target: 3 }, rewards: [{ type: 'diamond', amount: 5 }, { type: 'coin', amount: 40 }, { type: 'exp', amount: 50 }] },
]
