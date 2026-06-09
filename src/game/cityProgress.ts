import {
  subscribeGameEvent,
  type CityProgressState,
} from './GameEvents'

const shopPlaceableStorageKey = 'after-gamifikasi-shop-placeables'
const economyStorageKey = 'after-gamifikasi-economy-state'

type StoredPlaceable = {
  type?: string
  buildingType?: string
}

type StoredEconomy = {
  bankLevel?: number
  barberLevel?: number
}

export function getStoredCityProgress(): CityProgressState {
  const placeables = readJson<StoredPlaceable[]>(shopPlaceableStorageKey) ?? []
  const economy = readJson<StoredEconomy>(economyStorageKey)
  const buildingCount = placeables.filter(
    (placeable) => placeable.type === 'building' || Boolean(placeable.buildingType),
  ).length
  const barberLevel = clampLevel(economy?.barberLevel)
  const bankLevel = clampLevel(economy?.bankLevel)
  const hasBarber = placeables.some(
    (placeable) => placeable.buildingType === 'barber',
  )

  return {
    buildingCount,
    vehicleNpcCount: 0,
    passiveIncomePerCycle: hasBarber ? barberLevel : 0,
    cityLevel: Math.max(1, bankLevel + barberLevel - 1),
  }
}

export function subscribeCityProgress(
  handler: (cityProgress: CityProgressState) => void,
) {
  const unsubscribeGameEvent = subscribeGameEvent(
    'CITY_PROGRESS_UPDATE',
    handler,
  )
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === shopPlaceableStorageKey ||
      event.key === economyStorageKey
    ) {
      handler(getStoredCityProgress())
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
