type DailyMissionFloatingButtonProps = {
  completedCount: number
  totalMissions: number
  hasClaimableReward: boolean
  onExpand: () => void
}

export function DailyMissionFloatingButton({
  completedCount,
  totalMissions,
  hasClaimableReward,
  onExpand,
}: DailyMissionFloatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border border-white/70 bg-white/90 px-3.5 py-2.5 text-left shadow-xl backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-0 ${
        hasClaimableReward ? 'motion-safe:animate-[rewardPulse_1.8s_ease-in-out_infinite]' : ''
      }`}
      aria-label="Buka daily mission"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
        M
        {hasClaimableReward && (
          <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-zinc-950">
          Daily Mission
        </span>
        <span className="block text-xs font-semibold text-zinc-500">
          {completedCount} / {totalMissions} selesai
        </span>
      </span>
    </button>
  )
}
