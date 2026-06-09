import type { DailyLimitState } from '../../game/gamificationService'

type DailyRewardLimitCardProps = {
  dailyLimit: DailyLimitState
  className?: string
  compact?: boolean
}

const dailyRewardLimitTooltip =
  'Reward harian maksimum yang bisa diperoleh hari ini dari misi, NPC, dan bonus reward. Ini bukan total EXP level atau total Coin user.'

export function DailyRewardLimitCard({
  dailyLimit,
  className = '',
  compact = false,
}: DailyRewardLimitCardProps) {
  const hasEarnedRewardToday =
    dailyLimit.expEarnedToday > 0 || dailyLimit.coinEarnedToday > 0

  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white/92 p-3 shadow-sm backdrop-blur ${className}`}
      title={dailyRewardLimitTooltip}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-zinc-950">
            Today's Reward Progress
          </p>
          {!compact && (
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
              Limit reward harian dari misi dan bonus.
            </p>
          )}
        </div>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-black text-zinc-500"
          title={dailyRewardLimitTooltip}
          aria-label={dailyRewardLimitTooltip}
        >
          ?
        </span>
      </div>

      {!hasEarnedRewardToday && (
        <p className="mt-2 rounded-lg bg-zinc-50 px-2.5 py-2 text-[11px] font-semibold text-zinc-500">
          Belum ada reward yang diklaim hari ini.
        </p>
      )}

      <div className="mt-3 grid gap-2">
        <RewardLimitRow
          label="EXP Earned"
          value={dailyLimit.expEarnedToday}
          limit={dailyLimit.maxDailyExpReward}
          barClassName="bg-emerald-500"
        />
        <RewardLimitRow
          label="Coin Earned"
          value={dailyLimit.coinEarnedToday}
          limit={dailyLimit.maxDailyCoinReward}
          barClassName="bg-amber-400"
        />
      </div>
    </section>
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
    <div title={dailyRewardLimitTooltip}>
      <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-zinc-600">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-zinc-950">
          {formatNumber(value)} / {formatNumber(limit)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('id-ID')
}
