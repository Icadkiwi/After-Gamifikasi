# Laporan refactor edukasi literasi keuangan

Laporan tahap penghapusan PFM dan fondasi pembelajaran. Arsitektur layanan telah
disesuaikan pada 30 September 2026: lihat
[laporan single-agent](single-agent-refactor-report.md) untuk kondisi terbaru.
Angka pengujian pada bagian 9 merekam verifikasi tahap ini, sebelum refactor lanjutan.

## 1. Project audit

`source-audit-before.json` merekam import/reverse-reference/storage 99 source/test
files sebelum penghapusan. `refactor-audit.md` menjelaskan dependensi dan keputusan.
`source-audit-after.json` merekam 110 source/test files setelah refactor.
Baseline build dan 4 tes forgot-password lulus. Baseline lint mempunyai 3 error
fast-refresh pada export variants komponen UI.

Temuan: AuthContext memakai ensureUserDocument dari file PFM; mission/achievement
bergantung transaksi; layout kota global; dokumentasi lama; konfigurasi Firebase
hard-coded. Tidak ada dependency baru yang ditambahkan.

## 2. Removed

Daftar rinci 18 file PFM ada di `removed-pfm-files.json`:

- Seluruh components/finance (transaksi, kategori, laporan/mutasi, diagram, modal,
  ringkasan). Ringkasan kota digantikan UI learning; hook cityProgress dipertahankan.
- contexts/finance-context, lib/firestore-finance, types/finance, utils/finance.
  ensureUserDocument diekstrak sebelum modul Firestore PFM dihapus.
- Tambahan: HomePage dan ThemeToggle yang tidak direferensikan route/komponen aktif.
- Fungsi grantTransactionReward, achievement transaksi, reset PFM admin, akses
  subcollection transactions/categories di file rules lokal.

Tidak menghapus data Firestore/localStorage atau asset. Skrip E2E auth untracked
milik pengguna dipertahankan. Mockup HTML lama dipertahankan sebagai arsip desain,
bukan route/runtime. Shared UI dan PageContainer (dipakai auth) dipertahankan.

## 3. Refactored

- services/userProfile: profil akun Firestore terpisah dari PFM.
- gamification/rewards: EXP, level, inventory, currency, hook dan receipt hadiah.
- gamification/missions: misi edukasi, definisi extensible, deduplikasi evidence.
- gamification/achievements: learning/habit/city; infrastruktur tier, modal,
  notifikasi dan admin tetap dipakai. Bukti PFM tidak menjadi mastery.
- GamePage, DailyMissionPanel dan Tutorial mengarah ke alur belajar.
- Game/GameScene/GameCanvas/cityProgress/vehicleUnlockLogic memakai UID eksplisit.
  Scene dibuat ulang saat akun berganti; saldo disinkronkan setelah scene siap.
- Shop memiliki learning unlock di UI dan services/gameProgressionService.
- Firebase memakai env; konfigurasi existing dipindahkan ke .env.local yang
  diabaikan Git. Tidak menambahkan key LLM/service-account ke frontend.
- Lint memperbolehkan tiga export variant UI; TooltipProvider dipasang ketika
  komponen batas reward yang sebelumnya tidak aktif dipakai di dasbor baru.

## 4. Preserved

Stack React/TS/Vite/Tailwind/Phaser/Firebase; register/login/logout/verification/
resend/forgot-password/protected routes; map, camera, cuaca, placement, movement,
collision, undo; shop, buildings, decorations, vehicles, upgrades, passive income;
EXP, level, coin/diamond, achievements, misi harian, tutorial, admin debug, assets.
GameScene tetap di lokasi awal agar risiko perubahan jalur asset minimal.
Mobil pemadam tetap unavailable karena asetnya belum ada (kondisi sebelumnya).

## 5. Learning system

Model: FinancialCompetency, MasteryRecord, AssessmentQuestion/Definition/Result,
ScoringEvidence, UserLearningProfile, LearningModule, LearningChallenge,
PracticeResult, LearningProgress, LearningMission, LearningEvent, GameReward.

