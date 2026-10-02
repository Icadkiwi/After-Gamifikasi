import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import streakImageUrl from '../../../../MBS_Toony_021523u/png/Props/Streak.png'

import type { StreakGiftReveal } from '../../../gamification/streak/useStreakGamification'

const rewardTypeLabels: Record<StreakGiftReveal['rewards'][number]['type'], string> = {
  exp: 'EXP',
  coin: 'Koin',
  diamond: 'Berlian',
}

type StreakGiftToastProps = {
  reveal: StreakGiftReveal
  onClose: () => void
}

export function StreakGiftToast({ reveal, onClose }: StreakGiftToastProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 150)
    return () => clearTimeout(timer)
  }, [])

  function handleReveal() {
    setIsRevealed(true)
  }

  return (
    <div className="absolute left-1/2 top-16 z-30 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2">
      <Card className="glass-panel border-amber-400/60 shadow-lg motion-safe:animate-[rewardPulse_1.8s_ease-in-out_infinite]">
        <CardHeader className="items-center gap-1 pb-2 text-center">
          <img
            src={streakImageUrl}
            alt=""
            aria-hidden="true"
            className="mx-auto h-10 w-10 object-contain"
          />
          <CardTitle className="text-base font-bold">
            {isRevealed ? `Hadiah Misteri Dibuka!` : 'Hadiah Misteri Siap Dibuka'}
          </CardTitle>
          <CardDescription className="text-xs font-semibold">
            Milestone streak hari ke-{reveal.streakDays}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isRevealed ? (
            <>
              <p className="text-center text-sm font-bold text-foreground">{reveal.label}</p>
              <ul className="flex flex-wrap justify-center gap-2">
                {reveal.rewards.map((reward) => (
                  <li
                    key={reward.type}
                    className="rounded-full bg-accent px-3 py-1 text-xs font-bold"
                  >
                    +{reward.amount} {rewardTypeLabels[reward.type] ?? reward.type}
                  </li>
                ))}
              </ul>
              <Button type="button" onClick={onClose} className="min-h-9 w-full font-semibold">
                Lanjutkan
              </Button>
            </>
          ) : (
            <Button type="button" onClick={handleReveal} className="min-h-9 w-full font-semibold">
              Buka Hadiah
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
