import { cityStorageKey } from '../../game/city/storage'
import { pushStreakGiftReveal } from './giftRevealStore'
import { getLocalDateKey } from '../../utils/date'
import {
  getTodayKey,
  getUserStats,
  grantLearningCompletionReward,
} from '../rewards/gamificationService'
import type { RewardGrant } from '../rewards/gamificationService'

// One local calendar day boundary, consistent with the rest of the app
// (mission daily reset uses the same local-day rule).
const DAY_MS = 24 * 60 * 60 * 1000

export const STREAK_UPDATED_EVENT = 'after-gamifikasi:streak-updated'

export type StreakState = {
  schemaVersion: 1
  userId: string
  currentStreak: number
  bestStreak: number
  lastActiveDate: string | null
  protectionUsedDate: string | null
  grantedMilestoneReceipts: string[]
}

export type StreakGiftDefinition = Readonly<{
  streakDays: number
  label: string
  rewards: readonly RewardGrant[]
}>

// Predetermined, deterministic gifts. The user does not see the identity of the
// reward before the reveal, but the outcome is never chance-based.
export const streakGifts: readonly StreakGiftDefinition[] = Object.freeze([
  { streakDays: 3, label: 'Hadiah Misteri Hari ke-3', rewards: [{ type: 'diamond', amount: 20 }] },
  { streakDays: 7, label: 'Hadiah Misteri Hari ke-7', rewards: [{ type: 'diamond', amount: 60 }] },
  { streakDays: 14, label: 'Hadiah Misteri Hari ke-14', rewards: [{ type: 'diamond', amount: 120 }] },
  { streakDays: 30, label: 'Hadiah Misteri Hari ke-30', rewards: [{ type: 'diamond', amount: 250 }] },
])

function getStreakStorageKey(userId: string) {
  return cityStorageKey('after-gamifikasi-streak-state', userId)
}

