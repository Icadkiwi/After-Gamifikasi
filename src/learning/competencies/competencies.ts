export type MasteryLevel = 'unassessed' | 'foundation' | 'developing' | 'proficient'

export type FinancialCompetency = {
  id: string
  name: string
  description: string
  masteryThreshold: number
}

export const competencies: FinancialCompetency[] = [
  { id: 'basics', name: 'Dasar Keuangan', description: 'Kebutuhan, keinginan, dan tujuan keuangan.', masteryThreshold: 80 },
  { id: 'budgeting', name: 'Perencanaan Anggaran', description: 'Membandingkan kebutuhan dengan sumber daya dalam skenario.', masteryThreshold: 80 },
  { id: 'saving', name: 'Menabung', description: 'Tujuan dan kebiasaan menabung.', masteryThreshold: 80 },
  { id: 'emergency', name: 'Dana Darurat', description: 'Kesiapan menghadapi kebutuhan tidak terduga.', masteryThreshold: 80 },
  { id: 'debt', name: 'Utang dan Pinjaman', description: 'Biaya, kewajiban, dan risiko pinjaman.', masteryThreshold: 80 },
  { id: 'digital-safety', name: 'Keamanan Keuangan Digital', description: 'Melindungi informasi dan mengenali permintaan mencurigakan.', masteryThreshold: 80 },
  { id: 'risk', name: 'Kesadaran Risiko', description: 'Menilai ketidakpastian dan klaim keuntungan.', masteryThreshold: 80 },
]

export function getMasteryLevel(score: number | null, threshold = 80): MasteryLevel {
  if (score === null) return 'unassessed'
  if (score >= threshold) return 'proficient'
  return score >= 50 ? 'developing' : 'foundation'
}

export const masteryLabels: Record<MasteryLevel, string> = {
  unassessed: 'Belum diukur', foundation: 'Dasar', developing: 'Berkembang', proficient: 'Menguasai',
}
