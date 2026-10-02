# Audit sebelum refactor pembelajaran

## Temuan dan keputusan

Arsitektur awal: React/Vite mengatur akun dan modal; Phaser GameScene mengatur kota.
GameEvents menghubungkan keduanya. Firebase Authentication dan users/{uid} digunakan
untuk akun. FinanceProvider memakai Firestore Lite dan cache localStorage untuk CRUD.
Gamification/achievement berada di src/game dan menerima aktivitas CRUD transaksi.

Inventaris import, reverse references dan storage semua source/tests direkam dalam
source-audit-before.json sebelum penghapusan. Artefak mockups adalah rancangan lama,
bukan aplikasi aktif. tests/e2e-auth-flow.mjs sudah untracked sebelum pekerjaan ini
dan tidak dihapus/ditimpa; skrip tersebut menyentuh Firebase production.

| Kelompok | File/dependensi | Keputusan |
| --- | --- | --- |
| PFM saja | components/finance, contexts/finance-context, types/finance, utils/finance | Hapus setelah UI dan penghubung gamifikasi dilepas |
| Campuran auth/PFM | lib/firestore-finance: ensureUserDocument dipakai AuthContext | Ekstrak ke services/userProfile sebelum menghapus CRUD |
| Gamifikasi | gamificationService, achievementConfig/Service, useGamification/useAchievements | Pindah ke gamification; pertahankan reward, shop, level dan UI pencapaian |
| Kota kritis | GameScene, CameraController, VehicleMovementSystem, shopItems, vehicleUnlockLogic, building configs, GameEvents | Pertahankan mesin; pisahkan persistence per UID dan tambahkan gerbang learning |
| Admin | AdminToolsModal | Buang reset PFM; pertahankan debug kota/level/lencana khusus admin |
| Auth | AuthContext, AuthGate, halaman akun, firebase, forgotPassword | Pertahankan alur dan tes |
| Shared | date, numeric-input, lib/utils, components/ui, assets | Pertahankan; numeric-input digunakan admin juga |
| Tidak terpasang | HomePage, ThemeToggle, PageContainer, ringkasan PFM | Periksa reverse references sebelum membersihkan |
| Styles/routes | globals.css, router | Pertahankan layout; ubah komentar PFM; /game tetap protected |

## Penyimpanan awal

- Firestore: users/{uid}, users/{uid}/transactions, users/{uid}/categories.
- Cache PFM: after-gamifikasi-finance-{uid}; dihentikan tanpa menghapus data browser.
- Gamifikasi: after-gamifikasi-user-stats-{uid}; dipertahankan agar inventory/EXP tidak hilang.
- Misi: after-gamifikasi-daily-reward-log-{uid}-{date}; namespace learning baru agar
  transaksi lama tidak menjadi bukti pembelajaran.
- Pencapaian: achievement_progress_{uid}; bukti PFM tidak dikonversi menjadi mastery.
- Kota: after-gamifikasi-placeable-positions, after-gamifikasi-shop-placeables,
  after-gamifikasi-ground-tiles, after-gamifikasi-economy-state (global, belum per UID).
- Preferensi: dailyMissionMinimized global; sessionStorage verification-cooldown-{uid}.

Tidak menghapus data Firestore/localStorage lama dan tidak menerapkan rules ke cloud.
Data kota global tidak otomatis diklaim oleh akun pertama karena pemiliknya tidak
dapat diketahui. Adapter per UID menggunakan namespace baru; migrasi lama perlu
konfirmasi kepemilikan di tahap tersendiri.

## Pilihan arsitektur

1. Rewrite game dan persistence sekaligus: konsisten, tetapi risiko regresi Phaser
   dan migrasi data tinggi. Tidak dipilih.
2. Modular monolith: learning murni, kontrak agen terstruktur, application service
   mengoordinasikan hasil dan reward, kota tetap memakai event bridge. Dipilih.
   Trade-off: persistence lokal belum otoritatif/atomik lintas tab; backend menyusul.

Konten awal adalah demonstrasi berlabel, bukan instrumen penelitian tervalidasi.
Mastery harus berasal dari soal dan bukti penilaian; membuka materi saja tidak
menaikkan mastery atau memberikan reward utama. Tidak ada LLM atau kutipan rekaan.
