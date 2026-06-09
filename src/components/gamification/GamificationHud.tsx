import type {
  LevelProgress,
  UserStats,
} from '../../game/gamificationService'

import coinUrl from '../../../MBS_Toony_021523u/png/Props/Coin.jpg'
import diamondUrl from '../../../MBS_Toony_021523u/png/Props/Diamond.jpg'
import { LevelProgressCard } from './LevelProgressCard'

type GamificationHudProps = {
  stats: UserStats
  levelProgress: LevelProgress
  coinCapacity: number
  canResetCurrency: boolean
  onOpenAchievements: () => void
  onResetCurrency: () => void
  onAdminAddCoins: (amount: number) => void
  onAdminAddDiamonds: (amount: number) => void
}

export function GamificationHud({
  stats,
  levelProgress,
  coinCapacity,
  canResetCurrency,
  onOpenAchievements,
  onResetCurrency,
  onAdminAddCoins,
  onAdminAddDiamonds,
}: GamificationHudProps) {
  return (
    <aside className="absolute left-3 top-3 z-20 w-[min(18rem,calc(100vw-1.5rem))] space-y-2 sm:left-4 sm:top-4 sm:w-72">
      <LevelProgressCard levelProgress={levelProgress} />

      <div className="grid gap-2">
        <CurrencyCard
          iconUrl={coinUrl}
          label="Coin"
          value={stats.coin}
          target={coinCapacity}
        />
        <CurrencyCard
          iconUrl={diamondUrl}
          label="Diamond"
          value={stats.diamond}
          target={1000}
        />
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onOpenAchievements}
          className="rounded-md border border-emerald-200 bg-white/92 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur transition hover:bg-emerald-50"
        >
          Achievements
        </button>
      </div>

      {canResetCurrency && (
        <div className="grid gap-2 rounded-md border border-yellow-300 bg-yellow-50/95 p-2 shadow-sm backdrop-blur">
          <p className="text-[11px] font-bold uppercase text-yellow-700">
            Admin Tools
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onAdminAddCoins(500)}
              className="rounded-md border border-yellow-300 bg-yellow-400 px-2 py-2 text-xs font-bold text-zinc-950 transition hover:bg-yellow-500"
            >
              +500 Coin
            </button>
            <button
              type="button"
              onClick={() => onAdminAddDiamonds(50)}
              className="rounded-md border border-sky-200 bg-sky-500 px-2 py-2 text-xs font-bold text-white transition hover:bg-sky-600"
            >
              +50 Diamond
            </button>
          </div>
          <button
            type="button"
            onClick={onResetCurrency}
            className="rounded-md border border-red-200 bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            Reset Currency
          </button>
        </div>
      )}
    </aside>
  )
}

type CurrencyCardProps = {
  iconUrl: string
  label: string
  value: number
  target: number
}

function CurrencyCard({ iconUrl, label, value, target }: CurrencyCardProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white/92 px-3 py-2 shadow-sm backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <img
          src={iconUrl}
          alt={label}
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            {label}
          </p>
          <p className="truncate text-sm font-semibold text-zinc-950">
            {formatNumber(value)} / {formatNumber(target)}
          </p>
        </div>
      </div>
    </div>
  )
}

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('id-ID')
}
