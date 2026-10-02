export const SHOP_ITEM_SELL_RATE = 0.5
export function getShopItemSellPrice(item: { price: number }) {
  return Math.floor(Math.max(item.price, 0) * SHOP_ITEM_SELL_RATE)
}
