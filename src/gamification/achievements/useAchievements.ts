import { useEffect, useState } from 'react'

import {
  getAchievementSnapshot,
  subscribeAchievements,
  type AchievementSnapshot,
} from './achievementService'

const emptySnapshot: AchievementSnapshot = {
  achievements: [],
  unlockedCount: 0,
  totalCount: 0,
}

export function useAchievements(uid: string | null | undefined) {
  const [snapshot, setSnapshot] = useState<AchievementSnapshot>(() =>
    uid ? getAchievementSnapshot(uid) : emptySnapshot,
  )

  useEffect(() => {
    let isActive = true

    if (!uid) {
      queueMicrotask(() => {
        if (isActive) {
          setSnapshot(emptySnapshot)
        }
      })

      return () => {
        isActive = false
      }
    }

    queueMicrotask(() => {
      if (isActive) {
        setSnapshot(getAchievementSnapshot(uid))
      }
    })
    const unsubscribe = subscribeAchievements(uid, setSnapshot)

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [uid])

  return snapshot
}
