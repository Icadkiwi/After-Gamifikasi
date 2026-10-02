import { useState, type SyntheticEvent } from 'react'

import type { VehicleModalPayload } from '../game/GameEvents'
import type { ShopItem } from '../game/shopItems'

import coinUrl from '../../MBS_Toony_021523u/png/Props/Coin.png'
import diamondUrl from '../../MBS_Toony_021523u/png/Props/Diamond.png'

type VehicleModalProps = {
  vehicle: VehicleModalPayload
  errorMessage?: string
  onClose: () => void
  onSell: (item: ShopItem) => void
}

export function VehicleModal({
  vehicle,
  errorMessage,
  onClose,
  onSell,
}: VehicleModalProps) {
  const [showSellConfirm, setShowSellConfirm] = useState(false)
  const item = vehicle.item
  const currencyType = item.currencyType ?? 'coin'
  const currencyIcon = currencyType === 'diamond' ? diamondUrl : coinUrl
  const currencyLabel = currencyType === 'diamond' ? 'berlian' : 'koin'

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/35 px-3 py-4"
      onClick={stopModalEvent}
      onPointerDown={stopModalEvent}
      onPointerUp={stopModalEvent}
      onTouchStart={stopModalEvent}
      onTouchEnd={stopModalEvent}
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-md bg-sky-50 sm:h-20 sm:w-20">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-700">
                Kendaraan
              </p>
              <h2 className="truncate text-xl font-semibold text-zinc-950">
                {item.name}
              </h2>
              <p className="text-sm text-zinc-600">{item.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Tutup
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <VehicleValueCard
              label="Harga Beli"
              value={item.price}
              currencyIcon={currencyIcon}
              currencyLabel={currencyLabel}
            />
            <VehicleValueCard
              label="Harga Jual (50%)"
              value={vehicle.sellPrice}
              currencyIcon={currencyIcon}
              currencyLabel={currencyLabel}
            />
          </div>

          {item.bonusDescription && (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-600">Info</p>
              <p className="mt-1 text-sm font-semibold text-zinc-950">
                {item.bonusDescription}
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSellConfirm(true)}
            className="min-h-11 w-full rounded-md bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Jual
          </button>

          {showSellConfirm && (
            <div className="rounded-lg border border-orange-500 bg-orange-50 p-3">
              <p className="text-sm font-semibold text-red-600">
                Yakin ingin menjual kendaraan ini seharga{' '}
                {vehicle.sellPrice.toLocaleString('id-ID')} {currencyLabel}?
                Harga jual adalah 50% dari harga beli.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSell(item)}
                  className="min-h-10 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Konfirmasi Jual
                </button>

                <button
                  type="button"
                  onClick={() => setShowSellConfirm(false)}
                  className="min-h-10 rounded-md bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-300"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type VehicleValueCardProps = {
  label: string
  value: number
  currencyIcon: string
  currencyLabel: string
}

function VehicleValueCard({
  label,
  value,
  currencyIcon,
  currencyLabel,
}: VehicleValueCardProps) {
  return (
    <div className="rounded-md border border-zinc-200 p-4">
      <p className="text-sm font-medium text-zinc-600">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <img
          src={currencyIcon}
          alt={currencyLabel}
          className="h-6 w-6 rounded-full object-cover"
        />
        <span className="text-lg font-semibold text-zinc-950">
          {value.toLocaleString('id-ID')} {currencyLabel}
        </span>
      </div>
    </div>
  )
}

function stopModalEvent(event: SyntheticEvent) {
  event.stopPropagation()
}
