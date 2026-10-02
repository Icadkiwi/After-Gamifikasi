export type StreakGiftReveal = Readonly<{
  eventId: string
  streakDays: number
  label: string
  rewards: ReadonlyArray<{ type: 'exp' | 'coin' | 'diamond'; amount: number }>
}>

type Listener = () => void

// External store keeps the reveal outside React state so effect fan-out never
// triggers a setState-in-effect lint error; components subscribe via hooks.
let currentReveal: StreakGiftReveal | null = null
const listeners = new Set<Listener>()

function emit() {
  for (const listener of [...listeners]) listener()
}

export function getStreakGiftReveal(): StreakGiftReveal | null {
  return currentReveal
}

export function pushStreakGiftReveal(reveal: StreakGiftReveal) {
  currentReveal = Object.freeze({ ...reveal })
  emit()
}

export function clearStreakGiftReveal() {
  if (currentReveal === null) return
  currentReveal = null
  emit()
}

export function subscribeStreakGiftReveal(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
