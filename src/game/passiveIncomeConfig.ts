export const PASSIVE_INCOME_SECONDS_PER_HOUR = 3600

export type PassiveIncomeBuildingKey =
  | 'barber_shop'
  | 'coffee_shop'
  | 'donut_shop'
  | 'mini_mart'
  | 'pizzeria'
  | 'gas_station'
  | 'fire_station'
  | 'hospital'
  | 'building_xl_white'

export const PASSIVE_INCOME_PER_HOUR: Record<
  PassiveIncomeBuildingKey,
  Record<number, number>
> = {
  barber_shop: {
    1: 5,
    2: 10,
    3: 18,
  },
  coffee_shop: {
    1: 8,
    2: 16,
    3: 28,
  },
  donut_shop: {
    1: 8,
    2: 16,
    3: 28,
  },
  mini_mart: {
    1: 12,
    2: 24,
    3: 40,
  },
  pizzeria: {
    1: 15,
    2: 30,
    3: 50,
  },
  gas_station: {
    1: 20,
    2: 40,
    3: 65,
  },
  fire_station: {
    1: 22,
    2: 45,
    3: 75,
  },
  hospital: {
    1: 25,
    2: 55,
    3: 90,
  },
  building_xl_white: {
    1: 25,
    2: 55,
    3: 90,
  },
}

export function clampPassiveIncomeLevel(level: number | undefined) {
  return Math.min(Math.max(Math.floor(level ?? 1), 1), 3)
}

export function normalizePassiveIncomeBuildingKey(
  key: string | undefined,
  buildingType?: string,
): PassiveIncomeBuildingKey | undefined {
  if (buildingType === 'barber' || key === 'barber_shop') {
    return 'barber_shop'
  }

  if (buildingType === 'hospital' || key === 'hospital') {
    return 'hospital'
  }

  if (buildingType === 'fire_station' || key === 'fire_station') {
    return 'fire_station'
  }

  if (buildingType === 'police_station' || key === 'building_xl_white') {
    return 'building_xl_white'
  }

  if (!key || !(key in PASSIVE_INCOME_PER_HOUR)) {
    return undefined
  }

  return key as PassiveIncomeBuildingKey
}

export function getPassiveIncomePerHourForKey(
  key: string | undefined,
  level: number | undefined,
  buildingType?: string,
) {
  const normalizedKey = normalizePassiveIncomeBuildingKey(key, buildingType)

  if (!normalizedKey) {
    return 0
  }

  return PASSIVE_INCOME_PER_HOUR[normalizedKey][
    clampPassiveIncomeLevel(level)
  ] ?? 0
}

export function getPassiveIncomePerSecond(totalIncomePerHour: number) {
  return totalIncomePerHour / PASSIVE_INCOME_SECONDS_PER_HOUR
}
