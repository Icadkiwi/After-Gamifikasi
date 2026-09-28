import { ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'

type DailyMissionFloatingButtonProps = {
  completedCount: number
  totalMissions: number
  hasClaimableReward: boolean
  mentorImageUrl: string
  onExpand: () => void
}

export function DailyMissionFloatingButton({
  completedCount,
  totalMissions,
  hasClaimableReward,
  mentorImageUrl,
  onExpand,
}: DailyMissionFloatingButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onExpand}
      aria-label="Buka misi harian"
      className={`glass-panel h-auto w-full justify-start gap-3 border-border bg-card/90 px-3.5 py-2.5 text-left transition hover:-translate-y-0.5 hover:bg-card ${
        hasClaimableReward
          ? 'motion-safe:animate-[rewardPulse_1.8s_ease-in-out_infinite]'
          : ''
      }`}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-end justify-center rounded-lg bg-accent px-1.5 pb-1">
        <img
          src={mentorImageUrl}
          alt="Taksi mentor"
          className="max-h-7 max-w-full object-contain"
        />
        {hasClaimableReward && (
          <span className="absolute -right-1 -top-1 size-3.5 rounded-full border-2 border-card bg-destructive" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">Misi Harian</span>
        <span className="block text-xs font-semibold text-muted-foreground">
          {completedCount} / {totalMissions} selesai
        </span>
      </span>
      <ChevronUp className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Button>
  )
}
