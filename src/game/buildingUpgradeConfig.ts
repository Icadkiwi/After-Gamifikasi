import type { BuildingType } from './GameEvents'

export const REGULAR_BUILDING_UPGRADE_COSTS: Record<number, number> = {
  1: 250,
  2: 500,
}

export const SERVICE_BUILDING_UPGRADE_COSTS: Record<number, number> = {
  1: 500,
  2: 1000,
}

const serviceBuildingTypes: BuildingType[] = [
  'hospital',
  'police_station',
  'fire_station',
]

export function isServiceBuildingType(buildingType?: BuildingType) {
  return buildingType ? serviceBuildingTypes.includes(buildingType) : false
}

export function getCityBuildingUpgradeCost(
  buildingType: BuildingType | undefined,
  level: number,
) {
  const costs = isServiceBuildingType(buildingType)
    ? SERVICE_BUILDING_UPGRADE_COSTS
    : REGULAR_BUILDING_UPGRADE_COSTS

  return costs[level]
}
