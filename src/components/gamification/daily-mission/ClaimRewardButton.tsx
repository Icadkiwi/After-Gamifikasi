import { Button } from '@/components/ui/button'

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
    <Button
      type="button"
      disabled={!isClaimable}
      onClick={onClaim}
      className={`h-10 w-full text-xs font-semibold ${
        isClaimable ? 'motion-safe:animate-[rewardPulse_1.8s_ease-in-out_infinite]' : ''
      }`}
    >
      {claimed ? 'Sudah Diambil' : isClaimable ? 'Klaim Hadiah' : 'Belum Selesai'}
    </Button>
  )
}
