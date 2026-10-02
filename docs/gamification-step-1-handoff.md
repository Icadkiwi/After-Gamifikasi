# Gamification Step 1: Building Role & Gamification Function

Revisi: 1 Oktober 2026. Branch: `codex/gamification-step-1-mapping`.
Scope: katalog peran kota dan kontrak baca; tidak ada integrasi UI atau Step 2.

## Koreksi model

Model awal: **Building → Specific Learning Content**.
Model revisi: **Building → Gamification Role / Function**.

**Bangunan tidak menentukan konten literasi keuangan yang harus dipelajari.**
Seluruh enam asosiasi konten dari desain awal, field referensi kurikulum dan
import tipe pembelajaran telah dihapus. Pembelian, kepemilikan, upgrade,
penjualan, pendapatan pasif, currency dan ukuran kota bukan bukti mastery.
Layanan pembelajaran deterministik tetap berwenang atas scoring dan mastery.

`buildingLearning.ts` diganti nama menjadi `buildingRoles.ts`; tesnya menjadi
`buildingRoles.test.mjs`. Pemeriksaan referensi sebelum revisi memastikan belum
ada consumer produksi. Tidak ada katalog lama atau compatibility adapter tersisa.

## Satu sumber peran dan kontrak stabil untuk Freebuff

**`src/gamification/buildings/buildingRoles.ts`** adalah sumber deklaratif peran
bangunan. Modul tidak memiliki import dan tidak membutuhkan React, Phaser,
browser, persistence, katalog kompetensi/modul/tantangan, layanan learning atau AI.

| Ekspor | Kontrak |
| --- | --- |
| `BuildingCategory` | `functional`, `economic_game`, `cosmetic` |
| `BuildingCapability` | `coin_capacity`, `passive_income`, `vehicle_requirement` |
| `BuildingDefinition` | Readonly `buildingId`, `category`, dan `capabilities?` |
| `buildingDefinitions` | Array readonly; array, setiap entri dan array capabilities dibekukan pada runtime |
| `getBuildingDefinition(id: unknown)` | Definisi atau `undefined` |
| `getBuildingCategory(id: unknown)` | Kategori atau `undefined` |
| `hasBuildingCapability(id: unknown, capability: BuildingCapability)` | Boolean; ID invalid/asing atau capability yang tidak dimiliki menghasilkan `false` |

Input adalah **`ShopItem.key` / persisted `shopKey`**, peka huruf besar-kecil.
Jangan kirim instance ID, texture key atau alias `BuildingType`. Kantor Polisi
memakai `building_xl_white`; `building_medium_blue` tetap bangunan visual.
Ejaan `building_small__yellow` dan `Streak` tetap dipertahankan.

Capabilities adalah deskripsi tipe bangunan, bukan izin melakukan aksi pada
instance tertentu. Ketiadaan capabilities berarti tidak ada fungsi khusus yang
dicatat. Kategori tidak mengganti aturan purchase, sale, upgrade atau placement.

## Klasifikasi seluruh 52 ID

| Kategori | ID bangunan |
| --- | --- |
| Functional (1) | `bank` |
| Economic/game (12) | `mini_mart`, `coffee_shop`, `donut_shop`, `pizzeria`, `gas_station`, `building_xl_white`, `hospital`, `barber_shop`, `fire_station`, `house_large_green`, `house_large_lavender`, `house_large_orange` |
| Cosmetic: bangunan visual (17) | `building_small_green`, `building_small_red`, `building_small__yellow`, `building_medium_blue`, `building_medium_gray`, `building_medium_orange`, `building_large_brown`, `building_large_teal`, `building_large_yellow`, `house_small_brown`, `house_small_red`, `house_small_yellow`, `house_medium_blue`, `house_medium_brown`, `house_medium_white`, `warehouse_brown`, `warehouse_red` |
| Cosmetic: dekorasi (22) | `fence_garden_brown`, `fence_garden_gray`, `fence_garden_white`, `fence_wire`, `fence_wood`, `light_pole_1`, `light_pole_2`, `light_pole_3`, `light_post`, `road_brick_green`, `road_brick_red`, `sidewalk`, `sign_construction_1`, `sign_info`, `sign_stop`, `sign_st_name`, `sign_st_name_double`, `sign_warning`, `Streak`, `tv_antenna_01`, `water_hydrant`, `water_tower` |

ID berasal dari aset kota melalui `src/game/shopItems.ts`. Bangunan kosmetik
tetap dihitung dalam `buildingCount`; ekonomi dan mekanik placement tidak berubah.
Kendaraan, background, awan, ikon currency dan ground tiles di luar katalog ini.
`Streak` hanya aset dalam glob dekorasi existing; tidak ada fitur learning streak.

## Fungsi existing yang dideskripsikan

