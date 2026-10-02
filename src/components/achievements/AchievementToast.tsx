import { useEffect } from 'react'
import { toast } from 'sonner'

import {
  ACHIEVEMENT_UNLOCKED_EVENT,
  type Achievement,
  type AchievementUnlockedPayload,
} from '../../gamification/achievements/achievementService'

type AchievementToastProps = {
  uid?: string | null
}

export function AchievementToast({ uid }: AchievementToastProps) {
  useEffect(() => {
    if (!uid) {
      return undefined
    }

    const handleAchievementUnlocked = (event: Event) => {
      const detail = (event as CustomEvent<AchievementUnlockedPayload>).detail

      if (detail.uid !== uid) {
        return
      }

      showAchievementToast(detail.achievement)
    }

    window.addEventListener(
      ACHIEVEMENT_UNLOCKED_EVENT,
      handleAchievementUnlocked,
    )

    return () => {
      window.removeEventListener(
        ACHIEVEMENT_UNLOCKED_EVENT,
        handleAchievementUnlocked,
      )
    }
  }, [uid])

  return null
}

function showAchievementToast(achievement: Achievement) {
  toast.success('Pencapaian Terbuka!', {
    description: achievement.title,
    icon: (
      <img
        src={achievement.badgeImage}
        alt={achievement.title}
        className="size-10 object-contain"
      />
    ),
    duration: 4200,
  })
}
