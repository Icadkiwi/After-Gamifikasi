import coinUrl from '../../../MBS_Toony_021523u/png/Props/Coin.jpg'
import diamondUrl from '../../../MBS_Toony_021523u/png/Props/Diamond.jpg'

import { ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

import type {
  LevelProgress,
  UserStats,
} from '../../game/gamificationService'

import { LevelProgressCard } from './LevelProgressCard'

type GamificationHudProps = {
  stats: UserStats
  levelProgress: LevelProgress
  coinCapacity: number
  canResetCurrency: boolean
  onOpenAchievements: () => void
  onOpenAdminTools: () => void
}

export function GamificationHud({
  stats,
  levelProgress,
  coinCapacity,
  canResetCurrency,
  onOpenAchievements,
  onOpenAdminTools,
}: GamificationHudProps) {
  return (
    <aside className="absolute left-2 top-2 z-20 w-[min(12.5rem,calc(100vw-1rem))] space-y-1.5 sm:left-4 sm:top-4 sm:w-72 sm:space-y-2">
      <LevelProgressCard levelProgress={levelProgress} />

      <div className="grid gap-2">
        <CurrencyCard
          icon={<img src={coinUrl} alt="Koin" className="size-4 object-contain" />}
          label="Koin"
          value={stats.coin}
          target={coinCapacity}
          progressClassName="[&_[data-slot=progress-indicator]]:bg-amber-400"
        />
        <CurrencyCard
          icon={<img src={diamondUrl} alt="Berlian" className="size-4 object-contain" />}
          label="Berlian"
          value={stats.diamond}
          target={1000}
          progressClassName="[&_[data-slot=progress-indicator]]:bg-sky-400"
        />
      </div>

      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          className="glass-panel justify-start gap-2 border-border bg-card/90 font-semibold text-primary hover:bg-accent hover:text-accent-foreground"
          onClick={onOpenAchievements}
        >
          Pencapaian
        </Button>
      </div>

      {canResetCurrency && (
        <Card size="sm" className="glass-panel gap-2 border-amber-500/40">
          <CardHeader>
            <CardDescription className="text-[11px] font-bold uppercase text-amber-500">
              Alat Admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-start gap-2 font-semibold"
              onClick={onOpenAdminTools}
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              Kontrol Admin
            </Button>
          </CardContent>
        </Card>
      )}
    </aside>
  )
}

type CurrencyCardProps = {
  icon: React.ReactNode
  label: string
  value: number
  target: number
  progressClassName?: string
}

function CurrencyCard({
  icon,
  label,
  value,
  target,
  progressClassName,
}: CurrencyCardProps) {
  const percent = target > 0 ? Math.min((value / target) * 100, 100) : 0

  return (
    <Card size="sm" className="glass-panel gap-1 py-2">
      <CardContent className="flex min-w-0 items-center gap-2">
        {icon}
        <div className="min-w-0 flex-1">
          <CardDescription className="text-[11px] font-semibold uppercase">
            {label}
          </CardDescription>
          <CardTitle className="truncate text-sm font-bold">
            {formatNumber(value)} / {formatNumber(target)}
          </CardTitle>
          <Progress
            value={percent}
            className={`mt-1 h-1 ${progressClassName ?? ''}`}
            aria-label={`Progres ${label} ${Math.round(percent)}%`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('id-ID')
}
