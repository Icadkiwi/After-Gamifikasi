import type { GamificationSnapshot } from '../../../game/gamificationService'
import { DailyRewardLimitCard } from '../../gamification/DailyRewardLimitCard'
import { LevelProgressCard } from '../../gamification/LevelProgressCard'
import { getMissionIconLabel } from '../../gamification/daily-mission/mission-utils'

type GamificationSummaryProps = {
  gamification: GamificationSnapshot | null
}

export function GamificationSummary({
  gamification,
}: GamificationSummaryProps) {
  if (!gamification) {
    return (
      <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-zinc-950">Gamification</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Login untuk melihat level, EXP, Coin, Diamond, dan daily mission.
        </p>
      </section>
    )
  }

  const completedMissions = gamification.dailyMissions.filter(
    (mission) => mission.completed,
  ).length

  return (
    <section className="grid gap-3">
      <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-zinc-950">Gamification</h3>
            <p className="text-sm text-zinc-500">
              Ringkasan level dan reward harian.
            </p>
          </div>
          <div className="text-right text-xs font-semibold text-zinc-500">
            <p>{gamification.stats.coin.toLocaleString('id-ID')} Coin total</p>
            <p>
              {gamification.stats.diamond.toLocaleString('id-ID')} Diamond total
            </p>
          </div>
        </div>
      </div>

      <LevelProgressCard levelProgress={gamification.levelProgress} />
      <DailyRewardLimitCard dailyLimit={gamification.dailyLimit} compact />

      <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-zinc-800">Daily Mission</p>
          <p className="text-xs font-semibold text-zinc-500">
            {completedMissions} / {gamification.dailyMissions.length}
          </p>
        </div>
        <div className="mt-2 grid gap-1.5">
          {gamification.dailyMissions.slice(0, 3).map((mission, index) => (
            <div
              key={mission.id}
              className="flex items-center gap-2 text-xs text-zinc-600"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  mission.completed
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {getMissionIconLabel(mission, index)}
              </span>
              <span className="truncate">{mission.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
