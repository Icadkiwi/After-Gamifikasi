import type { ShopItem } from './shopItems'
import {
  getVehicleDefinitionByKey,
  vehicleDefinitions,
  type VehicleType,
} from './vehicleConfig'

const shopPlaceableStorageKey = 'after-gamifikasi-shop-placeables'
const economyStorageKey = 'after-gamifikasi-economy-state'

type StoredPlaceable = {
  key?: string
  shopKey?: string
  type?: string
  buildingType?: string
  level?: number
}

type StoredEconomy = {
  bankLevel?: number
  barberLevel?: number
}

export type VehicleUnlockState = {
  status: 'locked' | 'available' | 'owned' | 'sold'
  canBuy: boolean
  isOwned: boolean
  isSold: boolean
  requirementLabel: string
  statusLabel: string
  disabledReason?: string
}

export function getVehicleUnlockState(
  item: ShopItem,
  purchasedItemKeys: string[],
  soldItemKeys: string[] = [],
): VehicleUnlockState {
  const definition = getVehicleDefinitionByKey(item.key)
  const isOwned = purchasedItemKeys.includes(item.key)
  const isSold = soldItemKeys.includes(item.key)

  if (!definition || item.type !== 'vehicle') {
    return {
      status: 'available',
      canBuy: true,
      isOwned: false,
      isSold: false,
      requirementLabel: 'Tersedia',
      statusLabel: 'Tersedia',
    }
  }

  if (isOwned) {
    return {
      status: 'owned',
      canBuy: false,
      isOwned: true,
      isSold: false,
      requirementLabel: definition.unlockRequirement.label,
      statusLabel: 'Dimiliki',
    }
  }

  if (isSold) {
    return {
      status: 'sold',
      canBuy: false,
      isOwned: false,
      isSold: true,
      requirementLabel: definition.unlockRequirement.label,
      statusLabel: 'Terjual',
      disabledReason: 'Kendaraan ini sudah pernah dibeli dan dijual.',
    }
  }

  if (definition.unavailable) {
    return {
      status: 'locked',
      canBuy: false,
      isOwned: false,
      isSold: false,
      requirementLabel: definition.unlockRequirement.label,
      statusLabel: 'Terkunci',
      disabledReason: definition.unlockRequirement.label,
    }
  }

  if (definition.limitGroup) {
    const ownedVehicleInLimitGroup = vehicleDefinitions.some(
      (vehicle) =>
        vehicle.limitGroup === definition.limitGroup &&
        purchasedItemKeys.includes(vehicle.key),
    )

    if (ownedVehicleInLimitGroup) {
      return {
        status: 'locked',
        canBuy: false,
        isOwned: false,
        isSold: false,
        requirementLabel: `Batas 1 kendaraan untuk ${definition.unlockRequirement.label.toLowerCase()}`,
        statusLabel: 'Terkunci',
        disabledReason: 'Batas kendaraan sudah tercapai.',
      }
    }
  }

  const requirementMet = isVehicleRequirementMet(definition.vehicleType)

  if (!requirementMet) {
    return {
      status: 'locked',
      canBuy: false,
      isOwned: false,
      isSold: false,
      requirementLabel: definition.unlockRequirement.label,
      statusLabel: 'Terkunci',
      disabledReason: definition.unlockRequirement.label,
    }
  }

  return {
    status: 'available',
    canBuy: true,
    isOwned: false,
    isSold: false,
    requirementLabel: definition.unlockRequirement.label,
    statusLabel: 'Tersedia',
  }
}

export function isVehicleRequirementMet(vehicleType: VehicleType) {
  const definition = vehicleDefinitions.find(
    (vehicle) => vehicle.vehicleType === vehicleType,
  )

  if (!definition) {
    return false
  }

  const requirement = definition.unlockRequirement

  if (requirement.type === 'none') {
    return true
  }

  if (requirement.type === 'assetMissing') {
    return false
  }

  if (requirement.type === 'buildingAvailable') {
    return hasBuilding(requirement.buildingKey)
  }

  return getBuildingLevel(requirement.buildingKey) >= requirement.level
}

export function getBuildingLevel(buildingKey: string) {
  const economy = readJson<StoredEconomy>(economyStorageKey)

  if (buildingKey === 'bank') {
    return clampLevel(economy?.bankLevel)
  }

  if (buildingKey === 'barber') {
    return clampLevel(economy?.barberLevel)
  }

  const placeables = readJson<StoredPlaceable[]>(shopPlaceableStorageKey) ?? []
  const matchingLevels = placeables
    .filter((placeable) => isMatchingBuilding(placeable, buildingKey))
    .map((placeable) => clampLevel(placeable.level))

  return matchingLevels.length > 0 ? Math.max(...matchingLevels) : 0
}

export function hasBuilding(buildingKey: string) {
  if (buildingKey === 'bank' || buildingKey === 'barber') {
    return getBuildingLevel(buildingKey) > 0
  }

  const placeables = readJson<StoredPlaceable[]>(shopPlaceableStorageKey) ?? []

  return placeables.some((placeable) => isMatchingBuilding(placeable, buildingKey))
}

export function getRequiredVehicleForBuildingLevel3(
  buildingKey: string | undefined,
): VehicleType | null {
  if (buildingKey === 'hospital') {
    return 'ambulance'
  }

  if (buildingKey === 'police_station') {
    return 'police_car'
  }

  if (buildingKey === 'fire_station') {
    return 'fire_truck'
  }

  return null
}

export function getOwnedVehicleTypes(purchasedItemKeys: string[]) {
  return purchasedItemKeys.flatMap((key) => {
    const definition = getVehicleDefinitionByKey(key)

    return definition ? [definition.vehicleType] : []
  })
}

export function isMatchingBuilding(
  placeable: StoredPlaceable,
  buildingKey: string,
) {
  const key = placeable.shopKey ?? placeable.key ?? ''
  const buildingType = placeable.buildingType ?? ''

  if (buildingKey === 'large_house' || buildingKey === 'house_large') {
    return key.startsWith('house_large') || buildingType === 'large_house'
  }

  if (buildingKey === 'police_station') {
    return (
      key === 'police_station' ||
      key === 'building_xl_white' ||
      (key !== 'building_medium_blue' && buildingType === 'police_station')
    )
  }

  return key === buildingKey || buildingType === buildingKey
}

function readJson<T>(key: string) {
  try {
    const rawValue = localStorage.getItem(key)

    if (!rawValue) {
      return null
    }

    return JSON.parse(rawValue) as T
  } catch {
    return null
  }
}

function clampLevel(level: number | undefined) {
  return Math.min(Math.max(Math.floor(level ?? 1), 1), 3)
}
