import type { CurrencyState } from '../../game/GameEvents'
import type { ShopItem } from '../../game/shopItems'
import type { VehicleUnlockState } from '../../game/vehicleUnlockLogic'

import coinUrl from '../../../MBS_Toony_021523u/png/Props/Coin.jpg'

type VehicleCardProps = {
  item: ShopItem
  currency?: CurrencyState | null
  unlockState: VehicleUnlockState
  onBuy: (item: ShopItem) => void
}

export function VehicleCard({
  item,
  currency,
  unlockState,
  onBuy,
}: VehicleCardProps) {
  const balance = currency?.coins ?? 0
  const canAfford = balance >= item.price
  const disabled = !unlockState.canBuy || !canAfford

  return (
    <article
      className={`flex min-h-[252px] flex-col rounded-xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        unlockState.status === 'owned'
          ? 'border-emerald-200'
          : unlockState.status === 'locked'
            ? 'border-zinc-200 opacity-85'
            : 'border-zinc-200 hover:border-emerald-200'
      }`}
    >
      <div className="relative flex h-24 items-end justify-center overflow-hidden rounded-xl bg-sky-50 px-2 pb-2">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="max-h-20 max-w-full object-contain"
          />
        ) : (
          <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-center text-[11px] font-bold text-zinc-400">
            Asset Missing
          </div>
        )}

        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            unlockState.status === 'owned'
              ? 'bg-emerald-100 text-emerald-700'
              : unlockState.status === 'locked'
                ? 'bg-zinc-200 text-zinc-600'
                : 'bg-amber-100 text-amber-700'
          }`}
        >
          {unlockState.statusLabel}
        </span>
      </div>

      <div className="mt-3 flex-1">
        <h3 className="text-sm font-bold leading-snug text-zinc-950">
          {item.name}
        </h3>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
          Vehicle
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
          {item.description}
        </p>
        <p className="mt-2 text-[11px] font-semibold text-zinc-500">
          {unlockState.requirementLabel}
        </p>
        {item.bonusDescription && (
          <p className="mt-1 text-[11px] font-semibold text-zinc-600">
            {item.bonusDescription}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-800">
          <img
            src={coinUrl}
            alt="Coin"
            className="h-5 w-5 rounded-full object-cover"
          />
          <span>{item.price.toLocaleString('id-ID')}</span>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onBuy(item)}
          className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
          title={
            unlockState.disabledReason ??
            (!canAfford ? 'Coin tidak cukup' : undefined)
          }
        >
          {unlockState.isOwned ? 'Owned' : 'Buy'}
        </button>
      </div>
    </article>
  )
}
