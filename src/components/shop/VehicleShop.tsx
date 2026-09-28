import type { CurrencyState } from '../../game/GameEvents'
import type { ShopItem } from '../../game/shopItems'
import { getVehicleUnlockState } from '../../game/vehicleUnlockLogic'
import { VehicleCard } from './VehicleCard'

type VehicleShopProps = {
  items: ShopItem[]
  currency?: CurrencyState | null
  purchasedItemKeys: string[]
  soldItemKeys: string[]
  onBuy: (item: ShopItem) => void
  onSell: (item: ShopItem) => void
}

export function VehicleShop({
  items,
  currency,
  purchasedItemKeys,
  soldItemKeys,
  onBuy,
  onSell,
}: VehicleShopProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="shop-section mb-6 last:mb-0">
      <div className="shop-section-header mb-3">
        <h3 className="text-base font-semibold text-black">Kendaraan</h3>
        <p className="text-sm text-black">
          Beli kendaraan NPC untuk menghidupkan kota dan membuka progres
          bangunan tertentu.
        </p>
      </div>

      <div className="shop-grid grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {items.map((item) => (
          <VehicleCard
            key={item.key}
            item={item}
            currency={currency}
            unlockState={getVehicleUnlockState(
              item,
              purchasedItemKeys,
              soldItemKeys,
            )}
            onBuy={onBuy}
            onSell={onSell}
          />
        ))}
      </div>
    </section>
  )
}
