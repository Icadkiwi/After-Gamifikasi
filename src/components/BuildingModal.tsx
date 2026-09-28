import { useState, type SyntheticEvent } from 'react'

import type {
  BuildingModalPayload,
  BuildingType,
  CurrencyState,
} from '../game/GameEvents'
import {
  getBankUpgradeCost,
  getNextBankCapacity,
} from '../game/bankConfig'
import { getCityBuildingUpgradeCost } from '../game/buildingUpgradeConfig'
import { getPassiveIncomePerHourForKey } from '../game/passiveIncomeConfig'
import { getShopItemSellPrice } from '../game/shopItems'

import bankUrl from '../../MBS_Toony_021523u/png/Buildings/bank.png'
import barberShopUrl from '../../MBS_Toony_021523u/png/Buildings/barber_shop.png'
import coinUrl from '../../MBS_Toony_021523u/png/Props/Coin.jpg'
import diamondUrl from '../../MBS_Toony_021523u/png/Props/Diamond.jpg'

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
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false)
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
    building.name ?? (isBank ? 'Bank' : isBarber ? 'Toko Cukur' : 'Barang')
  const imageUrl = building.imageUrl ?? (isBank ? bankUrl : barberShopUrl)
  const functionLabel = isBank
    ? 'Menyimpan koin'
    : isBarber
      ? 'Menghasilkan koin'
      : building.itemType === 'decoration'
        ? 'Dekorasi kota'
        : 'Bangunan kota'
  const itemCurrencyType = building.currencyType ?? 'coin'
  const itemCurrencyLabel = itemCurrencyType === 'diamond' ? 'berlian' : 'koin'
  const itemCurrencyIcon = itemCurrencyType === 'diamond' ? diamondUrl : coinUrl
  const passiveIncomePerHour = getPassiveIncomePerHourForKey(
    building.shopKey,
    level,
    buildingType,
  )
  const hasPassiveIncome = passiveIncomePerHour > 0
  const statLabel = isBank
    ? 'Kapasitas'
    : hasPassiveIncome
      ? 'Pendapatan'
      : 'Harga'
  const statValue = isBank
    ? `${currency.bankCapacity.toLocaleString('id-ID')} koin`
    : hasPassiveIncome
      ? `${passiveIncomePerHour.toLocaleString('id-ID')} koin/jam`
      : `${building.price?.toLocaleString('id-ID') ?? 0} ${itemCurrencyLabel}`
  const progressValue = level ? (level / maxLevel) * 100 : 0
  const isMaxLevel = (level ?? 0) >= maxLevel
  const isBuildingItem = building.itemType === 'building'
  const baseCanUpgrade =
    building.canUpgrade ?? (buildingType === 'bank' || buildingType === 'barber')
  const hasUpgradePath =
    baseCanUpgrade || Boolean(building.upgradeRequirement && level && !isMaxLevel)
  const bankUpgradeCost =
    isBank && level && !isMaxLevel ? getBankUpgradeCost(level) : undefined
  const cityBuildingUpgradeCost =
    !isBank && level && !isMaxLevel && (isBarber || (isBuildingItem && hasUpgradePath))
      ? getCityBuildingUpgradeCost(buildingType, level)
      : undefined
  const upgradeCost = bankUpgradeCost ?? cityBuildingUpgradeCost
  const targetLevel = (level ?? 1) + 1
  const nextBankCapacity =
    isBank && level && !isMaxLevel ? getNextBankCapacity(level) : undefined
  const nextPassiveIncomePerHour =
    hasPassiveIncome && level && !isMaxLevel
      ? getPassiveIncomePerHourForKey(building.shopKey, level + 1, buildingType)
      : undefined
  const hasEnoughCoinForUpgrade =
    !upgradeCost || currency.coins >= upgradeCost
  const canUpgrade = baseCanUpgrade && hasEnoughCoinForUpgrade
  const shouldShowUpgrade = hasUpgradePath
  const upgradeRequirement = [
    upgradeCost && !hasEnoughCoinForUpgrade
      ? `Butuh ${formatNumber(upgradeCost)} koin untuk meningkatkan ke LV ${targetLevel}.`
      : undefined,
    building.upgradeRequirement,
  ].filter(Boolean).join(' ')
  const upgradeRequirementLines = splitRequirementLines(upgradeRequirement)
  const canSell = Boolean(
    building.placeableId && building.canSell === true && !building.isDefault,
  )
  const sellPrice =
    building.sellPrice ?? getShopItemSellPrice({ price: building.price ?? 1000 })

  function handleConfirmUpgrade() {
    if (!canUpgrade || isMaxLevel) {
      return
    }

    setShowUpgradeConfirm(false)

    if (buildingType && isGlobalBuilding) {
      onUpgrade(buildingType)
      return
    }

    if (building.placeableId) {
      onUpgradePlaceable(building.placeableId)
    }
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/35 px-3 py-4"
      onClick={stopModalEvent}
      onContextMenu={stopModalEvent}
      onDoubleClick={stopModalEvent}
      onMouseDown={stopModalEvent}
      onMouseUp={stopModalEvent}
      onPointerCancel={stopModalEvent}
      onPointerDown={stopModalEvent}
      onPointerMove={stopModalEvent}
      onPointerUp={stopModalEvent}
      onTouchCancel={stopModalEvent}
      onTouchEnd={stopModalEvent}
      onTouchMove={stopModalEvent}
      onTouchStart={stopModalEvent}
      onWheel={stopModalEvent}
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-md bg-sky-50 sm:h-20 sm:w-20">
              <img
                src={imageUrl}
                alt={name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              {level && (
                <p className="text-sm font-semibold text-emerald-700">
                  LV {level} / {maxLevel}
                </p>
              )}
              <h2 className="truncate text-xl font-semibold text-zinc-950">
                {name}
              </h2>
              <p className="text-sm text-zinc-600">{functionLabel}</p>
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
          {level && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700">
                  Progres Level
                </span>
                <span className="text-zinc-950">{level} / {maxLevel}</span>
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
            <p className="text-sm font-medium text-zinc-600">{statLabel}</p>
            <div className="mt-1 flex items-center gap-2">
              <img
                src={itemCurrencyIcon}
                alt={itemCurrencyLabel}
                className="h-6 w-6 rounded-full object-cover"
              />
              <span className="text-lg font-semibold text-zinc-950">
                {statValue}
              </span>
            </div>
          </div>

          {upgradeCost && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-700">
                Tingkatkan ke LV {targetLevel}
              </p>
              <div className="mt-2 grid gap-1 text-sm font-semibold text-amber-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>Biaya</span>
                  <span>{formatNumber(upgradeCost)} koin</span>
                </div>
                {nextBankCapacity && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>Kapasitas Berikutnya</span>
                    <span>{formatNumber(nextBankCapacity)} koin</span>
                  </div>
                )}
                {nextPassiveIncomePerHour && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>Pendapatan Berikutnya</span>
                    <span>
                      {nextPassiveIncomePerHour.toLocaleString('id-ID')} koin/jam
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(shouldShowUpgrade || canSell) && (
            <div
              className={`building-modal-actions grid gap-3 ${
                shouldShowUpgrade && canSell ? 'sm:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {shouldShowUpgrade && (
                <button
                  type="button"
                  disabled={!canUpgrade || isMaxLevel}
                  onClick={() => {
                    setShowSellConfirm(false)
                    setShowUpgradeConfirm(true)
                  }}
                  className="upgrade-button min-h-11 rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
                >
                  {isMaxLevel
                    ? 'Level Maksimal'
                    : upgradeCost
                      ? `Tingkatkan - ${formatNumber(upgradeCost)} koin`
                      : 'Tingkatkan'}
                </button>
              )}

              {canSell && building.placeableId && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeConfirm(false)
                    setShowSellConfirm(true)
                  }}
                  className="sell-button min-h-11 rounded-md bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Jual
                </button>
              )}
            </div>
          )}

          {showUpgradeConfirm && shouldShowUpgrade && canUpgrade && !isMaxLevel && (
            <div className="upgrade-confirm-box rounded-lg border border-emerald-500 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-800">
                Yakin ingin meningkatkan {name} ke LV {targetLevel}?
              </p>
              {upgradeCost && (
                <p className="mt-1 text-sm font-semibold text-emerald-800">
                  Biaya peningkatan: {formatNumber(upgradeCost)} koin.
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleConfirmUpgrade}
                  className="confirm-upgrade-button min-h-10 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Konfirmasi Tingkatkan
                </button>

                <button
                  type="button"
                  onClick={() => setShowUpgradeConfirm(false)}
                  className="cancel-upgrade-button min-h-10 rounded-md bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-300"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {upgradeRequirement && !canUpgrade && !isMaxLevel && (
            <div className="grid gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              {upgradeRequirementLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}

          {showSellConfirm && canSell && building.placeableId && (
            <div className="sell-confirm-box rounded-lg border border-orange-500 bg-orange-50 p-3">
              <p className="text-sm font-semibold text-red-600">
                Yakin ingin menjual item ini seharga{' '}
                {sellPrice.toLocaleString('id-ID')} {itemCurrencyLabel}? Harga
                jual adalah 50% dari harga beli.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSell(building.placeableId as string)}
                  className="confirm-sell-button min-h-10 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Konfirmasi Jual
                </button>

                <button
                  type="button"
                  onClick={() => setShowSellConfirm(false)}
                  className="cancel-sell-button min-h-10 rounded-md bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-300"
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

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('id-ID')
}

function splitRequirementLines(value: string) {
  return value
    .split(/(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function stopModalEvent(event: SyntheticEvent) {
  event.stopPropagation()
  event.nativeEvent.stopImmediatePropagation?.()
}