| Capability | Bangunan | Implementasi otoritatif |
| --- | --- | --- |
| `coin_capacity` | Bank | `bankConfig.ts` dan ekonomi `GameScene`: kapasitas koin menurut level Bank |
| `passive_income` | Sembilan bangunan komersial/layanan, termasuk Pos Pemadam | `passiveIncomeConfig.ts`, `buildingInfo.ts`, `GameScene` |
| `vehicle_requirement` | Bank, Rumah Sakit, Kantor Polisi, tiga rumah besar | `vehicleConfig.ts` dan `vehicleUnlockLogic.ts`: level/keberadaan bangunan menjadi persyaratan kendaraan yang tersedia |

Bank dikategorikan functional karena utilitas kapasitasnya, sambil tetap mempunyai
mekanik upgrade dan persyaratan van. Pendapatan, harga, biaya upgrade dan kondisi
kelayakan tidak disalin ke katalog peran.

Pos Pemadam memiliki konfigurasi pendapatan existing, tetapi toko menyembunyikan
bangunannya. Definisi mobil pemadam masih `unavailable` dengan `assetMissing`;
karena itu tidak diberi capability `vehicle_requirement`. Metadata bukan jaminan
ketersediaan pembelian. Mekanik dan keterbatasan existing tetap utuh.

## Integrasi berikutnya dan batas kerja

Freebuff STEP 2 dapat membaca katalog melalui `shopKey` pada batas progres kota
atau consumer UI berikutnya. Gunakan ekspor ini; jangan menyalin klasifikasi ke
JSX atau GameScene. Katalog tidak memilih materi, menulis state, membuka bangunan,
mengeluarkan reward atau menghitung mastery.

`src/game/city/learningUnlocks.ts` adalah aturan toko existing yang tidak bergantung
pada katalog Step 1. Aturan tersebut dipertahankan sesuai scope revisi. Pengaturan
progres belajar → gamifikasi → kota menjadi pekerjaan Freebuff; belum ditambahkan.

Utilitas kota, shop utility atau kustomisasi dapat diperkenalkan kelak setelah
fiturnya benar-benar ada dan requirement disetujui. Tidak ada capability placeholder,
City Hall, Financial Academy, avatar customization, Streak Freeze, mystery event,
gacha, fitur streak atau integrasi AI yang ditambahkan.

## File dan persistence

Revisi hanya menyentuh dua file yang diganti nama, dokumen ini dan satu referensi
nama tes pada `package.json`. Tidak ada dependency baru, perubahan schema/storage
key/ID tersimpan, migrasi, perubahan learning services, reward, ekonomi atau AI.

Kontrak stabil: `buildingRoles.ts` beserta ekspornya. File rawan konflik meliputi
`package.json`, `GameScene.ts`, `GamePage.tsx`, `BuildingModal.tsx`, `ShopModal.tsx`,
`learningUnlocks.ts` dan layanan pembelajaran/reward. Hanya `package.json` yang
perlu diubah dalam daftar itu; seluruh file lainnya dipertahankan.

Working tree memuat pekerjaan sebelumnya yang belum di-commit. Integrasikan hanya
scope revisi ini; seluruh `git diff` repository tidak mewakili revisi Step 1.

## Validasi

```sh
node --import ./tests/register-test-loader.mjs --test --experimental-test-isolation=none tests/buildingRoles.test.mjs
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

- Focused: **15/15 lulus**. Full suite: **61/61 lulus**; baseline revisi 60/60.
- Typecheck, lint dan `git diff --check`: **lulus**.
- Tes memeriksa semua aset bangunan, kemampuan terhadap konfigurasi mekanik asli,
  ID invalid, immutability, serta snapshot mastery/currency/EXP/ownership/unlock/
  reward pada profil baru dan fixture save existing. Tes penugasan kurikulum lama
  diganti dengan pemeriksaan bahwa field/import kurikulum tidak ada.
- Worker Node terisolasi memblokir seluruh import runtime dari katalog dan akses
  `window`/`document`/`localStorage`; import dan query tetap berhasil tanpa React,
  Phaser, katalog pembelajaran, atau loader tes. Tidak ada dependensi baru.
- Production build **gagal sebelum dan sesudah revisi** dengan 12 unresolved imports
  ke `Props/Coin.jpg` / `Props/Diamond.jpg`: **PRE-EXISTING / UNRELATED**. File JPG
  telah dihapus sebelum Step 1; aset PNG untracked dan import existing tidak diubah.
  Percobaan build dengan redirection log sempat terkena `spawn EPERM` di loader
  konfigurasi Vite; eksekusi langsung `npm run build` mencapai kembali kegagalan
  aset yang sama. Tidak ada perubahan pada konfigurasi build.
- Tidak ada perubahan atau integrasi UI. Browser smoke tidak dijalankan.
