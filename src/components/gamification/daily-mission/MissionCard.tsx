import type {
  DailyMission,
  DailyRewardLog,
} from '../../../game/gamificationService'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

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
    <Card
      size="sm"
      className={
        isClaimable
          ? 'gap-2 border-primary/40 py-2.5 shadow-md shadow-primary/10'
          : 'gap-2 py-2.5'
      }
    >
      <CardHeader className="gap-2">
        <div className="flex items-start gap-2.5">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
              mission.claimed
                ? 'bg-muted text-muted-foreground'
                : isClaimable
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}
            aria-hidden="true"
          >
            {getMissionIconLabel(mission, missionIndex)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-[13px] font-semibold leading-snug">
                  {mission.title}
                </CardTitle>
                <CardDescription className="mt-0.5 line-clamp-2 max-h-8 text-[11px] leading-4">
                  {mission.description}
                </CardDescription>
              </div>

              {mission.claimed ? (
                <Badge variant="secondary">Diklaim</Badge>
              ) : isClaimable ? (
                <Badge>Siap</Badge>
              ) : (
                <Badge className="border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Terbuka
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-2">
        <div>
          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-semibold text-muted-foreground">
            <span>
              {progress.current} / {progress.target}
            </span>
            <span className="text-right">
              {formatMissionReward(mission)}
            </span>
          </div>
          <Progress
            value={progress.percent}
            className={`h-1.5 ${
              isClaimable || mission.claimed
                ? '[&_[data-slot=progress-indicator]]:bg-primary'
                : '[&_[data-slot=progress-indicator]]:bg-amber-400'
            }`}
            aria-label={`Progres misi ${Math.round(progress.percent)}%`}
          />
        </div>

        <ClaimRewardButton
          completed={mission.completed}
          claimed={mission.claimed}
          onClaim={() => onClaimMission(mission.id)}
        />
      </CardContent>
    </Card>
  )
}
