import { useEffect, useState } from 'react'

import {
  getGamificationSnapshot,
  subscribeGamification,
  type GamificationSnapshot,
} from './gamificationService'

export function useGamification(userId: string | null | undefined) {
  const [snapshot, setSnapshot] = useState<GamificationSnapshot | null>(() =>
    userId ? getGamificationSnapshot(userId) : null,
  )

  useEffect(() => {
    let isActive = true

    if (!userId) {
      queueMicrotask(() => {
        if (isActive) {
          setSnapshot(null)
        }
      })

      return () => {
        isActive = false
      }
    }

    queueMicrotask(() => {
      if (isActive) {
        setSnapshot(getGamificationSnapshot(userId))
      }
    })
    const unsubscribe = subscribeGamification(userId, setSnapshot)

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [userId])

  return snapshot
}
