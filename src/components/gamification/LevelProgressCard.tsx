import type { LevelProgress } from '../../game/gamificationService'

type LevelProgressCardProps = {
  levelProgress: LevelProgress
  className?: string
}

export function LevelProgressCard({
  levelProgress,
  className = '',
}: LevelProgressCardProps) {
  const earnedForCurrentLevel = Math.max(
    levelProgress.exp - levelProgress.currentLevelExp,
    0,
  )
  const requiredForNextLevel = Math.max(
    levelProgress.nextLevelExp - levelProgress.currentLevelExp,
    1,
  )
  const progressPercent = Math.min(
    Math.max(levelProgress.progressPercent, 0),
    100,
  )

  return (
    <section
      className={`rounded-xl border border-emerald-200 bg-white p-3 shadow-md shadow-slate-950/10 ${className}`}
      title="Progress level memakai total EXP dari reward yang sudah diklaim."
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
            Level Progress
          </p>
          <h2 className="mt-0.5 text-lg font-bold leading-tight text-zinc-950">
            Level {levelProgress.level}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-zinc-950">
            {formatNumber(earnedForCurrentLevel)} /{' '}
            {formatNumber(requiredForNextLevel)} EXP
          </p>
        </div>
      </div>

      <div
        className="mt-3 h-3 overflow-hidden rounded-full border border-zinc-300 bg-zinc-200 shadow-inner"
        aria-label={`Progress level ${Math.round(progressPercent)}%`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
      >
        <div
          className="h-full rounded-full bg-emerald-500 shadow-sm transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
            minWidth: progressPercent > 0 ? '0.5rem' : undefined,
          }}
        />
      </div>

      <p className="mt-2 text-[11px] font-semibold text-zinc-500">
        Total EXP: {formatNumber(levelProgress.exp)}
      </p>
    </section>
  )
}

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('id-ID')
}
