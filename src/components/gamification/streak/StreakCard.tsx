import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import streakImageUrl from '../../../../MBS_Toony_021523u/png/Props/Streak.png'

import type { StreakGiftDefinition, StreakState } from '../../../gamification/streak/streakService'

type StreakCardProps = {
  streak: StreakState
  upcomingGift: StreakGiftDefinition | undefined
  protectionAvailable: boolean
  onUseProtection: () => void
}

function getTodayKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = `${today.getMonth() + 1}`.padStart(2, '0')
  const day = `${today.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function StreakCard({
  streak,
  upcomingGift,
  protectionAvailable,
  onUseProtection,
}: StreakCardProps) {
  const isStreakAtRisk = streak.currentStreak > 0 && streak.lastActiveDate !== getTodayKey()

  return (
    <Card size="sm" className="glass-panel gap-1 py-2">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <img
          src={streakImageUrl}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <CardDescription className="text-[11px] font-semibold uppercase">
            Streak Belajar
          </CardDescription>
          <CardTitle className="text-sm font-bold">
            {streak.currentStreak} hari{streak.bestStreak > streak.currentStreak ? ` · rekor ${streak.bestStreak}` : ''}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {upcomingGift ? (
          <p className="text-[11px] font-semibold text-muted-foreground">
            Hadiah berikutnya: hari ke-{upcomingGift.streakDays}
          </p>
        ) : (
          <p className="text-[11px] font-semibold text-muted-foreground">
            Semua milestone streak telah tercapai
          </p>
        )}
        {protectionAvailable && isStreakAtRisk ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUseProtection}
            className="h-8 w-full justify-start text-xs font-semibold"
            title="Melindungi streak sekali jika besok tidak belajar"
          >
            Lindungi streak
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
