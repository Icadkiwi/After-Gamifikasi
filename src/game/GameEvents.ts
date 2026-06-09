import type { ShopItem, ShopItemType } from './shopItems'

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
  barberCoinPerSecond: number
  coinPerSecond: number
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
  passiveIncomePerCycle: number
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
  sellPrice?: number
  isDefault?: boolean
  canSell?: boolean
  canUpgrade?: boolean
  upgradeRequirement?: string
}

type GameEventMap = {
  CURRENCY_UPDATE: CurrencyState
  COINS_UPDATED: CurrencyState
  CITY_PROGRESS_UPDATE: CityProgressState
  REQUEST_CITY_PROGRESS: Record<string, never>
  OPEN_BUILDING_MODAL: BuildingModalPayload
  OPEN_SHOP: Record<string, never>
  OPEN_NPC_PANEL: Record<string, never>
  SHOP_ERROR: string
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
  ADMIN_RESET_CURRENCY: Record<string, never>
  ADMIN_ADD_COINS: {
    amount: number
  }
  ADMIN_ADD_DIAMONDS: {
    amount: number
  }
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
