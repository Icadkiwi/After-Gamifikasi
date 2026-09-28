import { useState } from 'react'

import type { CurrencyState } from '../game/GameEvents'
import { getBuildingInfo, type BuildingInfo } from '../game/buildingInfo'
import { getShopItemSellPrice, type ShopItem } from '../game/shopItems'
import { isOwnedShopItem } from '../game/vehiclePurchaseSystem'
import { VehicleShop } from './shop/VehicleShop'

import coinUrl from '../../MBS_Toony_021523u/png/Props/Coin.jpg'
import diamondUrl from '../../MBS_Toony_021523u/png/Props/Diamond.jpg'

type ShopModalProps = {
  items: ShopItem[]
  currency: CurrencyState | null
  errorMessage: string
  purchasedItemKeys?: string[]
  soldItemKeys?: string[]
  onBuy: (item: ShopItem) => void
  onSell: (item: ShopItem) => void
  onClose: () => void
}

type ShopCategory = 'all' | 'building' | 'decoration' | 'vehicle'

export function ShopModal({
  items,
  currency,
  errorMessage,
  purchasedItemKeys = [],
  soldItemKeys = [],
  onBuy,
  onSell,
  onClose,
}: ShopModalProps) {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all')
  const [selectedInfoItem, setSelectedInfoItem] = useState<ShopItem | null>(
    null,
  )
  const [pendingPurchaseItem, setPendingPurchaseItem] =
    useState<ShopItem | null>(null)
  const [pendingSellItem, setPendingSellItem] = useState<ShopItem | null>(null)
  const selectedBuildingInfo = selectedInfoItem
    ? getBuildingInfo(selectedInfoItem.key)
    : undefined
  const shopItems = items.filter((item) => item.type !== 'ground')
  const filteredItems = shopItems.filter((item) => {
    if (activeCategory === 'all') {
      return true
    }

    return item.type === activeCategory
  })
  const buildingItems = filteredItems.filter((item) => item.type === 'building')
  const decorationItems = filteredItems.filter(
    (item) => item.type === 'decoration',
  )
  const vehicleItems = filteredItems.filter((item) => item.type === 'vehicle')

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 px-2 py-2 sm:px-4 sm:py-4">
      <div className="shop-modal flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 shadow-xl sm:h-auto sm:max-h-[80vh] sm:w-[min(900px,90vw)] sm:rounded-[14px] sm:p-5">
        <div className="shop-modal-header shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-black">Toko</h2>
              <div className="shop-coin-row mt-1 flex flex-wrap items-center gap-3 text-sm font-semibold text-black">
                <span className="flex items-center gap-2">
                  <img
                    src={coinUrl}
                    alt="Koin"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  {currency
                    ? Math.floor(currency.coins).toLocaleString('id-ID')
                    : 0}
                </span>
                <span className="flex items-center gap-2">
                  <img
                    src={diamondUrl}
                    alt="Berlian"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  {currency
                    ? Math.floor(currency.diamonds).toLocaleString('id-ID')
                    : 0}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="close-button min-h-11 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Tutup
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="shop-category-tabs mt-4 flex shrink-0 flex-wrap gap-2">
            <CategoryButton
              isActive={activeCategory === 'all'}
              label="Semua"
              onClick={() => setActiveCategory('all')}
            />
            <CategoryButton
              isActive={activeCategory === 'building'}
              label="Bangunan"
              onClick={() => setActiveCategory('building')}
            />
            <CategoryButton
              isActive={activeCategory === 'decoration'}
              label="Dekorasi"
              onClick={() => setActiveCategory('decoration')}
            />
            <CategoryButton
              isActive={activeCategory === 'vehicle'}
              label="Kendaraan"
              onClick={() => setActiveCategory('vehicle')}
            />
          </div>
        </div>

        <div className="shop-modal-content mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4 pr-1.5 sm:mt-5 sm:pb-5 sm:pr-2.5">
          <ShopSection
            title="Bangunan"
            items={buildingItems}
            currency={currency}
            purchasedItemKeys={purchasedItemKeys}
            onOpenInfo={setSelectedInfoItem}
            onBuy={setPendingPurchaseItem}
          />
          <ShopSection
            title="Dekorasi"
            items={decorationItems}
            currency={currency}
            purchasedItemKeys={purchasedItemKeys}
            onOpenInfo={setSelectedInfoItem}
            onBuy={setPendingPurchaseItem}
          />
          <VehicleShop
            items={vehicleItems}
            currency={currency}
            purchasedItemKeys={purchasedItemKeys}
            soldItemKeys={soldItemKeys}
            onBuy={setPendingPurchaseItem}
            onSell={setPendingSellItem}
          />
        </div>

        {pendingPurchaseItem && (
          <PurchaseConfirmModal
            item={pendingPurchaseItem}
            onCancel={() => setPendingPurchaseItem(null)}
            onConfirm={() => {
              onBuy(pendingPurchaseItem)
              setPendingPurchaseItem(null)
            }}
          />
        )}

        {pendingSellItem && (
          <SellConfirmModal
            item={pendingSellItem}
            onCancel={() => setPendingSellItem(null)}
            onConfirm={() => {
              onSell(pendingSellItem)
              setPendingSellItem(null)
            }}
          />
        )}

        {selectedInfoItem && selectedBuildingInfo && (
          <BuildingInfoModal
            item={selectedInfoItem}
            info={selectedBuildingInfo}
            currency={currency}
            isOwned={isOwnedShopItem(selectedInfoItem, purchasedItemKeys)}
            onBuy={(item) => {
              setSelectedInfoItem(null)
              setPendingPurchaseItem(item)
            }}
            onClose={() => setSelectedInfoItem(null)}
          />
        )}
      </div>
    </div>
  )
}

