import { vehicleDefinitions, type VehicleType } from './vehicleConfig'

export type ShopItemType = 'building' | 'decoration' | 'ground' | 'vehicle'
export type ShopCurrency = 'coin' | 'diamond'

export type ShopItem = {
  key: string
  name: string
  type: ShopItemType
  price: number
  currencyType?: ShopCurrency
  assetKey: string
  imageUrl: string
  description?: string
  vehicleType?: VehicleType
  unlockRequirement?: string
  bonusDescription?: string
  unavailable?: boolean
}

export type ShopAssetEntry = {
  assetKey: string
  imageUrl: string
}

export const DEFAULT_SHOP_PRICE = 1000
export const DECORATION_SHOP_PRICE = 50
export const SHOP_ITEM_SELL_RATE = 0.5
export const BUILDING_SHOP_PRICES: Record<string, number> = {
  bank: 0,
  barber_shop: 2500,
  coffee_shop: 2000,
  donut_shop: 2000,
  mini_mart: 2500,
  pizzeria: 3000,
  gas_station: 3500,
  hospital: 4500,
  building_xl_white: 4000,
  fire_station: 4000,
  building_small_green: 500,
  building_small_red: 500,
  building_small__yellow: 500,
  building_medium_blue: 1000,
  building_medium_gray: 1000,
  building_medium_orange: 1000,
  building_large_brown: 1800,
  building_large_teal: 1800,
  building_large_yellow: 1800,
  house_small_brown: 600,
  house_small_red: 600,
  house_small_yellow: 600,
  house_medium_blue: 1200,
  house_medium_brown: 1200,
  house_medium_white: 1200,
  house_large_green: 2000,
  house_large_lavender: 2000,
  house_large_orange: 2000,
  warehouse_brown: 1500,
  warehouse_red: 1500,
}

export function getShopItemSellPrice(item: Pick<ShopItem, 'price'>) {
  return Math.floor(Math.max(item.price, 0) * SHOP_ITEM_SELL_RATE)
}

const buildingAssets = import.meta.glob<string>(
  [
    '../../MBS_Toony_021523u/png/Buildings/*.{png,jpg,jpeg,JPG}',
    '!../../MBS_Toony_021523u/png/Buildings/*background*.{png,jpg,jpeg,JPG}',
  ],
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)
const propAssets = import.meta.glob<string>(
  [
    '../../MBS_Toony_021523u/png/Props/*.{png,jpg,jpeg,JPG}',
    '!../../MBS_Toony_021523u/png/Props/*background*.{png,jpg,jpeg,JPG}',
    '!../../MBS_Toony_021523u/png/Props/cloud_*.{png,jpg,jpeg,JPG}',
    '!../../MBS_Toony_021523u/png/Props/Coin.{png,jpg,jpeg,JPG}',
    '!../../MBS_Toony_021523u/png/Props/Diamond.{png,jpg,jpeg,JPG}',
    '!../../MBS_Toony_021523u/png/Props/christmas_lights_*.{png,jpg,jpeg,JPG}',
    '!../../MBS_Toony_021523u/png/Props/ground_street_*.{png,jpg,jpeg,JPG}',
  ],
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)
function isBackgroundAsset(key: string) {
  return key.toLowerCase().includes('background')
}

function isHiddenShopAsset(key: string) {
  const normalizedKey = key.toLowerCase()

  return (
    isBackgroundAsset(key) ||
    normalizedKey === 'bank' ||
    normalizedKey === 'coin' ||
    normalizedKey === 'diamond' ||
    normalizedKey === 'fire_station' ||
    normalizedKey.startsWith('cloud_') ||
    normalizedKey.startsWith('christmas_lights_')
  )
}

function getAssetBaseName(path: string) {
  const fileName = path.split('/').pop() ?? path

  return fileName.replace(/\.(png|jpg|jpeg)$/i, '')
}

function toKebabCase(value: string) {
  return value.replace(/_/g, '-').toLowerCase()
}