function normalizeDateKey(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function normalizeStreakState(userId: string, value: unknown): StreakState {
  const raw = (value ?? {}) as Partial<StreakState>
  const granted = Array.isArray(raw.grantedMilestoneReceipts)
    ? [...new Set(raw.grantedMilestoneReceipts.filter((id): id is string => typeof id === 'string'))]
    : []
  const current = Number.isFinite(raw.currentStreak) ? Math.max(0, Math.floor(raw.currentStreak as number)) : 0
  const best = Number.isFinite(raw.bestStreak) ? Math.max(current, Math.floor(raw.bestStreak as number)) : current

  return {
    schemaVersion: 1,
    userId,
    currentStreak: current,
    bestStreak: best,
    lastActiveDate: normalizeDateKey(raw.lastActiveDate),
    protectionUsedDate: normalizeDateKey(raw.protectionUsedDate),
    grantedMilestoneReceipts: granted,
  }
}

function dispatchStreakUpdate(userId: string) {
  try {
    window.dispatchEvent(new CustomEvent(STREAK_UPDATED_EVENT, { detail: { userId } }))
  } catch {
    // Non-DOM test environments may not provide an event target; state is already saved.
  }
}

function persistStreakState(state: StreakState) {
  try {
    localStorage.setItem(getStreakStorageKey(state.userId), JSON.stringify(state))
  } catch {
    throw new Error('Progres streak belum tersimpan. Coba lagi setelah penyimpanan browser tersedia.')
  }
  invalidateStreakCache(state.userId)
  dispatchStreakUpdate(state.userId)
}

function getLocalDayNumber(dateKey: string) {
  // Local-midnight based day numbering, matching getLocalDateKey semantics.
  const [year, month, day] = dateKey.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / DAY_MS
}

// Pure decay/carry rule. Missing days never destroy any other progress:
// the streak value alone decays to zero (protection can carry it once).
// Gap semantics: gap 0 = same day; gap 1 = streak still alive but at risk
// (yesterday was the last active day, today is not over yet); gap 2 = exactly
// one full missed day, carried only if protection covers that missed day;
// gap >= 3 or unprotected gap 2 = streak decays to zero.
function resolveStreakForToday(state: StreakState, todayKey: string): StreakState {
  if (!state.lastActiveDate) return state
  const lastActiveDay = getLocalDayNumber(state.lastActiveDate)
  const dayGap = getLocalDayNumber(todayKey) - lastActiveDay
  if (dayGap <= 1) return state
  if (
    dayGap === 2 &&
    state.protectionUsedDate &&
    getLocalDayNumber(state.protectionUsedDate) === lastActiveDay + 1
  ) {
    return state
  }

  return { ...state, currentStreak: 0 }
}

// Pure read with a stable snapshot identity (required by useSyncExternalStore).
// The cache key includes the local day: the decay view changes at midnight even
// when the stored bytes do not. Decay is a view; only explicit writes persist.
const snapshotCache = new Map<string, { raw: string | null; todayKey: string; state: StreakState }>()

function invalidateStreakCache(userId: string) {
  for (const key of [...snapshotCache.keys()]) {
    if (key.startsWith(`${userId}|`)) snapshotCache.delete(key)
  }
}

export function getStreakState(userId: string, now = new Date()): StreakState {
  const todayKey = getTodayKey(now)
  if (!userId.trim()) {
    return normalizeStreakState(userId, null)
  }

  const key = getStreakStorageKey(userId)
  let raw: string | null
  try {
    raw = localStorage.getItem(key)
  } catch {
    raw = null
  }

  const cacheKey = `${userId}|${todayKey}`
  const cached = snapshotCache.get(cacheKey)
  if (cached && cached.raw === raw) return cached.state

  const state = resolveStreakForToday(
    normalizeStreakState(userId, raw ? JSON.parse(raw) : null),
    todayKey,
  )
  snapshotCache.set(cacheKey, { raw, todayKey, state })
  return state
}

// Streak protection (CD8): bridges exactly one missed local day.
// Applied while the streak is alive but at risk (the user has not learned
// today and yesterday was the last active day). It only protects the streak
// number; it never grants rewards or learning value.
export function applyStreakProtection(userId: string, now = new Date()): { used: boolean } {
  const todayKey = getTodayKey(now)
  const state = getStreakState(userId, now)

  if (!state.lastActiveDate || state.currentStreak === 0) return { used: false }

  const lastActiveDay = getLocalDayNumber(state.lastActiveDate)
  const dayGap = getLocalDayNumber(todayKey) - lastActiveDay
  if (dayGap !== 1) return { used: false }
  if (
    state.protectionUsedDate &&
    getLocalDayNumber(state.protectionUsedDate) === lastActiveDay + 1
  ) {
    return { used: false }
  }

  persistStreakState({ ...state, protectionUsedDate: todayKey })
  return { used: true }
}

export type StreakGiftEvent = {
  gift: StreakGiftDefinition
  granted: boolean
}

export type RecordLearningActivityResult = {
  state: StreakState
  streakIncremented: boolean
  giftEvents: StreakGiftEvent[]
}

function receiptIdFor(streakDays: number) {
  return `streak-milestone:${streakDays}`
}

function recordStreakDay(userId: string, now: Date): RecordLearningActivityResult {
  const todayKey = getTodayKey(now)
  const resolved = getStreakState(userId, now)
  const isSameDay = resolved.lastActiveDate === todayKey
  const nextStreak = isSameDay ? resolved.currentStreak : resolved.currentStreak + 1
  const nextState: StreakState = isSameDay
    ? resolved
    : {
        ...resolved,
        currentStreak: nextStreak,
        bestStreak: Math.max(resolved.bestStreak, nextStreak),
        lastActiveDate: todayKey,
        protectionUsedDate: null,
      }

  if (!isSameDay) persistStreakState(nextState)

  const giftEvents: StreakGiftEvent[] = []
  const stats = getUserStats(userId)

  for (const gift of streakGifts) {
    if (gift.streakDays !== nextState.currentStreak) continue
    const receiptId = receiptIdFor(gift.streakDays)
    if (nextState.grantedMilestoneReceipts.includes(receiptId)) continue
    if (stats.learningRewardReceipts.includes(receiptId)) {
      // Wallet already paid this milestone in an earlier session; remember it.
      persistStreakState({
        ...nextState,
        grantedMilestoneReceipts: [...nextState.grantedMilestoneReceipts, receiptId],
      })
      continue
    }

    const grant = grantLearningCompletionReward(userId, receiptId, [...gift.rewards])
    if (grant.granted) {
      persistStreakState({
        ...nextState,
        grantedMilestoneReceipts: [...nextState.grantedMilestoneReceipts, receiptId],
      })
      // One reveal event per granted milestone; UI stores handle presentation.
      pushStreakGiftReveal({
        eventId: receiptId,
        streakDays: gift.streakDays,
        label: gift.label,
        rewards: gift.rewards.map((reward) => ({ type: reward.type, amount: reward.amount })),
      })
    }
    giftEvents.push({ gift, granted: grant.granted })
  }

  return { state: getStreakState(userId, now), streakIncremented: !isSameDay, giftEvents }
}

// Streak rule (single, explicit): a streak day is a local calendar day in which
// the deterministic learning services recorded any learning progress
// (profile.updatedAt is written only by validated learning operations).
// Reading, answering, assessments and practice all count; coins, passive
// income, purchases and city state never do.
export function syncStreakFromLearningProfile(
  userId: string,
  profile: { updatedAt?: string | null },
  now = new Date(),
): RecordLearningActivityResult {
  const todayKey = getTodayKey(now)
  const resolved = getStreakState(userId, now)

  if (resolved.lastActiveDate === todayKey) {
    return { state: resolved, streakIncremented: false, giftEvents: [] }
  }

  const updatedAt = profile.updatedAt
  if (typeof updatedAt !== 'string' || !updatedAt.trim()) {
    return { state: resolved, streakIncremented: false, giftEvents: [] }
  }

  const updatedAtDay = getLocalDateKey(new Date(updatedAt))
  if (updatedAtDay !== todayKey) {
    return { state: resolved, streakIncremented: false, giftEvents: [] }
  }

  return recordStreakDay(userId, now)
}

export function getStreakGiftDefinition(streakDays: number): StreakGiftDefinition | undefined {
  return streakGifts.find((gift) => gift.streakDays === streakDays)
}

export function getNextStreakGift(currentStreak: number): StreakGiftDefinition | undefined {
  return streakGifts.find((gift) => gift.streakDays > currentStreak)
}