7 definisi kompetensi; 2 modul demo; 2 tantangan; 5 paket asesmen. Soal berversi,
bobot, kunci, jawaban, alasan dan evidence tersimpan. Skor overall hanya rata-rata
kompetensi terukur; yang belum diukur bernilai null. Ambang 80 adalah parameter
demonstrasi, belum tervalidasi untuk penelitian.

Asesmen awal → profil → rekomendasi → materi → latihan → asesmen ulang → profil
dan reward → kota → tantangan berikutnya. Membaca saja tidak menaikkan mastery.
Practice harus lulus sebelum reassessment; reassessment lulus menyelesaikan modul.

Budget: 100 EXP, 800 koin, 10 berlian sebelum bonus level; membuka Kedai Kopi.
Safety: 150 EXP, 1000 koin, 20 berlian sebelum bonus level; membuka Kantor Polisi.
Safety memerlukan Budget selesai dan kota level 2 (upgrade Bank memakai reward).
Harga pembelian tetap berlaku. Hadiah utama sekali per challenge, dengan receipt
dan saldo dalam satu write localStorage. Kapasitas Bank/berlian berlaku; kelebihan
tidak ditampung. Bonus misi harian terpisah. Pengulangan belajar tetap tersedia.

## 6. Layanan pembelajaran dan fondasi satu agen

AssessmentService, LearningRecommendationService dan PracticeService merupakan
layanan deterministik. Pembaruan mastery dipisahkan ke LearnerProfileService.
Kontrak layanan berada di services/learning/contracts.ts. LearningService
mempertahankan alur asesmen → materi → practice → reassessment → update profil.

Fondasi satu FinancialLiteracyAgent berada di src/agent/, dengan registry tool,
validasi, allowlist, batas langkah, timeout dan cancellation. Belum ada provider
LLM atau pemilihan tool oleh LLM. React tetap memakai alur deterministik existing.

KnowledgeRepository/CuratedKnowledgeRepository memiliki metadata judul, organisasi,
author, tanggal publikasi/retrieval, URL, topik, content, verification status.
Default kosong; hanya verified sources boleh diretrieval. Belum ada LLM, embedding,
vector search atau RAG aktif; tidak ada scraping/kutipan rekaan.

AdminContentService menyediakan kontrak draft/publish modul, competency, quiz,
challenge, mission, reward, achievement, knowledge. CMS admin belum dibuat.

## 7. Octalysis mapping

Ini interpretasi rancangan, bukan bukti empiris efektivitas motivasi.
Config executable: src/gamification/octalysis/mechanics.ts.

| Core Drive | Existing mechanic | Status | File/implementation |
| --- | --- | --- | --- |
| CD1 Meaning & Calling | Belum ada narasi/tujuan kolektif | Belum | Dicatat sebagai gap di config |
| CD2 Development & Accomplishment | Mastery, EXP, level, lencana, challenge | Ada | learning/progress; gamification/rewards/achievements |
| CD3 Creativity & Feedback | Penataan kota, undo, feedback jawaban | Ada | GameScene.ts; AssessmentForm.tsx |
| CD4 Ownership & Possession | Kota, inventory, mata uang per akun | Ada | game/city/storage.ts; ShopModal.tsx |
| CD5 Social Influence | Belum ada interaksi antarpengguna | Belum | NPC bukan bukti fitur sosial |
| CD6 Scarcity & Impatience | Limit bonus, harga, prasyarat | Parsial | missionConfig.ts; learningUnlocks.ts |
| CD7 Unpredictability & Curiosity | Belum ada eksplorasi/kejutan edukasi | Belum | Cuaca kosmetik tidak diklaim sebagai bukti |
| CD8 Loss & Avoidance | Tidak ada penalti kehilangan progres | Belum | Tidak ditambahkan mekanisme tekanan |

## 8. Remaining work

Kurasi materi lengkap/sumber tepercaya; validasi ahli, instrumen dan ambang mastery;
variasi soal dan model longitudinal; backend AI/RAG dan evaluasi citation; CMS;
Firestore lintas perangkat/migrasi legacy; server authorization dan ledger reward;
auth integration penuh pada emulator/staging; evaluasi usability/Octalysis.

## 9. Test result

