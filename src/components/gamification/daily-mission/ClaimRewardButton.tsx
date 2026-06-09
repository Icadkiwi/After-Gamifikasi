type ClaimRewardButtonProps = {
  completed: boolean
  claimed: boolean
  onClaim: () => void
}

export function ClaimRewardButton({
  completed,
  claimed,
  onClaim,
}: ClaimRewardButtonProps) {
  const isClaimable = completed && !claimed

  return (
    <button
      type="button"
      disabled={!isClaimable}
      onClick={onClaim}
      className={`min-h-8 w-full rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition duration-200 active:scale-[0.98] ${
        isClaimable
          ? 'bg-emerald-500 text-white shadow-emerald-500/25 hover:bg-emerald-600 motion-safe:animate-[rewardPulse_1.8s_ease-in-out_infinite]'
          : 'cursor-not-allowed bg-zinc-200 text-zinc-500 shadow-none'
      }`}
    >
      {claimed ? 'Sudah Diambil' : isClaimable ? 'Claim Reward' : 'Belum Selesai'}
    </button>
  )
}
