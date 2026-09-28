import type { CurrencyState } from '../../game/GameEvents'
import { getShopItemSellPrice, type ShopItem } from '../../game/shopItems'
import type { VehicleUnlockState } from '../../game/vehicleUnlockLogic'

import coinUrl from '../../../MBS_Toony_021523u/png/Props/Coin.jpg'
import diamondUrl from '../../../MBS_Toony_021523u/png/Props/Diamond.jpg'

type VehicleCardProps = {
  item: ShopItem
  currency?: CurrencyState | null
  unlockState: VehicleUnlockState
  onBuy: (item: ShopItem) => void
  onSell: (item: ShopItem) => void
}

function isImportantVehicleText(text: string) {
  const normalizedText = text.trim().toLowerCase()

  return (
    normalizedText.startsWith('requires') ||
    normalizedText.startsWith('required for') ||
    normalizedText.startsWith('membutuhkan') ||
    normalizedText.startsWith('dibutuhkan') ||
    normalizedText.includes('vehicle limit')
  )
}

export function VehicleCard({
  item,
  currency,
  unlockState,
  onBuy,
  onSell,
}: VehicleCardProps) {
  const currencyType = item.currencyType ?? 'coin'
  const currencyIcon = currencyType === 'diamond' ? diamondUrl : coinUrl
  const currencyLabel = currencyType === 'diamond' ? 'Berlian' : 'Koin'
  const balance =
    currencyType === 'diamond' ? currency?.diamonds ?? 0 : currency?.coins ?? 0
  const canAfford = balance >= item.price
  const disabled = !unlockState.canBuy || !canAfford
  const sellPrice = getShopItemSellPrice(item)
  const isRequirementImportant =
    unlockState.status === 'locked' &&
    isImportantVehicleText(unlockState.requirementLabel)
  const isBonusImportant = item.bonusDescription
    ? unlockState.status === 'locked' && isImportantVehicleText(item.bonusDescription)
    : false

  return (
    <article
      className={`flex min-h-[252px] flex-col rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-500 ${
        unlockState.status === 'owned'
          ? 'border-emerald-500'
          : unlockState.status === 'sold'
            ? 'border-red-500 opacity-85'
          : unlockState.status === 'locked'
            ? 'border-zinc-700 opacity-85'
            : 'border-zinc-700 hover:border-emerald-500'
      }`}
    >
      <div className="relative flex h-24 items-end justify-center overflow-hidden rounded-xl bg-zinc-800 px-2 pb-2">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="max-h-20 max-w-full object-contain"
          />
        ) : (
          <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-zinc-600 bg-zinc-900 text-center text-[11px] font-bold text-zinc-400">
            Aset Hilang
          </div>
        )}

        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            unlockState.status === 'owned'
              ? 'bg-emerald-900 text-emerald-200'
              : unlockState.status === 'sold'
                ? 'bg-red-900 text-red-200'
              : unlockState.status === 'locked'
                ? 'bg-zinc-700 text-zinc-300'
                : 'bg-amber-900 text-amber-200'
          }`}
        >
          {unlockState.statusLabel}
        </span>
      </div>      <div className="mt-3 flex-1">
        <h3 className="text-sm font-bold leading-snug text-black">
          {item.name}
        </h3>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
          Kendaraan
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-100">
          {item.description}
        </p>
        <p
          className={`mt-2 text-[11px] font-bold ${
            isRequirementImportant ? 'text-red-400' : 'text-zinc-200'
          }`}
        >
          {unlockState.requirementLabel}
        </p>
        {item.bonusDescription && (
          <p
            className={`mt-1 text-[11px] font-bold ${
              isBonusImportant ? 'text-red-400' : 'text-zinc-200'
            }`}
          >
            {item.bonusDescription}
          </p>
        )
        }
      </div>      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-200">
          <img
            src={currencyIcon}
            alt={currencyLabel}
            className="h-5 w-5 rounded-full object-cover"
          />
          <span>{item.price.toLocaleString('id-ID')}</span>
        </div>

        {unlockState.isOwned ? (
          <button
            type="button"
            onClick={() => onSell(item)}
            className="min-h-10 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
            title={`Jual ${item.name} untuk ${sellPrice.toLocaleString('id-ID')} ${currencyLabel}`}
          >
            Jual
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onBuy(item)}
            className="min-h-10 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-700"
            title={
              unlockState.disabledReason ??
              (!canAfford ? `${currencyLabel} tidak cukup` : undefined)
            }
          >
            {unlockState.isSold ? 'Terjual' : 'Beli'}
          </button>
        )
        }
      </div>
    </article>
  )
}
