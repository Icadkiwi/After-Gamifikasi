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
    building_medium_blue: 'Police Station',
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
        price: DEFAULT_SHOP_PRICE,
        assetKey: getShopAssetKey(type, key),
        imageUrl,
      }
    })
    .filter((item) => !isHiddenShopAsset(item.key))
    .sort((a, b) => a.name.localeCompare(b.name))
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
      currencyType: 'coin',
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
