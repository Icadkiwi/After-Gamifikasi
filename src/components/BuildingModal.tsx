import { useState } from 'react'

import type {
  BuildingModalPayload,
  BuildingType,
  CurrencyState,
} from '../game/GameEvents'
import {
  getBankUpgradeCost,
  getNextBankCapacity,
} from '../game/bankConfig'

import bankUrl from '../../MBS_Toony_021523u/png/Buildings/bank.png'
import barberShopUrl from '../../MBS_Toony_021523u/png/Buildings/barber_shop.png'
import coinUrl from '../../MBS_Toony_021523u/png/Props/Coin.jpg'

type BuildingModalProps = {
  building: BuildingModalPayload
  currency: CurrencyState
  onClose: () => void
  onUpgrade: (type: BuildingType) => void
  onUpgradePlaceable: (placeableId: string) => void
  onSell: (placeableId: string) => void
}

const maxLevel = 3

export function BuildingModal({
  building,
  currency,
  onClose,
  onUpgrade,
  onUpgradePlaceable,
  onSell,
}: BuildingModalProps) {
  const [showSellConfirm, setShowSellConfirm] = useState(false)
  const buildingType = building.type
  const isBank = buildingType === 'bank'
  const isBarber = buildingType === 'barber'
  const isGlobalBuilding = isBank || isBarber
  const level = isBank
    ? currency.bankLevel
    : isBarber
      ? currency.barberLevel
      : building.level
  const name =
    building.name ?? (isBank ? 'Bank' : isBarber ? 'Barber Shop' : 'Item')
  const imageUrl = building.imageUrl ?? (isBank ? bankUrl : barberShopUrl)
  const functionLabel = isBank
    ? 'Menyimpan coin'
    : isBarber
      ? 'Menghasilkan coin'
      : building.itemType === 'decoration'
        ? 'Dekorasi kota'
        : 'Bangunan kota'
  const statLabel = isBank ? 'Capacity' : isBarber ? 'Output' : 'Price'
  const statValue = isBank
    ? `${currency.bankCapacity.toLocaleString('id-ID')} coin`
    : isBarber
      ? `${currency.coinPerSecond} coin / second`
      : `${building.price?.toLocaleString('id-ID') ?? 0} coin`
  const progressValue = level ? (level / maxLevel) * 100 : 0
  const isMaxLevel = (level ?? 0) >= maxLevel
  const isBuildingItem = building.itemType === 'building'
  const baseCanUpgrade =
    building.canUpgrade ?? (buildingType === 'bank' || buildingType === 'barber')
  const bankUpgradeCost =
    isBank && level && !isMaxLevel ? getBankUpgradeCost(level) : undefined
  const nextBankCapacity =
    isBank && level && !isMaxLevel ? getNextBankCapacity(level) : undefined
  const hasEnoughCoinForUpgrade =
    !bankUpgradeCost || currency.coins >= bankUpgradeCost
  const canUpgrade = baseCanUpgrade && hasEnoughCoinForUpgrade
  const shouldShowUpgrade = baseCanUpgrade || isBuildingItem
  const upgradeRequirement =
    bankUpgradeCost && !hasEnoughCoinForUpgrade
      ? `Butuh ${formatNumber(bankUpgradeCost)} coin untuk upgrade Bank ke LV ${(level ?? 1) + 1}.`
      : building.upgradeRequirement
  const canSell = Boolean(
    building.placeableId && building.canSell === true && !building.isDefault,
  )
  const sellPrice = building.sellPrice ?? Math.floor((building.price ?? 1000) * 0.5)

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-end justify-center overflow-hidden rounded-md bg-sky-50">
              <img
                src={imageUrl}
                alt={name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div>
              {level && (
                <p className="text-sm font-semibold text-emerald-700">
                  LV {level} / {maxLevel}
                </p>
              )}
              <h2 className="text-xl font-semibold text-zinc-950">{name}</h2>
              <p className="text-sm text-zinc-600">{functionLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {level && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700">
                  Level Progress
                </span>
                <span className="text-zinc-500">{level} / {maxLevel}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          )}

          <div className="rounded-md border border-zinc-200 p-4">
            <p className="text-sm font-medium text-zinc-500">{statLabel}</p>
            <div className="mt-1 flex items-center gap-2">
              <img
                src={coinUrl}
                alt="Coin"
                className="h-6 w-6 rounded-full object-cover"
              />
              <span className="text-lg font-semibold text-zinc-950">
                {statValue}
              </span>
            </div>
          </div>

          {bankUpgradeCost && nextBankCapacity && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-700">
                Upgrade LV {(level ?? 1) + 1}
              </p>
              <div className="mt-2 grid gap-1 text-sm font-semibold text-zinc-800">
                <div className="flex items-center justify-between gap-3">
                  <span>Cost</span>
                  <span>{formatNumber(bankUpgradeCost)} coin</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Next Capacity</span>
                  <span>{formatNumber(nextBankCapacity)} coin</span>
                </div>
              </div>
            </div>
          )}

          {(shouldShowUpgrade || canSell) && (
            <div
              className={`building-modal-actions grid gap-3 ${
                shouldShowUpgrade && canSell ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {shouldShowUpgrade && (
                <button
                  type="button"
                  disabled={!canUpgrade || isMaxLevel}
                  onClick={() => {
                    if (buildingType && isGlobalBuilding) {
                      onUpgrade(buildingType)
                      return
                    }

                    if (building.placeableId) {
                      onUpgradePlaceable(building.placeableId)
                    }
                  }}
                  className="upgrade-button rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  {isMaxLevel
                    ? 'Max Level'
                    : bankUpgradeCost
                      ? `Upgrade - ${formatNumber(bankUpgradeCost)} coin`
                      : 'Upgrade'}
                </button>
              )}

              {canSell && building.placeableId && (
                <button
                  type="button"
                  onClick={() => setShowSellConfirm(true)}
                  className="sell-button rounded-md bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Sell
                </button>
              )}
            </div>
          )}

          {upgradeRequirement && !canUpgrade && !isMaxLevel && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              {upgradeRequirement}
            </div>
          )}

          {showSellConfirm && canSell && building.placeableId && (
            <div className="sell-confirm-box rounded-lg border border-orange-500 bg-orange-50 p-3">
              <p className="text-sm font-medium text-zinc-800">
                Are you sure you want to sell this building for{' '}
                {sellPrice.toLocaleString('id-ID')} coins?
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSell(building.placeableId as string)}
                  className="confirm-sell-button rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Confirm Sell
                </button>

                <button
                  type="button"
                  onClick={() => setShowSellConfirm(false)}
                  className="cancel-sell-button rounded-md bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('id-ID')
}
