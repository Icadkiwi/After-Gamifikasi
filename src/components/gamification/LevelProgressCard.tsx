import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { LevelProgress } from '../../gamification/rewards/gamificationService'

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
    <Card
      size="sm"
      className={`glass-panel gap-2 py-2.5 sm:py-3 ${className}`}
      title="Progres level memakai total EXP dari hadiah yang sudah diklaim."
    >
      <CardHeader>
        <CardDescription className="text-[11px] font-bold uppercase tracking-wide text-primary">
          Progres Level
        </CardDescription>
        <CardTitle className="text-base font-bold leading-tight sm:text-lg">
          Level {levelProgress.level}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm font-bold">
          {formatNumber(earnedForCurrentLevel)} /{' '}
          {formatNumber(requiredForNextLevel)} EXP
        </p>

        <Progress
          value={progressPercent}
          className="mt-2 h-2.5"
          aria-label={`Progres level ${Math.round(progressPercent)}%`}
        />

        <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
          Total EXP: {formatNumber(levelProgress.exp)}
        </p>
      </CardContent>
    </Card>
  )
}

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('id-ID')
}
