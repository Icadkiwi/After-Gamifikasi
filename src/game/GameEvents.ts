import type { ShopCurrency, ShopItem, ShopItemType } from './shopItems'

export type BuildingType =
  | 'bank'
  | 'barber'
  | 'hospital'
  | 'police_station'
  | 'fire_station'
  | 'large_house'

export type CurrencyState = {
  coins: number
  maxCoins: number
  diamonds: number
  maxDiamonds: number
  bankLevel: number
  barberLevel: number
  bankCapacity: number
  barberCoinPerHour: number
  coinPerHour: number
}

export type ShopPurchaseResult = {
  success: boolean
  message: string
  coins: number
  diamonds: number
}

export type CityProgressState = {
  buildingCount: number
  vehicleNpcCount: number
  passiveIncomePerHour: number
  cityLevel: number
}

export type BuildingModalPayload = {
  type?: BuildingType
  level?: number
  placeableId?: string
  shopKey?: string
  name?: string
  itemType?: ShopItemType
  imageUrl?: string
  price?: number
  currencyType?: ShopCurrency
  sellPrice?: number
  isDefault?: boolean
  canSell?: boolean
  canUpgrade?: boolean
  upgradeRequirement?: string
}

export type VehicleModalPayload = {
  item: ShopItem
  sellPrice: number
}

type GameEventMap = {
  CURRENCY_UPDATE: CurrencyState
  COINS_UPDATED: CurrencyState
  CITY_PROGRESS_UPDATE: CityProgressState
  GAME_SCENE_READY: Record<string, never>
  REQUEST_CITY_PROGRESS: Record<string, never>
  OPEN_BUILDING_MODAL: BuildingModalPayload
  OPEN_VEHICLE_MODAL: VehicleModalPayload
  OPEN_SHOP: Record<string, never>
  OPEN_NPC_PANEL: Record<string, never>
  SHOP_ERROR: string
  SHOP_PLACEMENT_STARTED: {
    item: ShopItem
  }
  SHOP_PLACEMENT_CONFIRM_REQUEST: {
    item: ShopItem
  }
  CONFIRM_SHOP_PLACEMENT: Record<string, never>
  CANCEL_SHOP_PLACEMENT_CONFIRM: Record<string, never>
  CANCEL_SHOP_PLACEMENT: Record<string, never>
  SHOP_PLACEMENT_CANCELLED: {
    item?: ShopItem
  }
  SHOP_PURCHASE_COMPLETED: {
    item: ShopItem
  }
  SYNC_GAME_CURRENCY: {
    coins: number
    diamonds: number
  }
  SYNC_OWNED_SHOP_ITEMS: {
    itemKeys: string[]
  }
  SHOP_PURCHASE_REQUEST: {
    item: ShopItem
    resolve: (result: ShopPurchaseResult) => void
  }
  BUY_SHOP_ITEM: {
    item: ShopItem
  }
  SELL_PLACEABLE: {
    placeableId: string
  }
  SELL_PLACED_OBJECT: {
    placeableId: string
  }
  SHOP_SELL_COMPLETED: {
    sellPrice: number
    grantedCoin: number
    grantedDiamond: number
    currency: CurrencyState
  }
  ADMIN_RESET_CURRENCY: Record<string, never>
  ADMIN_ADD_COINS: {
    amount: number
  }
  ADMIN_ADD_DIAMONDS: {
    amount: number
  }
  ADMIN_RESET_LEVELS: Record<string, never>
  ADMIN_UPGRADE_LEVELS: Record<string, never>
  ADMIN_RESET_CITY_BUILDINGS: Record<string, never>
  UPGRADE_BUILDING: {
    type: BuildingType
  }
  UPGRADE_PLACED_BUILDING: {
    placeableId: string
  }
}

export const gameEvents = new EventTarget()

export function emitGameEvent<EventName extends keyof GameEventMap>(
  eventName: EventName,
  detail: GameEventMap[EventName],
) {
  gameEvents.dispatchEvent(new CustomEvent(eventName, { detail }))
}

export function subscribeGameEvent<EventName extends keyof GameEventMap>(
  eventName: EventName,
  handler: (detail: GameEventMap[EventName]) => void,
) {
  const listener = (event: Event) => {
    handler((event as CustomEvent<GameEventMap[EventName]>).detail)
  }

  gameEvents.addEventListener(eventName, listener)

  return () => gameEvents.removeEventListener(eventName, listener)
}
