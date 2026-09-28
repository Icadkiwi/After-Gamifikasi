import { useEffect } from 'react'
import { toast } from 'sonner'

import {
  LEVEL_UP_REWARD_EVENT,
  type LevelUpRewardPayload,
} from '../../game/gamificationService'

import coinUrl from '../../../MBS_Toony_021523u/png/Props/Coin.jpg'
import diamondUrl from '../../../MBS_Toony_021523u/png/Props/Diamond.jpg'

type LevelUpRewardToastProps = {
  uid?: string | null
}

export function LevelUpRewardToast({ uid }: LevelUpRewardToastProps) {
  useEffect(() => {
    if (!uid) {
      return undefined
    }

    const handleLevelUpReward = (event: Event) => {
      const detail = (event as CustomEvent<LevelUpRewardPayload>).detail

      if (detail.uid !== uid) {
        return
      }

      showLevelUpToast(detail)
    }

    window.addEventListener(LEVEL_UP_REWARD_EVENT, handleLevelUpReward)

    return () => {
      window.removeEventListener(LEVEL_UP_REWARD_EVENT, handleLevelUpReward)
    }
  }, [uid])

  return null
}

function showLevelUpToast(payload: LevelUpRewardPayload) {
  toast.success(`Naik ke Level ${payload.level}!`, {
    description: `Hadiah: +${payload.reward.coin.toLocaleString('id-ID')} Koin, +${payload.reward.diamond.toLocaleString('id-ID')} Berlian`,
    icon: (
      <span className="flex items-center gap-1">
        <img src={coinUrl} alt="Koin" className="size-6 rounded-full object-cover" />
        <img
          src={diamondUrl}
          alt="Berlian"
          className="size-6 rounded-full object-cover"
        />
      </span>
    ),
    duration: 4600,
  })
}
