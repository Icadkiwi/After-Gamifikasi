import type { ShopItem } from './shopItems'
import { isVehicleShopKey } from './vehicleConfig'

export function isVehicleShopItem(item: Pick<ShopItem, 'key' | 'type'>) {
  return item.type === 'vehicle' && isVehicleShopKey(item.key)
}

export function isOwnedShopItem(
  item: Pick<ShopItem, 'key' | 'type'>,
  purchasedItemKeys: string[],
) {
  return isVehicleShopItem(item) && purchasedItemKeys.includes(item.key)
}
