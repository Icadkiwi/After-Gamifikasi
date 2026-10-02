import { useCallback, useSyncExternalStore } from 'react'

import {
  applyStreakProtection,
  getNextStreakGift,
  getStreakState,
  STREAK_UPDATED_EVENT,
} from './streakService'
import {
  clearStreakGiftReveal,
  getStreakGiftReveal,
  subscribeStreakGiftReveal as subscribeRevealStore,
} from './giftRevealStore'

function subscribeStreakUpdates(notify: () => void) {
  window.addEventListener(STREAK_UPDATED_EVENT, notify)
  return () => window.removeEventListener(STREAK_UPDATED_EVENT, notify)
}

function subscribeReveal(notify: () => void) {
  return subscribeRevealStore(notify)
}

// Read-only observer of the deterministic streak service. The authoritative
// streak day and gift grants happen in the learning service layer
// (syncStreakFromLearningProfile), never during React render.
export function useStreakGamification(userId: string) {
  const streak = useSyncExternalStore(
    subscribeStreakUpdates,
    () => (userId ? getStreakState(userId) : null),
    () => null,
  )

  const reveal = useSyncExternalStore(
    subscribeReveal,
    getStreakGiftReveal,
    () => null,
  )

  const protectStreak = useCallback(() => {
    if (!userId) return false
    return applyStreakProtection(userId).used
  }, [userId])

  const dismissReveal = useCallback(() => clearStreakGiftReveal(), [])

  const upcomingGift = streak ? getNextStreakGift(streak.currentStreak) : undefined

  return { streak, upcomingGift, reveal, dismissReveal, protectStreak }
}

export type { StreakState } from './streakService'
export type { StreakGiftReveal } from './giftRevealStore'
