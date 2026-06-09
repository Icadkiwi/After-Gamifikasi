import { useState } from 'react'

import type { CurrencyState } from '../game/GameEvents'
import type { ShopItem } from '../game/shopItems'
import { isOwnedShopItem } from '../game/vehiclePurchaseSystem'
import { VehicleShop } from './shop/VehicleShop'

import coinUrl from '../../MBS_Toony_021523u/png/Props/Coin.jpg'
import diamondUrl from '../../MBS_Toony_021523u/png/Props/Diamond.jpg'

type ShopModalProps = {
  items: ShopItem[]
  currency: CurrencyState | null
  errorMessage: string
  purchasedItemKeys?: string[]
  onBuy: (item: ShopItem) => void
  onClose: () => void
}

type ShopCategory = 'all' | 'building' | 'decoration' | 'vehicle'

export function ShopModal({
  items,
  currency,
  errorMessage,
  purchasedItemKeys = [],
  onBuy,
  onClose,
}: ShopModalProps) {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all')
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
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 px-4">
      <div className="shop-modal flex max-h-[80vh] w-[min(900px,90vw)] flex-col overflow-hidden rounded-[14px] border border-zinc-200 bg-white p-5 shadow-xl">
        <div className="shop-modal-header shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">Shop</h2>
              <div className="shop-coin-row mt-1 flex flex-wrap items-center gap-3 text-sm font-semibold text-zinc-700">
                <span className="flex items-center gap-2">
                  <img
                    src={coinUrl}
                    alt="Coin"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  {currency
                    ? Math.floor(currency.coins).toLocaleString('id-ID')
                    : 0}
                </span>
                <span className="flex items-center gap-2">
                  <img
                    src={diamondUrl}
                    alt="Diamond"
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
              className="close-button rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Close
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
              label="All"
              onClick={() => setActiveCategory('all')}
            />
            <CategoryButton
              isActive={activeCategory === 'building'}
              label="Buildings"
              onClick={() => setActiveCategory('building')}
            />
            <CategoryButton
              isActive={activeCategory === 'decoration'}
              label="Decoration"
              onClick={() => setActiveCategory('decoration')}
            />
            <CategoryButton
              isActive={activeCategory === 'vehicle'}
              label="Vehicle"
              onClick={() => setActiveCategory('vehicle')}
            />
          </div>
        </div>

        <div className="shop-modal-content mt-5 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-5 pr-2.5">
          <ShopSection
            title="Buildings"
            items={buildingItems}
            currency={currency}
            purchasedItemKeys={purchasedItemKeys}
            onBuy={onBuy}
          />
          <ShopSection
            title="Decoration"
            items={decorationItems}
            currency={currency}
            purchasedItemKeys={purchasedItemKeys}
            onBuy={onBuy}
          />
          <VehicleShop
            items={vehicleItems}
            currency={currency}
            purchasedItemKeys={purchasedItemKeys}
            onBuy={onBuy}
          />
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
      className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
        isActive
          ? 'active border-green-500 bg-green-500 text-white'
          : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
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
  onBuy: (item: ShopItem) => void
}

function ShopSection({
  title,
  items,
  currency,
  purchasedItemKeys = [],
  onBuy,
}: ShopSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="shop-section mb-6 last:mb-0">
      <h3 className="mb-3 text-base font-semibold text-zinc-950">{title}</h3>

      <div className="shop-grid grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
        {items.map((item) => (
          <ShopCard
            key={item.key}
            item={item}
            currency={currency}
            isOwned={
              isOwnedShopItem(item, purchasedItemKeys)
            }
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
  onBuy: (item: ShopItem) => void
}

function ShopCard({ item, currency, isOwned, onBuy }: ShopCardProps) {
  const currencyType = item.currencyType ?? 'coin'
  const balance =
    currencyType === 'diamond' ? currency?.diamonds ?? 0 : currency?.coins ?? 0
  const canAfford = balance >= item.price
  const disabled = isOwned || !canAfford

  return (
    <article className="shop-card box-border flex min-h-[232px] flex-col rounded-md border border-zinc-200 bg-white p-2.5 text-left transition hover:border-zinc-400 hover:shadow-sm">
      <div className="flex h-20 items-end justify-center rounded-md bg-sky-50">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-20 max-w-full object-contain"
        />
      </div>

      <div className="mt-3 flex-1">
        <p className="text-sm font-semibold text-zinc-950">{item.name}</p>
        <p className="mt-1 text-xs font-medium uppercase text-zinc-500">
          {getItemTypeLabel(item)}
        </p>
        {item.description && (
          <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
          <img
            src={currencyType === 'diamond' ? diamondUrl : coinUrl}
            alt={currencyType === 'diamond' ? 'Diamond' : 'Coin'}
            className="h-5 w-5 rounded-full object-cover"
          />
          <span>{item.price.toLocaleString('id-ID')}</span>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onBuy(item)}
          className="rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isOwned ? 'Owned' : 'Buy'}
        </button>
      </div>
    </article>
  )
}

function getItemTypeLabel(item: ShopItem) {
  if (item.type === 'building') {
    return 'Building'
  }

  if (item.type === 'vehicle') {
    return 'Vehicle'
  }

  if (item.type === 'decoration') {
    return 'Decoration'
  }

  return 'Item'
}
