import { cityStorageKey } from './city/storage'
import {
  subscribeGameEvent,
  type CityProgressState,
} from './GameEvents'
import { getPassiveIncomePerHourForKey } from './passiveIncomeConfig'

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

export function getStoredCityProgress(userId: string): CityProgressState {
  const placeables = readJson<StoredPlaceable[]>(cityStorageKey(shopPlaceableStorageKey, userId)) ?? []
  const economy = readJson<StoredEconomy>(cityStorageKey(economyStorageKey, userId))
  const buildingCount = placeables.filter(
    (placeable) => placeable.type === 'building' || Boolean(placeable.buildingType),
  ).length
  const barberLevel = clampLevel(economy?.barberLevel)
  const bankLevel = clampLevel(economy?.bankLevel)
  const passiveIncomePerHour = placeables.reduce((total, placeable) => {
    const level =
      placeable.buildingType === 'barber'
        ? barberLevel
        : clampLevel(placeable.level)

    return (
      total +
      getPassiveIncomePerHourForKey(
        placeable.shopKey ?? placeable.key,
        level,
        placeable.buildingType,
      )
    )
  }, 0)

  return {
    buildingCount,
    vehicleNpcCount: 0,
    passiveIncomePerHour,
    cityLevel: Math.max(1, bankLevel + barberLevel - 1),
  }
}

export function subscribeCityProgress(
  userId: string,
  handler: (cityProgress: CityProgressState) => void,
) {
  const unsubscribeGameEvent = subscribeGameEvent(
    'CITY_PROGRESS_UPDATE',
    handler,
  )
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === cityStorageKey(shopPlaceableStorageKey, userId) ||
      event.key === cityStorageKey(economyStorageKey, userId)
    ) {
      handler(getStoredCityProgress(userId))
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    unsubscribeGameEvent()
    window.removeEventListener('storage', handleStorage)
  }
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
