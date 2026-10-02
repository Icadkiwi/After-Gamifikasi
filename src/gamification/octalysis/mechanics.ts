export type OctalysisMapping = {
  coreDrive: string
  status: 'implemented' | 'partial' | 'not-implemented'
  mechanic: string
  learningPurpose: string
  implementation: string[]
}

// Design interpretation, not empirical proof of motivation or effectiveness.
export const octalysisMappings: OctalysisMapping[] = [
  { coreDrive: 'CD1 — Epic Meaning & Calling', status: 'not-implemented', mechanic: 'Belum ada narasi misi bersama yang melampaui progres personal.', learningPurpose: 'Rencana: mengaitkan kemampuan literasi dengan tujuan yang bermakna.', implementation: [] },
  { coreDrive: 'CD2 — Development & Accomplishment', status: 'implemented', mechanic: 'Mastery berbasis bukti, EXP, level, lencana, dan tantangan.', learningPurpose: 'Memperlihatkan kemajuan pemahaman dan hasil usaha belajar.', implementation: ['src/learning/progress', 'src/gamification/rewards', 'src/gamification/achievements'] },
  { coreDrive: 'CD3 — Empowerment of Creativity & Feedback', status: 'implemented', mechanic: 'Penataan kota, undo, dan umpan balik jawaban terstruktur.', learningPurpose: 'Memberi pilihan kreatif dan kesempatan memperbaiki pemahaman.', implementation: ['src/game/GameScene.ts', 'src/components/learning/AssessmentForm.tsx'] },
  { coreDrive: 'CD4 — Ownership & Possession', status: 'implemented', mechanic: 'Kota pribadi, bangunan, kendaraan, dan mata uang permainan.', learningPurpose: 'Menampilkan hasil belajar sebagai perkembangan kota milik pengguna.', implementation: ['src/game/city/storage.ts', 'src/components/ShopModal.tsx'] },
  { coreDrive: 'CD5 — Social Influence & Relatedness', status: 'not-implemented', mechanic: 'Belum ada kolaborasi atau interaksi antarpengguna.', learningPurpose: 'Belum diterapkan; NPC bukan bukti fitur sosial.', implementation: [] },
  { coreDrive: 'CD6 — Scarcity & Impatience', status: 'partial', mechanic: 'Batas bonus harian, harga item, dan prasyarat belajar/kota.', learningPurpose: 'Menata tahapan progres; bukan membatasi akses pengulangan materi.', implementation: ['src/gamification/missions/missionConfig.ts', 'src/game/city/learningUnlocks.ts'] },
  { coreDrive: 'CD7 — Unpredictability & Curiosity', status: 'not-implemented', mechanic: 'Belum ada eksplorasi materi atau kejutan yang dirancang untuk belajar.', learningPurpose: 'Pergantian cuaca kosmetik tidak diklaim sebagai implementasi edukasi.', implementation: [] },
  { coreDrive: 'CD8 — Loss & Avoidance', status: 'not-implemented', mechanic: 'Tidak ada penalti kehilangan progres karena tidak belajar.', learningPurpose: 'Belum diterapkan; tidak menambahkan tekanan kehilangan reward.', implementation: [] },
]
