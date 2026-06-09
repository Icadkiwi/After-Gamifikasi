import type { CurrencyState } from '../../game/GameEvents'
import type { ShopItem } from '../../game/shopItems'
import { getVehicleUnlockState } from '../../game/vehicleUnlockLogic'
import { VehicleCard } from './VehicleCard'

type VehicleShopProps = {
  items: ShopItem[]
  currency?: CurrencyState | null
  purchasedItemKeys: string[]
  onBuy: (item: ShopItem) => void
}

export function VehicleShop({
  items,
  currency,
  purchasedItemKeys,
  onBuy,
}: VehicleShopProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="shop-section mb-6 last:mb-0">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-zinc-950">Vehicle</h3>
        <p className="text-sm text-zinc-500">
          Beli kendaraan NPC untuk menghidupkan kota dan membuka progression
          building tertentu.
        </p>
      </div>

      <div className="shop-grid grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {items.map((item) => (
          <VehicleCard
            key={item.key}
            item={item}
            currency={currency}
            unlockState={getVehicleUnlockState(item, purchasedItemKeys)}
            onBuy={onBuy}
          />
        ))}
      </div>
    </section>
  )
}
