import { useMemo, useState } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { checkMysteryAnswer, getMysteryMissionForDate } from '../../../gamification/mystery/mysteryMission'
import { getTodayKey } from '../../../gamification/rewards/gamificationService'

// CD7 — Mystery Learning Mission (presentation only, no rewards attached).
// The question rotates deterministically per local day from the validated
// catalog; answering shows immediate feedback without touching mastery.
export function MysteryMissionCard() {
  const todayKey = getTodayKey()
  const mission = useMemo(() => getMysteryMissionForDate(todayKey), [todayKey])
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  if (!mission) return null

  const answered = selectedOptionId !== null
  const outcome = answered ? checkMysteryAnswer(mission, selectedOptionId) : null

  return (
    <Card size="sm" className="glass-panel gap-1 py-2">
      <CardHeader className="space-y-0 pb-1">
        <CardDescription className="text-[10px] font-bold uppercase tracking-wide text-primary">
          Misi Misteri Hari Ini
        </CardDescription>
        <CardTitle className="text-sm font-bold leading-snug">{mission.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="flex flex-col gap-1.5">
          {mission.options.map((option) => {
            const isSelected = selectedOptionId === option.id
            const isCorrectOption = option.id === mission.correctOptionId
            return (
              <button
                key={option.id}
                type="button"
                disabled={answered}
                onClick={() => setSelectedOptionId(option.id)}
                className={[
                  'min-h-9 rounded-md border px-2.5 py-1.5 text-left text-xs font-semibold transition',
                  !answered
                    ? 'border-border hover:bg-accent'
                    : isCorrectOption
                      ? 'border-emerald-400/60 bg-emerald-50 text-emerald-800'
                      : isSelected
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-border text-muted-foreground',
                ].join(' ')}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {outcome && (
          <p className="text-[11px] font-semibold text-muted-foreground">
            {outcome.correct ? 'Tepat! ' : 'Belum tepat. '}
            {mission.explanation}
          </p>
        )}
        {!answered && (
          <p className="text-[10px] font-semibold text-muted-foreground">
            Tantangan pengetahuan harian — tanpa hadiah, murni melatih intuisi finansialmu.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