type PurchaseConfirmModalProps = {
  item: ShopItem
  onCancel: () => void
  onConfirm: () => void
}

function PurchaseConfirmModal({
  item,
  onCancel,
  onConfirm,
}: PurchaseConfirmModalProps) {
  const currencyType = item.currencyType ?? 'coin'
  const currencyLabel = currencyType === 'diamond' ? 'Berlian' : 'Koin'
  const currencyIcon = currencyType === 'diamond' ? diamondUrl : coinUrl

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 px-3 py-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-2xl sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-md bg-sky-500/20">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-emerald-400">
              Konfirmasi Pembelian
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-snug text-white">
              Beli {item.name}?
            </h3>
            <p className="mt-1 text-sm text-zinc-300">
              Setelah dikonfirmasi, barang akan masuk ke mode penempatan.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-zinc-200">
            <span>Harga</span>
            <span className="flex items-center gap-1.5">
              <img
                src={currencyIcon}
                alt={currencyLabel}
                className="h-5 w-5 rounded-full object-cover"
              />
              {item.price.toLocaleString('id-ID')} {currencyLabel}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-md bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
          >
            Beli
          </button>
        </div>
      </div>
    </div>
  )
}

type SellConfirmModalProps = {
  item: ShopItem
  onCancel: () => void
  onConfirm: () => void
}

function SellConfirmModal({
  item,
  onCancel,
  onConfirm,
}: SellConfirmModalProps) {
  const sellPrice = getShopItemSellPrice(item)
  const currencyType = item.currencyType ?? 'coin'
  const currencyLabel = currencyType === 'diamond' ? 'Berlian' : 'Koin'
  const currencyIcon = currencyType === 'diamond' ? diamondUrl : coinUrl

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 px-3 py-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-2xl sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-md bg-sky-500/20">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-red-400">
              Konfirmasi Penjualan
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-snug text-white">
              Jual {item.name}?
            </h3>
            <p className="mt-1 text-sm font-semibold text-red-400">
              Kendaraan ini hanya bisa dibeli sekali. Setelah dijual, tidak bisa
              dibeli lagi.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-red-300">
            <span>Harga jual (50%)</span>
            <span className="flex items-center gap-1.5">
              <img
                src={currencyIcon}
                alt={currencyLabel}
                className="h-5 w-5 rounded-full object-cover"
              />
              {sellPrice.toLocaleString('id-ID')} {currencyLabel}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-red-400">
            Nilai jual kembali dipotong 50% dari harga beli.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-md bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Jual
          </button>
        </div>
      </div>
    </div>
  )
}

type CategoryButtonProps = {
  isActive: boolean
  label: string
  onClick: () => void
}

