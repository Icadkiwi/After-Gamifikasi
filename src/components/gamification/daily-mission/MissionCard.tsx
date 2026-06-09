import type {
  DailyMission,
  DailyRewardLog,
} from '../../../game/gamificationService'

import { ClaimRewardButton } from './ClaimRewardButton'
import {
  formatMissionReward,
  getMissionIconLabel,
  getMissionProgress,
} from './mission-utils'

type MissionCardProps = {
  mission: DailyMission
  missionIndex: number
  missions: DailyMission[]
  dailyRewardLog: DailyRewardLog
  onClaimMission: (missionId: string) => void
}

export function MissionCard({
  mission,
  missionIndex,
  missions,
  dailyRewardLog,
  onClaimMission,
}: MissionCardProps) {
  const progress = getMissionProgress(mission, missions, dailyRewardLog)
  const isClaimable = mission.completed && !mission.claimed

  return (
    <article
      className={`rounded-xl border bg-white p-2.5 shadow-sm transition duration-200 ${
        isClaimable
          ? 'border-emerald-200 shadow-emerald-500/10'
          : 'border-zinc-200'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
            mission.claimed
              ? 'bg-zinc-100 text-zinc-500'
              : isClaimable
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
          }`}
          aria-hidden="true"
        >
          {getMissionIconLabel(mission, missionIndex)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold leading-snug text-zinc-950">
                {mission.title}
              </h3>
              <p className="mt-0.5 max-h-8 overflow-hidden text-[11px] leading-4 text-zinc-500">
                {mission.description}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                mission.claimed
                  ? 'bg-zinc-100 text-zinc-500'
                  : isClaimable
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {mission.claimed ? 'Claimed' : isClaimable ? 'Ready' : 'Open'}
            </span>
          </div>

          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-semibold text-zinc-500">
              <span>
                {progress.current} / {progress.target}
              </span>
              <span className="text-right">{formatMissionReward(mission)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isClaimable || mission.claimed
                    ? 'bg-emerald-500'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          <div className="mt-2">
            <ClaimRewardButton
              completed={mission.completed}
              claimed={mission.claimed}
              onClaim={() => onClaimMission(mission.id)}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
