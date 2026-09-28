import financeBronzeBadge from '../../Free-Game-Achievement-Vector-RPG-Icons (1)/PNG/1.png'
import financeSilverBadge from '../../Free-Game-Achievement-Vector-RPG-Icons (1)/PNG/5.png'
import financeGoldBadge from '../../Free-Game-Achievement-Vector-RPG-Icons (1)/PNG/10.png'
import habitBronzeBadge from '../../Free-Game-Achievement-Vector-RPG-Icons (1)/PNG/11.png'
import habitSilverBadge from '../../Free-Game-Achievement-Vector-RPG-Icons (1)/PNG/15.png'
import habitGoldBadge from '../../Free-Game-Achievement-Vector-RPG-Icons (1)/PNG/20.png'
import cityBronzeBadge from '../../Free-Game-Achievement-Vector-RPG-Icons (1)/PNG/21.png'
import citySilverBadge from '../../Free-Game-Achievement-Vector-RPG-Icons (1)/PNG/25.png'
import cityGoldBadge from '../../Free-Game-Achievement-Vector-RPG-Icons (1)/PNG/30.png'

export type AchievementCategory = 'finance' | 'habit' | 'city'
export type AchievementTier = 'bronze' | 'silver' | 'gold'

export type AchievementProgressItemDefinition = {
  id: string
  label: string
  requiredCount?: number
  tracksUniqueDays?: boolean
}

export type AchievementReward = {
  label: string
}

export type AchievementDefinition = {
  id: string
  category: AchievementCategory
  tier: AchievementTier
  title: string
  description: string
  badgeImage: string
  requiredProgress: number
  progressItems: AchievementProgressItemDefinition[]
  reward?: AchievementReward
}

export const achievementCategories: Array<{
  id: AchievementCategory
  label: string
  description: string
}> = [
  {
    id: 'finance',
    label: 'Keuangan',
    description: 'Aktivitas pencatatan transaksi, kategori, dan arus kas.',
  },
  {
    id: 'habit',
    label: 'Kebiasaan / Perkembangan',
    description: 'Konsistensi misi harian, EXP, dan perkembangan level.',
  },
  {
    id: 'city',
    label: 'Kota / Ekonomi',
    description: 'Perkembangan kota, bangunan, kendaraan, dan ekonomi permainan.',
  },
]

