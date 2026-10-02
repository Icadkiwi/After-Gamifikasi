export type BuildingCategory = 'functional' | 'economic_game' | 'cosmetic'

// Describes existing mechanics only; amounts and eligibility stay in game services.
export type BuildingCapability = 'coin_capacity' | 'passive_income' | 'vehicle_requirement'

export type BuildingDefinition = Readonly<{
  buildingId: string
  category: BuildingCategory
  capabilities?: readonly BuildingCapability[]
}>

// IDs are ShopItem.key / saved shopKey, never instance IDs or BuildingType aliases.
// Role metadata does not select curriculum or control purchases, unlocks or rewards.
const definitions: BuildingDefinition[] = [
  { buildingId: 'bank', category: 'functional', capabilities: ['coin_capacity', 'vehicle_requirement'] },
  { buildingId: 'mini_mart', category: 'economic_game', capabilities: ['passive_income'] },
  { buildingId: 'coffee_shop', category: 'economic_game', capabilities: ['passive_income'] },
  { buildingId: 'donut_shop', category: 'economic_game', capabilities: ['passive_income'] },
  { buildingId: 'pizzeria', category: 'economic_game', capabilities: ['passive_income'] },
  { buildingId: 'gas_station', category: 'economic_game', capabilities: ['passive_income'] },
  { buildingId: 'building_xl_white', category: 'economic_game', capabilities: ['passive_income', 'vehicle_requirement'] },
  { buildingId: 'hospital', category: 'economic_game', capabilities: ['passive_income', 'vehicle_requirement'] },
  { buildingId: 'barber_shop', category: 'economic_game', capabilities: ['passive_income'] },
  // Income exists in configuration, but the shop hides this building and its vehicle is unavailable.
  { buildingId: 'fire_station', category: 'economic_game', capabilities: ['passive_income'] },
  // Large houses satisfy existing vehicle ownership requirements.
  { buildingId: 'house_large_green', category: 'economic_game', capabilities: ['vehicle_requirement'] },
  { buildingId: 'house_large_lavender', category: 'economic_game', capabilities: ['vehicle_requirement'] },
  { buildingId: 'house_large_orange', category: 'economic_game', capabilities: ['vehicle_requirement'] },
  // Functional buildings without numeric capabilities: City Hall presents city
  // progress (CD1) and School is a navigation entry to the learning dashboard.
  // Neither controls curriculum, rewards, purchases or mastery.
  { buildingId: 'Classic City Hall Icon', category: 'functional' },
  { buildingId: 'Hand-Sketched Cartoon School Building', category: 'functional' },
  // Visual buildings have no income/upgrade metadata; they still count as buildings.
  { buildingId: 'building_small_green', category: 'cosmetic' },
  { buildingId: 'building_small_red', category: 'cosmetic' },
  { buildingId: 'building_small__yellow', category: 'cosmetic' },
  { buildingId: 'building_medium_blue', category: 'cosmetic' },
  { buildingId: 'building_medium_gray', category: 'cosmetic' },
  { buildingId: 'building_medium_orange', category: 'cosmetic' },
  { buildingId: 'building_large_brown', category: 'cosmetic' },
  { buildingId: 'building_large_teal', category: 'cosmetic' },
  { buildingId: 'building_large_yellow', category: 'cosmetic' },
  { buildingId: 'house_small_brown', category: 'cosmetic' },
  { buildingId: 'house_small_red', category: 'cosmetic' },
  { buildingId: 'house_small_yellow', category: 'cosmetic' },
  { buildingId: 'house_medium_blue', category: 'cosmetic' },
  { buildingId: 'house_medium_brown', category: 'cosmetic' },
  { buildingId: 'house_medium_white', category: 'cosmetic' },
  { buildingId: 'warehouse_brown', category: 'cosmetic' },
  { buildingId: 'warehouse_red', category: 'cosmetic' },
  // Placeable decorations from the existing shop catalog (case is significant).
  { buildingId: 'fence_garden_brown', category: 'cosmetic' },
  { buildingId: 'fence_garden_gray', category: 'cosmetic' },
  { buildingId: 'fence_garden_white', category: 'cosmetic' },
  { buildingId: 'fence_wire', category: 'cosmetic' },
  { buildingId: 'fence_wood', category: 'cosmetic' },
  { buildingId: 'light_pole_1', category: 'cosmetic' },
  { buildingId: 'light_pole_2', category: 'cosmetic' },
  { buildingId: 'light_pole_3', category: 'cosmetic' },
  { buildingId: 'light_post', category: 'cosmetic' },
  { buildingId: 'road_brick_green', category: 'cosmetic' },
  { buildingId: 'road_brick_red', category: 'cosmetic' },
  { buildingId: 'sidewalk', category: 'cosmetic' },
  { buildingId: 'sign_construction_1', category: 'cosmetic' },
  { buildingId: 'sign_info', category: 'cosmetic' },
  { buildingId: 'sign_stop', category: 'cosmetic' },
  { buildingId: 'sign_st_name', category: 'cosmetic' },
  { buildingId: 'sign_st_name_double', category: 'cosmetic' },
  { buildingId: 'sign_warning', category: 'cosmetic' },
  { buildingId: 'tv_antenna_01', category: 'cosmetic' },
  { buildingId: 'water_hydrant', category: 'cosmetic' },
  { buildingId: 'water_tower', category: 'cosmetic' },
]

// Freeze both levels so JavaScript consumers cannot change the shared read contract.
export const buildingDefinitions: readonly BuildingDefinition[] = Object.freeze(
  definitions.map((definition) => {
    if (definition.capabilities) Object.freeze(definition.capabilities)
    return Object.freeze(definition)
  }),
)

export function getBuildingDefinition(buildingId: unknown): BuildingDefinition | undefined {
  if (typeof buildingId !== 'string') return undefined
  return buildingDefinitions.find((definition) => definition.buildingId === buildingId)
}

export function getBuildingCategory(buildingId: unknown): BuildingCategory | undefined {
  return getBuildingDefinition(buildingId)?.category
}

// A capability describes a building type, not permission to execute an action on an instance.
export function hasBuildingCapability(buildingId: unknown, capability: BuildingCapability): boolean {
  return getBuildingDefinition(buildingId)?.capabilities?.includes(capability) ?? false
}
