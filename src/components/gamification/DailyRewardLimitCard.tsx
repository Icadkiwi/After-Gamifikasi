import { Info } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { DailyLimitState } from '../../game/gamificationService'

type DailyRewardLimitCardProps = {
  dailyLimit: DailyLimitState
  className?: string
  compact?: boolean
}

const dailyRewardLimitTooltip =
  'Hadiah harian maksimum yang bisa diperoleh hari ini dari misi, NPC, dan bonus. Ini bukan total EXP level atau total Koin pengguna.'

export function DailyRewardLimitCard({
  dailyLimit,
  className = '',
  compact = false,
}: DailyRewardLimitCardProps) {
  const hasEarnedRewardToday =
    dailyLimit.expEarnedToday > 0 || dailyLimit.coinEarnedToday > 0

  return (
    <Card size="sm" className={`glass-panel gap-2 py-3 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xs font-bold">
          Progres Hadiah Hari Ini
          <Tooltip>
            <TooltipTrigger
              aria-label={dailyRewardLimitTooltip}
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-black text-muted-foreground"
            >
              <Info className="size-3" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent className="max-w-60 text-xs">
              {dailyRewardLimitTooltip}
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        {!compact && (
          <CardDescription className="text-[11px] leading-snug">
            Batas hadiah harian dari misi dan bonus.
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="grid gap-2">
        {!hasEarnedRewardToday && (
          <p className="rounded-lg bg-muted px-2.5 py-2 text-[11px] font-semibold text-muted-foreground">
            Belum ada hadiah yang diklaim hari ini.
          </p>
        )}

        <RewardLimitRow
          label="EXP Didapat"
          value={dailyLimit.expEarnedToday}
          limit={dailyLimit.maxDailyExpReward}
          barClassName="[&_[data-slot=progress-indicator]]:bg-primary"
        />
        <RewardLimitRow
          label="Koin Didapat"
          value={dailyLimit.coinEarnedToday}
          limit={dailyLimit.maxDailyCoinReward}
          barClassName="[&_[data-slot=progress-indicator]]:bg-amber-400"
        />
      </CardContent>
    </Card>
  )
}

type RewardLimitRowProps = {
  label: string
  value: number
  limit: number
  barClassName: string
}

function RewardLimitRow({
  label,
  value,
  limit,
  barClassName,
}: RewardLimitRowProps) {
  const percent = limit > 0 ? Math.min((value / limit) * 100, 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-muted-foreground">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-foreground">
          {formatNumber(value)} / {formatNumber(limit)}
        </span>
      </div>
      <Progress
        value={percent}
        className={`mt-1.5 h-1.5 ${barClassName}`}
        aria-label={`${label} ${Math.round(percent)}%`}
      />
    </div>
  )
}

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('id-ID')
}
