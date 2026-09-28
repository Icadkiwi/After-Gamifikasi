import {
  PASSIVE_INCOME_PER_HOUR,
  type PassiveIncomeBuildingKey,
} from './passiveIncomeConfig'

export type BuildingLevelInfo = {
  level: number
  incomePerHour: number
  detail: string
}

export type BuildingInfo = {
  summary: string
  benefitLabel: string
  levels: BuildingLevelInfo[]
  notes: string[]
}

function createIncomeLevels(key: PassiveIncomeBuildingKey) {
  return ([1, 2, 3] as const).map((level) => {
    const incomePerHour = PASSIVE_INCOME_PER_HOUR[key][level]

    return {
      level,
      incomePerHour,
      detail: `${incomePerHour} koin/jam`,
    }
  })
}

const buildingInfoByKey: Record<string, BuildingInfo> = {
  barber_shop: {
    summary:
      'Toko Cukur adalah bangunan pendapatan awal yang menghasilkan koin selama permainan aktif.',
    benefitLabel: 'Pendapatan pasif',
    levels: createIncomeLevels('barber_shop'),
    notes: [
      'Koin tetap mengikuti kapasitas Bank.',
      'Peningkatan level membuat produksi per jam semakin besar.',
    ],
  },
  coffee_shop: {
    summary:
      'Kedai Kopi membantu aktivitas ekonomi harian kota dari kunjungan warga.',
    benefitLabel: 'Pendapatan pasif',
    levels: createIncomeLevels('coffee_shop'),
    notes: ['Cocok untuk menambah variasi pusat ekonomi kota.'],
  },
  donut_shop: {
    summary:
      'Toko Donat memberi nilai ekonomi ringan dari penjualan makanan harian.',
    benefitLabel: 'Pendapatan pasif',
    levels: createIncomeLevels('donut_shop'),
    notes: ['Bangunan kecil yang cocok ditempatkan dekat area jalan utama.'],
  },
  gas_station: {
    summary:
      'Pom Bensin mendukung kendaraan dan memberi nilai ekonomi dari aktivitas transportasi.',
    benefitLabel: 'Pendapatan pasif',
    levels: createIncomeLevels('gas_station'),
    notes: ['Paling terasa ketika kota sudah punya beberapa kendaraan NPC.'],
  },
  mini_mart: {
    summary:
      'Minimarket menjadi pusat belanja kecil yang menjaga ekonomi harian tetap hidup.',
    benefitLabel: 'Pendapatan pasif',
    levels: createIncomeLevels('mini_mart'),
    notes: ['Bangunan ekonomi yang fleksibel untuk area permukiman.'],
  },
  pizzeria: {
    summary:
      'Restoran Pizza memberi potensi ekonomi lebih tinggi dari aktivitas restoran.',
    benefitLabel: 'Pendapatan pasif',
    levels: createIncomeLevels('pizzeria'),
    notes: ['Cocok sebagai bangunan ekonomi utama setelah kota mulai ramai.'],
  },
  hospital: {
    summary:
      'Rumah Sakit adalah bangunan layanan penting yang mendukung progres kota dan kendaraan Ambulans.',
    benefitLabel: 'Pendapatan pasif',
    levels: createIncomeLevels('hospital'),
    notes: [
      'LV 2 membuka syarat Ambulans.',
      'LV 3 membutuhkan Ambulans sudah dimiliki.',
    ],
  },
  building_xl_white: {
    summary:
      'Kantor Polisi adalah bangunan layanan untuk menjaga kota dan membuka progres Mobil Polisi.',
    benefitLabel: 'Pendapatan pasif',
    levels: createIncomeLevels('building_xl_white'),
    notes: [
      'LV 2 membuka syarat Mobil Polisi.',
      'LV 3 membutuhkan Mobil Polisi sudah dimiliki.',
    ],
  },
  fire_station: {
    summary:
      'Pos Pemadam adalah bangunan layanan untuk keamanan kota dan progres kendaraan pemadam.',
    benefitLabel: 'Pendapatan pasif',
    levels: createIncomeLevels('fire_station'),
    notes: [
      'LV 2 membuka syarat Mobil Pemadam.',
      'LV 3 membutuhkan Mobil Pemadam sudah dimiliki.',
    ],
  },
}

export function getBuildingInfo(key: string) {
  return buildingInfoByKey[key]
}
