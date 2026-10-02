# Audit sebelum refactor single-agent (30 September 2026)

Inventaris 114 source/test files beserta import, reverse-reference dan akses
storage: `single-agent-audit-before.json`. Baseline: 26/26 tes lulus.

## Batas perubahan

| Komponen lama | Tanggung jawab nyata | Pemanggil aktif |
| --- | --- | --- |
| ruleBasedAssessmentAgent | Scoring berbobot + transformasi learner model | learningService, practice evaluator, learning tests |
| ruleBasedMentorAgent | Rekomendasi berdasarkan kompetensi/prasyarat | defaultLearningService, learning tests |
| ruleBasedPracticeAgent | Evaluasi practice/reassessment memakai scorer yang sama | defaultLearningService, learning tests |
| agents/shared/contracts | Kontrak layanan sinkron; bukan keputusan model | 3 layanan di atas, learningService |
| learningService | Validasi alur, simpan profil/evidence, terbitkan event | LearningDashboard, tools yang akan ditambahkan |
| defaultLearningService | Komposisi layanan, event misi, reward, achievement | dashboard/hook, shop progression, tests |
| grantLearningCompletionReward | Wallet/receipt, batas kapasitas, bonus level | defaultLearningService, tes quota |

React tidak menghitung skor. Alur UI tetap melalui learningService. Fungsi scorer
dipertahankan; transformasi mastery dipisahkan ke LearnerProfileService. Reward
tool harus memakai layanan eligibility di atas wallet existing, bukan menerima
jumlah reward dari model. Agen tidak mendapat tool untuk menulis skor/profil mentah.

Auth, akses lokal, game/Phaser, shop, assets, threshold 80, katalog soal/materi dan
mapping Octalysis tidak memerlukan perubahan. Label NPC "Mentor" hanya peran
karakter game dan tidak menyatakan agen AI.

## Persistensi dan kompatibilitas

- Learning: `after-gamifikasi-learning-v1:{encodedUid}`, schemaVersion 1.
- Evaluator terserialisasi `rules-demo` tetap dipertahankan.
- Wallet/inventory/receipt: `after-gamifikasi-user-stats-{uid}`.
- Mission: `after-gamifikasi-learning-daily-log-v1-{uid}-{date}`.
- Achievement: `learning_achievement_progress_v1_...`.
- Layout/economy/vehicle: kunci existing dengan `:user:{encodedUid}`.
- Sesi preview: sessionStorage `after-gamifikasi-local-session-v1`.
- Firestore profil akun: `users/{uid}`, tidak ada akses baru dari fondasi agen.

Tidak ada migrasi/reset/schema version baru. Fixture sintetis
`tests/fixtures/pre-single-agent-save.json` dibuat dengan kode lama sebelum
refactor untuk menguji pembacaan progres dan receipt existing. Bukan data akun asli.

## Rencana integrasi

Satu FinancialLiteracyAgent opsional, tidak dipasang sebagai background worker
atau pengganti alur UI. Provider netral belum diimplementasikan. Registry menjadi
adapter layanan existing, terikat UID dari aplikasi. Jawaban learner berasal
dari submission aplikasi, bukan argumen yang boleh dikarang model. Request tool
divalidasi dengan allowlist/input schema; loop dibatasi langkah, timeout dan abort.
