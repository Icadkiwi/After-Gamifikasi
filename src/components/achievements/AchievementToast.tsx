import { useEffect, useState } from 'react'

import {
  ACHIEVEMENT_UNLOCKED_EVENT,
  type AchievementUnlockedPayload,
} from '../../game/achievementService'

type AchievementToastProps = {
  uid?: string | null
}

export function AchievementToast({ uid }: AchievementToastProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!uid) {
      return undefined
    }

    let timeoutId = 0
    const handleAchievementUnlocked = (event: Event) => {
      const detail = (event as CustomEvent<AchievementUnlockedPayload>).detail

      if (detail.uid !== uid) {
        return
      }

      window.clearTimeout(timeoutId)
      setMessage(`Achievement Unlocked: ${detail.achievement.title}`)
      timeoutId = window.setTimeout(() => setMessage(''), 4200)
    }

    window.addEventListener(
      ACHIEVEMENT_UNLOCKED_EVENT,
      handleAchievementUnlocked,
    )

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener(
        ACHIEVEMENT_UNLOCKED_EVENT,
        handleAchievementUnlocked,
      )
    }
  }, [uid])

  if (!uid || !message) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[1100] flex justify-center px-4">
      <div className="max-w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 shadow-2xl shadow-slate-950/20">
        {message}
      </div>
    </div>
  )
}