Verifikasi akhir 29 September 2026:

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus, tidak ada error TypeScript |
| `npm run lint` | Lulus, tidak ada error ESLint |
| `npm test` | 24/24 lulus: 4 tes forgot-password dan 20 tes learning/integrasi lokal |
| `npm run build` | Lulus; warning ukuran bundle masih ada |
| `node tests/browser-learning-smoke.mjs` | Lulus di Chrome headless, desktop 1280px dan mobile 390px |
| `git diff --check` | Lulus |

Tes learning mencakup scoring/evidence berbobot, validasi soal/jawaban, kompetensi
belum terukur, prasyarat, practice vs mastery, pembaruan learner model, reward
sekali per tantangan, deduplikasi request/soal/event, misi per kompetensi, isolasi
UID, purchase unlock, data legacy, kegagalan penyimpanan dan filter sumber verified.

Browser smoke memeriksa redirect tamu ke login, halaman forgot-password, kedua
alur materi → practice → reassessment, mastery/reward, admin tidak terlihat untuk
akun biasa, modal desktop/mobile, upgrade Bank melalui UI, terbukanya tantangan
Keamanan Digital, pembelian taksi dan persistensi setelah reload. Tidak ada
JavaScript page error. Screenshot: [desktop](screenshots/learning-desktop.png)
dan [mobile](screenshots/learning-mobile.png).

Unit/integration tests tidak menghubungi Firebase production. Browser smoke
memakai AuthContext tiruan untuk alur akun belajar, tanpa mengubah source
autentikasi. Login/registrasi/verifikasi email production dan seluruh variasi
placement/collision/undo belum diuji end-to-end pada tahap ini.

## 10. Risks / technical debt / persistence

LocalStorage per UID mengisolasi data dalam alur aplikasi, bukan security boundary.
Klien masih dapat memodifikasi state dan membaca kunci soal. Admin existing memakai
email whitelist, belum custom claims/server authorization. Dua tab dapat berkonflik
karena read-modify-write tidak transaksional. Bukti belajar/reward belum otoritatif.

Completion receipt dan saldo memakai satu write, namun profil dan reward bukan
satu transaksi. Opening dashboard merekonsiliasi receipt completion yang terlewat.
Beberapa handler game legacy masih mengabaikan error quota; learning menampilkan
error simpan. Belum sinkron lintas perangkat. History/evidence lokal belum dipaginasi.

Usulan Firestore, belum diaktifkan:

```text
users/{uid}                          # Profil akun
users/{uid}/learning/profile         # Learner model berversi
users/{uid}/assessments/{attemptId}   # Evidence, server-scored
users/{uid}/practice/{attemptId}      # Hasil skenario/reassessment
users/{uid}/mastery/{competencyId}    # Nilai + evidence refs
users/{uid}/progress/{moduleId}       # Baca/completion
users/{uid}/game/state               # EXP/currency/inventory
users/{uid}/city/layout              # Layout atau chunk
users/{uid}/missions/{date}          # Evidence/counter/claims
users/{uid}/achievements/{id}
users/{uid}/rewardReceipts/{id}      # Transaksi dengan wallet
learningModules/{id}                 # Konten berversi, admin publish
competencies/{id}
assessments/{id}                     # Kunci hanya server
challenges/{id}
knowledgeSources/{id}                # Metadata/review/content
```

Backend perlu memverifikasi token, ownership UID, email, admin claims dan schema;
menghitung reward dari evidence tervalidasi; melarang penulisan bebas currency/
mastery. Gunakan transaksi receipt+wallet, idempotency attempt dan retry queue.
Migrasi lokal membutuhkan kepemilikan, backup, validasi dan kebijakan konflik.

Data PFM, achievement lama dan layout kota global tetap utuh. Layout global tidak
otomatis diklaim akun karena UID pemilik tidak diketahui; akun melihat layout per
UID baru. Stat/inventory legacy per UID dipertahankan. Perubahan rules lokal perlu
dikoordinasikan dengan penghentian klien lama sebelum deployment. Tidak ada deploy.

Bundle Phaser dan JPG mata uang besar merupakan utang teknis existing; code
splitting/kompresi aset dapat dilakukan terpisah.