export const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'finance-bronze',
    category: 'finance',
    tier: 'bronze',
    title: 'Lencana Keuangan Perunggu',
    description: 'Mulai kebiasaan mencatat transaksi keuangan pertama.',
    badgeImage: financeBronzeBadge,
    requiredProgress: 1,
    progressItems: [
      {
        id: 'finance_bronze_first_transaction',
        label: 'Tambahkan transaksi pertama',
      },
    ],
    reward: { label: 'Lencana pencatatan awal' },
  },
  {
    id: 'finance-silver',
    category: 'finance',
    tier: 'silver',
    title: 'Lencana Keuangan Perak',
    description: 'Bangun pencatatan yang lebih rapi dengan transaksi dan kategori.',
    badgeImage: financeSilverBadge,
    requiredProgress: 3,
    progressItems: [
      {
        id: 'finance_silver_total_5_transactions',
        label: 'Total 5 transaksi',
        requiredCount: 5,
      },
      {
        id: 'finance_silver_add_category',
        label: 'Tambahkan minimal 1 kategori keuangan',
      },
      {
        id: 'finance_silver_edit_transaction',
        label: 'Pernah mengubah 1 transaksi',
      },
    ],
    reward: { label: 'Lencana konsistensi keuangan' },
  },
  {
    id: 'finance-gold',
    category: 'finance',
    tier: 'gold',
    title: 'Lencana Keuangan Emas',
    description: 'Tunjukkan kontrol keuangan lewat data transaksi yang seimbang.',
    badgeImage: financeGoldBadge,
    requiredProgress: 5,
    progressItems: [
      {
        id: 'finance_gold_total_15_transactions',
        label: 'Total 15 transaksi',
        requiredCount: 15,
      },
      {
        id: 'finance_gold_10_expenses',
        label: 'Total pengeluaran minimal 10 transaksi',
        requiredCount: 10,
      },
      {
        id: 'finance_gold_3_incomes',
        label: 'Total pemasukan minimal 3 transaksi',
        requiredCount: 3,
      },
      {
        id: 'finance_gold_positive_balance',
        label: 'Saldo positif',
      },
      {
        id: 'finance_gold_delete_transaction',
        label: 'Pernah hapus 1 transaksi',
      },
    ],
    reward: { label: 'Lencana kontrol arus kas' },
  },
  {
    id: 'habit-bronze',
    category: 'habit',
    tier: 'bronze',
    title: 'Lencana Kebiasaan Perunggu',
    description: 'Selesaikan misi harian pertama untuk memulai kebiasaan finansial.',
    badgeImage: habitBronzeBadge,
    requiredProgress: 1,
    progressItems: [
      {
        id: 'habit_bronze_complete_daily_mission',
        label: 'Selesaikan 1 misi harian',
      },
    ],
    reward: { label: 'Lencana kebiasaan awal' },
  },
  {
    id: 'habit-silver',
    category: 'habit',
    tier: 'silver',
    title: 'Lencana Kebiasaan Perak',
    description: 'Klaim hadiah, selesaikan misi harian, dan capai level awal.',
    badgeImage: habitSilverBadge,
    requiredProgress: 3,
    progressItems: [
      {
        id: 'habit_silver_claim_daily_reward',
        label: 'Klaim 1 hadiah misi harian',
      },
      {
        id: 'habit_silver_complete_all_daily_missions_day',
        label: 'Selesaikan semua misi harian dalam 1 hari',
        tracksUniqueDays: true,
      },
      {
        id: 'habit_silver_reach_level_2',
        label: 'Capai level 2',
      },
    ],
    reward: { label: 'Lencana perkembangan harian' },
  },
  {
    id: 'habit-gold',
    category: 'habit',
    tier: 'gold',
    title: 'Lencana Kebiasaan Emas',
    description: 'Pertahankan konsistensi keuangan dan perkembangan dalam jangka panjang.',
    badgeImage: habitGoldBadge,
    requiredProgress: 5,
    progressItems: [
      {
        id: 'habit_gold_claim_5_daily_rewards',
        label: 'Klaim 5 hadiah misi harian',
        requiredCount: 5,
      },
      {
        id: 'habit_gold_earn_500_exp',
        label: 'Dapatkan total 500 EXP',
        requiredCount: 500,
      },
      {
        id: 'habit_gold_reach_level_5',
        label: 'Capai level 5',
      },
      {
        id: 'habit_gold_complete_all_daily_missions_3_times',
        label: 'Selesaikan semua misi harian sebanyak 3 kali',
        requiredCount: 3,
        tracksUniqueDays: true,
      },
      {
        id: 'habit_gold_track_finance_7_days',
        label: 'Catat keuangan selama 7 hari berbeda',
        requiredCount: 7,
        tracksUniqueDays: true,
      },
    ],
    reward: { label: 'Lencana konsistensi tinggi' },
  },
  {
    id: 'city-bronze',
    category: 'city',
    tier: 'bronze',
    title: 'Lencana Kota Perunggu',
    description: 'Mulai membangun kota dari pembelian bangunan pertama.',
    badgeImage: cityBronzeBadge,
    requiredProgress: 1,
    progressItems: [
      {
        id: 'city_bronze_buy_first_building',
        label: 'Beli bangunan pertama',
      },
    ],
    reward: { label: 'Lencana pembangun kota awal' },
  },
  {
    id: 'city-silver',
    category: 'city',
    tier: 'silver',
    title: 'Lencana Kota Perak',
    description: 'Kembangkan ekonomi kota dengan peningkatan dan objek tambahan.',
    badgeImage: citySilverBadge,
    requiredProgress: 3,
    progressItems: [
      {
        id: 'city_silver_bank_level_2',
        label: 'Tingkatkan Bank ke level 2',
      },
      {
        id: 'city_silver_barber_level_2',
        label: 'Tingkatkan Toko Cukur ke level 2',
      },
      {
        id: 'city_silver_3_city_objects',
        label: 'Miliki minimal 3 objek kota',
        requiredCount: 3,
      },
    ],
    reward: { label: 'Lencana perkembangan kota' },
  },
  {
    id: 'city-gold',
    category: 'city',
    tier: 'gold',
    title: 'Lencana Kota Emas',
    description: 'Capai kota yang matang dengan peningkatan, kendaraan, dan ekonomi kuat.',
    badgeImage: cityGoldBadge,
    requiredProgress: 5,
    progressItems: [
      {
        id: 'city_gold_bank_level_3',
        label: 'Tingkatkan Bank ke level 3',
      },
      {
        id: 'city_gold_barber_level_3',
        label: 'Tingkatkan Toko Cukur ke level 3',
      },
      {
        id: 'city_gold_buy_vehicle',
        label: 'Beli minimal 1 kendaraan',
      },
      {
        id: 'city_gold_earn_1000_coin',
        label: 'Dapatkan total 1000 koin',
        requiredCount: 1000,
      },
      {
        id: 'city_gold_earn_100_diamond',
        label: 'Dapatkan total 100 berlian',
        requiredCount: 100,
      },
    ],
    reward: { label: 'Lencana ekonomi kota' },
  },
]

export const achievementTierOrder: AchievementTier[] = [
  'bronze',
  'silver',
  'gold',
]