function CategoryButton({ isActive, label, onClick }: CategoryButtonProps) {
  return (
    <button
      type="button"
      className={`min-h-11 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
        isActive
          ? 'active border-green-600 bg-green-600 text-white'
          : 'border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

type ShopSectionProps = {
  title: string
  items: ShopItem[]
  currency?: CurrencyState | null
  purchasedItemKeys?: string[]
  onOpenInfo: (item: ShopItem) => void
  onBuy: (item: ShopItem) => void
}

function ShopSection({
  title,
  items,
  currency,
  purchasedItemKeys = [],
  onOpenInfo,
  onBuy,
}: ShopSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="shop-section mb-6 last:mb-0">
      <h3 className="mb-3 text-base font-semibold text-black">{title}</h3>

      <div className="shop-grid grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
        {items.map((item) => (
          <ShopCard
            key={item.key}
            item={item}
            currency={currency}
            isOwned={isOwnedShopItem(item, purchasedItemKeys)}
            onOpenInfo={onOpenInfo}
            onBuy={onBuy}
          />
        ))}
      </div>
    </section>
  )
}

type ShopCardProps = {
  item: ShopItem
  currency?: CurrencyState | null
  isOwned: boolean
  onOpenInfo: (item: ShopItem) => void
  onBuy: (item: ShopItem) => void
}

function ShopCard({
  item,
  currency,
  isOwned,
  onOpenInfo,
  onBuy,
}: ShopCardProps) {
  const currencyType = item.currencyType ?? 'coin'
  const balance =
    currencyType === 'diamond' ? currency?.diamonds ?? 0 : currency?.coins ?? 0
  const canAfford = balance >= item.price
  const disabled = isOwned || !canAfford
  const buildingInfo =
    item.type === 'building' ? getBuildingInfo(item.key) : undefined

  return (
    <article className="shop-card box-border flex min-h-[232px] flex-col rounded-md border border-zinc-700 bg-zinc-900 p-2.5 text-left transition hover:border-zinc-500 hover:shadow-sm">
      <div className="relative flex h-20 items-end justify-center rounded-md bg-sky-50">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-20 max-w-full object-contain"
        />
        {buildingInfo && (
          <button
            type="button"
            onClick={() => onOpenInfo(item)}
            title={`Info ${item.name}`}
            aria-label={`Info ${item.name}`}
            className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white text-xs font-black text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50"
          >
            i
          </button>
        )}
      </div>

      <div className="mt-3 flex-1">
        <p className="text-sm font-semibold text-white">{item.name}</p>
        <p className="mt-1 text-xs font-medium uppercase text-zinc-400">
          {getItemTypeLabel(item)}
        </p>
        {item.description && (
          <p className="mt-2 line-clamp-2 text-xs text-zinc-300">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
          <img
            src={currencyType === 'diamond' ? diamondUrl : coinUrl}
            alt={currencyType === 'diamond' ? 'Berlian' : 'Koin'}
            className="h-5 w-5 rounded-full object-cover"
          />
          <span>{item.price.toLocaleString('id-ID')}</span>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onBuy(item)}
          className="min-h-10 rounded-md bg-green-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
        >
          {isOwned ? 'Dimiliki' : 'Beli'}
        </button>
      </div>
    </article>
  )
}

type BuildingInfoModalProps = {
  item: ShopItem
  info: BuildingInfo
  currency: CurrencyState | null
  isOwned: boolean
  onBuy: (item: ShopItem) => void
  onClose: () => void
}

function BuildingInfoModal({
  item,
  info,
  currency,
  isOwned,
  onBuy,
  onClose,
}: BuildingInfoModalProps) {
  const currencyType = item.currencyType ?? 'coin'
  const currencyLabel = currencyType === 'diamond' ? 'Berlian' : 'Koin'
  const currencyIcon = currencyType === 'diamond' ? diamondUrl : coinUrl
  const balance =
    currencyType === 'diamond' ? currency?.diamonds ?? 0 : currency?.coins ?? 0
  const canAfford = balance >= item.price
  const disabled = isOwned || !canAfford

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/35 px-3 py-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-2xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-md bg-sky-500/20">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-emerald-400">
                Info Bangunan
              </p>
              <h3 className="truncate text-lg font-semibold text-white">
                {item.name}
              </h3>
              <p className="text-xs font-semibold text-zinc-300">
                {info.benefitLabel}
              </p>
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

        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          {info.summary}
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-700">
          <div className="min-w-[22rem]">
            <div className="grid grid-cols-[0.7fr_1.2fr_1.1fr] bg-zinc-800 px-3 py-2 text-xs font-bold uppercase text-zinc-400">
              <span>Level</span>
              <span>Per Jam</span>
              <span>Detail</span>
            </div>
            {info.levels.map((levelInfo) => (
              <div
                key={levelInfo.level}
                className="grid grid-cols-[0.7fr_1.2fr_1.1fr] border-t border-zinc-700 px-3 py-2 text-sm"
              >
                <span className="font-bold text-white">
                  LV {levelInfo.level}
                </span>
                <span className="font-semibold text-emerald-400">
                  {formatNumber(levelInfo.incomePerHour)} koin/jam
                </span>
                <span className="text-zinc-300">{levelInfo.detail}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-zinc-400">Harga</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <img
                src={currencyIcon}
                alt={currencyLabel}
                className="h-5 w-5 rounded-full object-cover"
              />
              {item.price.toLocaleString('id-ID')} {currencyLabel}
            </p>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onBuy(item)}
            className="min-h-11 rounded-md bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-zinc-700 sm:min-w-28"
          >
            {isOwned ? 'Dimiliki' : canAfford ? 'Beli' : `${currencyLabel} kurang`}
          </button>
        </div>
      </div>
    </div>
  )
}

function getItemTypeLabel(item: ShopItem) {
  if (item.type === 'building') {
    return 'Bangunan'
  }

  if (item.type === 'vehicle') {
    return 'Kendaraan'
  }

  if (item.type === 'decoration') {
    return 'Dekorasi'
  }

  return 'Barang'
}

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('id-ID')
}