function toTitleCase(value: string) {
  const buildingNameOverrides: Record<string, string> = {
    barber_shop: 'Toko Cukur',
    building_large_brown: 'Bangunan Besar Cokelat',
    building_large_teal: 'Bangunan Besar Toska',
    building_large_yellow: 'Bangunan Besar Kuning',
    building_medium_blue: 'Bangunan Sedang Biru',
    building_medium_gray: 'Bangunan Sedang Abu-abu',
    building_medium_orange: 'Bangunan Sedang Oranye',
    building_small_green: 'Bangunan Kecil Hijau',
    building_small_red: 'Bangunan Kecil Merah',
    building_small__yellow: 'Bangunan Kecil Kuning',
    building_xl_white: 'Kantor Polisi',
    coffee_shop: 'Kedai Kopi',
    donut_shop: 'Toko Donat',
    fire_station: 'Pos Pemadam',
    gas_station: 'Pom Bensin',
    hospital: 'Rumah Sakit',
    house_large_green: 'Rumah Besar Hijau',
    house_large_lavender: 'Rumah Besar Lavender',
    house_large_orange: 'Rumah Besar Oranye',
    house_medium_blue: 'Rumah Sedang Biru',
    house_medium_brown: 'Rumah Sedang Cokelat',
    house_medium_white: 'Rumah Sedang Putih',
    house_small_brown: 'Rumah Kecil Cokelat',
    house_small_red: 'Rumah Kecil Merah',
    house_small_yellow: 'Rumah Kecil Kuning',
    mini_mart: 'Minimarket',
    pizzeria: 'Restoran Pizza',
    warehouse_brown: 'Gudang Cokelat',
    warehouse_red: 'Gudang Merah',
    water_tower: 'Menara Air',
    fence_garden_brown: 'Pagar Taman Cokelat',
    fence_garden_gray: 'Pagar Taman Abu-abu',
    fence_garden_white: 'Pagar Taman Putih',
    fence_wire: 'Pagar Kawat',
    fence_wood: 'Pagar Kayu',
    light_pole_1: 'Tiang Lampu 1',
    light_pole_2: 'Tiang Lampu 2',
    light_pole_3: 'Tiang Lampu 3',
    light_post: 'Lampu Jalan',
    road_brick_green: 'Jalan Bata Hijau',
    road_brick_red: 'Jalan Bata Merah',
    water_hydrant: 'Hidran Air',
  }

  if (buildingNameOverrides[value]) {
    return buildingNameOverrides[value]
  }

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getBuildingAssetKey(key: string) {
  if (key === 'bank') {
    return 'building-bank'
  }

  if (key === 'barber_shop') {
    return 'building-barber-shop'
  }

  return `shop-building-${toKebabCase(key)}`
}

function getPropAssetKey(key: string) {
  if (key === 'fence_wire') {
    return 'fence_wire'
  }

  return `shop-prop-${toKebabCase(key)}`
}

function getGroundAssetKey(key: string) {
  if (key === 'ground_street_01') {
    return 'ground-street-01'
  }

  if (key === 'ground_street_02') {
    return 'ground-street-02'
  }

  return `shop-ground-${toKebabCase(key)}`
}

function createShopItems(
  assets: Record<string, string>,
  type: ShopItemType,
): ShopItem[] {
  return Object.entries(assets)
    .map(([path, imageUrl]) => {
      const key = getAssetBaseName(path)

      return {
        key,
        name: toTitleCase(key),
        type,
        price: getDefaultShopItemPrice(type, key),
        assetKey: getShopAssetKey(type, key),
        imageUrl,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function getDefaultShopItemPrice(type: ShopItemType, key: string) {
  if (type === 'building') {
    return BUILDING_SHOP_PRICES[key] ?? DEFAULT_SHOP_PRICE
  }

  return type === 'decoration' ? DECORATION_SHOP_PRICE : DEFAULT_SHOP_PRICE
}

function getShopAssetKey(type: ShopItemType, key: string) {
  if (type === 'building') {
    return getBuildingAssetKey(key)
  }

  if (type === 'ground') {
    return getGroundAssetKey(key)
  }

  return getPropAssetKey(key)
}

export const shopItems: ShopItem[] = [
  ...vehicleDefinitions.map(
    (vehicle): ShopItem => ({
      key: vehicle.key,
      name: vehicle.name,
      type: 'vehicle',
      price: vehicle.price,
      currencyType: vehicle.currencyType ?? 'coin',
      assetKey: vehicle.assetKey,
      imageUrl: vehicle.imageUrl,
      description: vehicle.description,
      vehicleType: vehicle.vehicleType,
      unlockRequirement: vehicle.unlockRequirement.label,
      bonusDescription: vehicle.bonusDescription,
      unavailable: vehicle.unavailable,
    }),
  ),
  ...createShopItems(buildingAssets, 'building'),
  ...createShopItems(propAssets, 'decoration'),
]

export const visibleShopItems = shopItems.filter(
  (item) => !isHiddenShopAsset(item.key) && !item.unavailable,
)

export const shopAssetEntries: ShopAssetEntry[] = visibleShopItems.map(
  ({ assetKey, imageUrl }) => ({
    assetKey,
    imageUrl,
  }),
).filter((entry) => Boolean(entry.imageUrl))
