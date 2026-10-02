import type { AssessmentDefinition, AssessmentQuestion } from '../assessment/types.ts'
import type { LearningChallenge } from '../challenges/types.ts'
import type { LearningModule } from './types.ts'

// Small demonstration catalog. Replace/extend through the content repository after review.
export const learningModules: LearningModule[] = [
  {
    id: 'budget-foundations', version: 1, title: 'Menyusun Anggaran Sederhana',
    competencyIds: ['budgeting'], prerequisiteModuleIds: [], sourceIds: [], contentStatus: 'demo',
    objectives: ['Menghitung sisa anggaran pada skenario.', 'Mengenali rencana yang melebihi sumber daya.'],
    sections: [
      { title: 'Mulai dari batas sumber daya', content: 'Dalam simulasi ini, jumlah yang dialokasikan tidak boleh melebihi uang yang tersedia. Jumlahkan kebutuhan yang direncanakan, lalu bandingkan dengan sumber daya.' },
      { title: 'Contoh perhitungan', content: 'Rani mempunyai 100 unit uang simulasi. Ia merencanakan 60 unit untuk kebutuhan dan 20 unit untuk tabungan. Sisa yang belum dialokasikan adalah 100 − 60 − 20 = 20 unit.' },
      { title: 'Periksa pilihanmu', content: 'Jika rencana berjumlah 110 unit sedangkan tersedia 100 unit, rencana kekurangan 10 unit. Tinjau kembali alokasi sebelum memutuskan. Latihan ini memakai tokoh fiktif dan tidak meminta data keuangan pribadimu.' },
    ],
  },
  {
    id: 'digital-safety-foundations', version: 1, title: 'Mengenali Permintaan Mencurigakan',
    competencyIds: ['digital-safety'], prerequisiteModuleIds: ['budget-foundations'], sourceIds: [], contentStatus: 'demo',
    objectives: ['Membedakan verifikasi mandiri dari mengikuti pesan mencurigakan.', 'Melindungi kode autentikasi.'],
    sections: [
      { title: 'Aturan simulasi', content: 'Pada latihan ini, kode OTP adalah rahasia pemilik akun. Jangan memberikan kode kepada pengirim pesan yang mengaku petugas.' },
      { title: 'Verifikasi secara mandiri', content: 'Jika pesan meminta kode atau mengarahkan ke tautan yang mencurigakan, hentikan interaksi. Periksa melalui aplikasi atau kanal resmi yang kamu buka sendiri, bukan kontak dari pesan tersebut.' },
    ],
  },
]

function question(id: string, competencyId: string, prompt: string, correct: string, alternatives: string[], explanation: string): AssessmentQuestion {
  return { id, competencyId, prompt, options: [...alternatives, correct].map((label, index) => ({ id: String(index), label })), correctOptionId: String(alternatives.length), weight: 1, explanation, sourceIds: [] }
}

const budget = (prefix: string, available: number, needs: number, savings: number) => [
  question(`${prefix}-remaining`, 'budgeting', `Dana simulasi ${available} unit, kebutuhan ${needs} unit, dan tabungan ${savings} unit. Berapa sisanya?`, `${available - needs - savings} unit`, [`${available - needs} unit`, `${available + savings} unit`], `Sisa = ${available} − ${needs} − ${savings} = ${available - needs - savings} unit.`),
  question(`${prefix}-plan`, 'budgeting', `Rencana penggunaan ${available + 10} unit dengan dana ${available} unit. Apa hasil evaluasimu?`, 'Rencana melebihi dana sebanyak 10 unit dan perlu ditinjau.', ['Rencana sudah seimbang.', 'Masih tersisa 10 unit.'], `Rencana melebihi dana: ${available + 10} − ${available} = 10 unit.`),
]
const safety = (prefix: string) => [
  question(`${prefix}-code`, 'digital-safety', 'Pengirim pesan yang mengaku petugas meminta kode OTP dalam simulasi. Apa tindakanmu?', 'Tidak memberikan kode dan memverifikasi melalui kanal resmi yang dibuka sendiri.', ['Mengirim kode agar bantuan lebih cepat.', 'Mengirim setengah kode.'], 'Kode autentikasi tidak dibagikan kepada pengirim pesan. Verifikasi dilakukan secara mandiri.'),
  question(`${prefix}-link`, 'digital-safety', 'Pesan mendesakmu membuka tautan asing untuk mengamankan akun. Mana langkah verifikasi yang tepat?', 'Membuka aplikasi resmi secara mandiri untuk memeriksa informasi.', ['Langsung mengikuti tautan pesan.', 'Membalas dengan kata sandi untuk memastikan identitas.'], 'Jangan bergantung pada tautan atau kontak dari pesan yang sedang diragukan.'),
]

export const assessments: AssessmentDefinition[] = [
  { id: 'initial-v1', version: 1, title: 'Asesmen Awal', purpose: 'initial', contentStatus: 'demo', questions: [...budget('initial-budget', 100, 50, 20), ...safety('initial-safety')] },
  { id: 'budget-practice', version: 1, title: 'Latihan Anggaran', purpose: 'practice', contentStatus: 'demo', questions: budget('practice-budget', 150, 80, 30) },
  { id: 'budget-reassessment', version: 1, title: 'Asesmen Ulang Anggaran', purpose: 'reassessment', contentStatus: 'demo', questions: budget('reassess-budget', 200, 120, 40) },
  { id: 'safety-practice', version: 1, title: 'Latihan Keamanan Digital', purpose: 'practice', contentStatus: 'demo', questions: safety('practice-safety') },
  { id: 'safety-reassessment', version: 1, title: 'Asesmen Ulang Keamanan Digital', purpose: 'reassessment', contentStatus: 'demo', questions: safety('reassess-safety') },
]

export const learningChallenges: LearningChallenge[] = [
  { id: 'budget-challenge', moduleId: 'budget-foundations', title: 'Tantangan Anggaran', scenario: 'Bantu tokoh fiktif mengevaluasi alokasi dana simulasi.', practiceAssessmentId: 'budget-practice', reassessmentId: 'budget-reassessment', passingScore: 80 },
  { id: 'safety-challenge', moduleId: 'digital-safety-foundations', title: 'Tantangan Keamanan Digital', scenario: 'Pilih respons terhadap pesan mencurigakan pada akun simulasi.', practiceAssessmentId: 'safety-practice', reassessmentId: 'safety-reassessment', passingScore: 80, requiredCityLevel: 2 },
]
