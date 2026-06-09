import {
  achievementDefinitions,
  achievementTierOrder,
  type AchievementCategory,
  type AchievementDefinition,
  type AchievementProgressItemDefinition,
  type AchievementTier,
} from './achievementConfig'
import type { UserStats } from './gamificationService'
import type { ShopItem } from './shopItems'
import type { FinanceCategory, FinanceTransaction } from '../types/finance'
import { getLocalDateKey } from '../utils/date'

export type AchievementProgressItemState = {
  count: number
  completed: boolean
  completedAt?: string
  updatedAt?: string
  dates?: string[]
}

export type AchievementUnlockState = {
  unlocked: boolean
  unlockedAt: string
}

export type AchievementProgressData = {
  progressItems: Record<string, AchievementProgressItemState>
  achievements: Record<string, AchievementUnlockState>
}

export type AchievementProgressItem = AchievementProgressItemDefinition & {
  count: number
  completed: boolean
  completedAt?: string
  progressPercent: number
}

export type AchievementStatus = 'locked' | 'in-progress' | 'unlocked'

export type Achievement = Omit<AchievementDefinition, 'progressItems'> & {
  unlocked: boolean
  unlockedAt?: string
  progressItems: AchievementProgressItem[]
  progressValue: number
  progressMax: number
  progressPercent: number
  status: AchievementStatus
  isCurrent: boolean
}

export type AchievementSnapshot = {
  achievements: Achievement[]
  unlockedCount: number
  totalCount: number
}

export type AchievementUnlockedPayload = {
  uid: string
  achievement: Achievement
}

export const ACHIEVEMENT_UPDATED_EVENT = 'after-gamifikasi:achievement-updated'
export const ACHIEVEMENT_UNLOCKED_EVENT = 'after-gamifikasi:achievement-unlocked'

const achievementStoragePrefix = 'achievement_progress_'

const defaultProgressData: AchievementProgressData = {
  progressItems: {},
  achievements: {},
}

type FinanceSyncPayload = {
  transactions: FinanceTransaction[]
  categories: FinanceCategory[]
  trackFinanceDay?: boolean
}

type DailyMissionSyncPayload = {
  completedCount: number
  totalCount: number
  allCompleted: boolean
}

function getAchievementStorageKey(uid: string) {
  return `${achievementStoragePrefix}${uid}`
}

function getNowIso() {
  return new Date().toISOString()
}

function getTodayKey(date = new Date()) {
  return getLocalDateKey(date)
}

function readJson<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const rawValue = localStorage.getItem(key)

    if (!rawValue) {
      return null
    }

    return JSON.parse(rawValue) as T
  } catch {
    return null
  }
}

function normalizeProgressData(
  data: Partial<AchievementProgressData> | null,
): AchievementProgressData {
  return {
    progressItems: data?.progressItems ?? {},
    achievements: data?.achievements ?? {},
  }
}

function emitAchievementUpdate(uid: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(ACHIEVEMENT_UPDATED_EVENT, {
      detail: { uid },
    }),
  )
}

function emitAchievementUnlocked(
  uid: string,
  achievement: Achievement,
) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<AchievementUnlockedPayload>(
      ACHIEVEMENT_UNLOCKED_EVENT,
      {
        detail: {
          uid,
          achievement,
        },
      },
    ),
  )
}

function getRequiredCount(item: AchievementProgressItemDefinition) {
  return Math.max(Math.floor(item.requiredCount ?? 1), 1)
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values))
}

function getProgressItemDefinition(progressItemId: string) {
  for (const achievement of achievementDefinitions) {
    const progressItem = achievement.progressItems.find(
      (item) => item.id === progressItemId,
    )

    if (progressItem) {
      return {
        achievement,
        progressItem,
      }
    }
  }

  return null
}

function getAchievementByCategoryAndTier(
  category: AchievementCategory,
  tier: AchievementTier,
) {
  return achievementDefinitions.find(
    (achievement) =>
      achievement.category === category && achievement.tier === tier,
  )
}

function isAchievementUnlocked(
  data: AchievementProgressData,
  achievementId: string,
) {
  return Boolean(data.achievements[achievementId]?.unlocked)
}

function isAchievementActive(
  data: AchievementProgressData,
  achievement: AchievementDefinition,
) {
  const tierIndex = achievementTierOrder.indexOf(achievement.tier)

  if (tierIndex <= 0) {
    return true
  }

  const previousTier = achievementTierOrder[tierIndex - 1]
  const previousAchievement = getAchievementByCategoryAndTier(
    achievement.category,
    previousTier,
  )

  return previousAchievement
    ? isAchievementUnlocked(data, previousAchievement.id)
    : true
}

function isProgressItemCompleted(
  state: AchievementProgressItemState | undefined,
  definition: AchievementProgressItemDefinition,
) {
  return Boolean(state?.completed) || (state?.count ?? 0) >= getRequiredCount(definition)
}

function isAchievementComplete(
  data: AchievementProgressData,
  achievement: AchievementDefinition,
) {
  return achievement.progressItems.every((item) =>
    isProgressItemCompleted(data.progressItems[item.id], item),
  )
}

function getProgressState(
  data: AchievementProgressData,
  item: AchievementProgressItemDefinition,
): AchievementProgressItem {
  const state = data.progressItems[item.id]
  const requiredCount = getRequiredCount(item)
  const count = Math.max(Math.floor(state?.count ?? 0), 0)
  const completed = isProgressItemCompleted(state, item)

  return {
    ...item,
    count,
    completed,
    completedAt: state?.completedAt,
    progressPercent: Math.min((count / requiredCount) * 100, 100),
  }
}

function toAchievement(
  definition: AchievementDefinition,
  data: AchievementProgressData,
): Achievement {
  const progressItems = definition.progressItems.map((item) =>
    getProgressState(data, item),
  )
  const progressValue = progressItems.reduce((total, item) => {
    const requiredCount = getRequiredCount(item)

    return total + Math.min(item.count, requiredCount)
  }, 0)
  const progressMax = definition.progressItems.reduce(
    (total, item) => total + getRequiredCount(item),
    0,
  )
  const unlockState = data.achievements[definition.id]
  const unlocked = Boolean(unlockState?.unlocked)
  const active = isAchievementActive(data, definition)

  return {
    ...definition,
    unlocked,
    unlockedAt: unlockState?.unlockedAt,
    progressItems,
    progressValue,
    progressMax,
    progressPercent: progressMax > 0 ? (progressValue / progressMax) * 100 : 0,
    status: unlocked ? 'unlocked' : active ? 'in-progress' : 'locked',
    isCurrent: active && !unlocked,
  }
}

function isProgressItemActive(
  data: AchievementProgressData,
  progressItemId: string,
) {
  const match = getProgressItemDefinition(progressItemId)

  if (!match) {
    return false
  }

  return isAchievementActive(data, match.achievement)
}

function saveAndCheck(uid: string, data: AchievementProgressData) {
  saveAchievementProgress(uid, data)

  return checkAchievementUnlock(uid)
}

export function getAchievementProgress(uid: string): AchievementProgressData {
  if (!uid) {
    return defaultProgressData
  }

  return normalizeProgressData(
    readJson<Partial<AchievementProgressData>>(getAchievementStorageKey(uid)),
  )
}

export function saveAchievementProgress(
  uid: string,
  data: AchievementProgressData,
) {
  if (!uid || typeof localStorage === 'undefined') {
    return
  }

  const normalizedData = normalizeProgressData(data)

  try {
    localStorage.setItem(
      getAchievementStorageKey(uid),
      JSON.stringify(normalizedData),
    )
    emitAchievementUpdate(uid)
  } catch {
    // Achievement persistence is optional; core finance/game flows should continue.
  }
}

export function updateAchievementProgress(
  uid: string,
  progressItemId: string,
) {
  const data = getAchievementProgress(uid)
  const match = getProgressItemDefinition(progressItemId)

  if (!match || !isProgressItemActive(data, progressItemId)) {
    return []
  }

  const currentState = data.progressItems[progressItemId]
  const requiredCount = getRequiredCount(match.progressItem)
  const today = getTodayKey()
  const dates = match.progressItem.tracksUniqueDays
    ? uniqueValues([...(currentState?.dates ?? []), today])
    : currentState?.dates
  const nextCount = match.progressItem.tracksUniqueDays
    ? dates?.length ?? 0
    : (currentState?.count ?? 0) + 1
  const completed = nextCount >= requiredCount || Boolean(currentState?.completed)

  data.progressItems[progressItemId] = {
    count: nextCount,
    completed,
    completedAt:
      completed && !currentState?.completedAt
        ? getNowIso()
        : currentState?.completedAt,
    updatedAt: getNowIso(),
    dates,
  }

  return saveAndCheck(uid, data)
}

export function setAchievementProgressCount(
  uid: string,
  progressItemId: string,
  count: number,
) {
  const data = getAchievementProgress(uid)
  const match = getProgressItemDefinition(progressItemId)

  if (!match || !isProgressItemActive(data, progressItemId)) {
    return []
  }

  const currentState = data.progressItems[progressItemId]
  const requiredCount = getRequiredCount(match.progressItem)
  const nextCount = Math.max(currentState?.count ?? 0, Math.floor(count))
  const completed = nextCount >= requiredCount || Boolean(currentState?.completed)

  data.progressItems[progressItemId] = {
    ...currentState,
    count: nextCount,
    completed,
    completedAt:
      completed && !currentState?.completedAt
        ? getNowIso()
        : currentState?.completedAt,
    updatedAt: getNowIso(),
  }

  return saveAndCheck(uid, data)
}

export function incrementAchievementProgressCount(
  uid: string,
  progressItemId: string,
  amount: number,
) {
  const data = getAchievementProgress(uid)
  const currentCount = data.progressItems[progressItemId]?.count ?? 0

  return setAchievementProgressCount(
    uid,
    progressItemId,
    currentCount + Math.max(Math.floor(amount), 0),
  )
}

export function unlockAchievement(uid: string, achievementId: string) {
  const data = getAchievementProgress(uid)
  const definition = achievementDefinitions.find(
    (achievement) => achievement.id === achievementId,
  )

  if (
    !definition ||
    isAchievementUnlocked(data, achievementId) ||
    !isAchievementActive(data, definition)
  ) {
    return null
  }

  data.achievements[achievementId] = {
    unlocked: true,
    unlockedAt: getNowIso(),
  }
  saveAchievementProgress(uid, data)

  const achievement = toAchievement(definition, getAchievementProgress(uid))

  emitAchievementUnlocked(uid, achievement)

  return achievement
}

export function checkAchievementUnlock(uid: string) {
  let data = getAchievementProgress(uid)
  const unlockedAchievements: Achievement[] = []

  achievementDefinitions.forEach((achievement) => {
    if (
      isAchievementUnlocked(data, achievement.id) ||
      !isAchievementActive(data, achievement) ||
      !isAchievementComplete(data, achievement)
    ) {
      return
    }

    const unlockedAchievement = unlockAchievement(uid, achievement.id)

    if (unlockedAchievement) {
      unlockedAchievements.push(unlockedAchievement)
      data = getAchievementProgress(uid)
    }
  })

  return unlockedAchievements
}

export function getAchievementSnapshot(uid: string): AchievementSnapshot {
  const data = getAchievementProgress(uid)
  const achievements = achievementDefinitions.map((achievement) =>
    toAchievement(achievement, data),
  )

  return {
    achievements,
    unlockedCount: achievements.filter((achievement) => achievement.unlocked).length,
    totalCount: achievements.length,
  }
}

export function subscribeAchievements(
  uid: string,
  handler: (snapshot: AchievementSnapshot) => void,
) {
  const emitSnapshot = () => handler(getAchievementSnapshot(uid))
  const handleAchievementUpdate = (event: Event) => {
    const detail = (event as CustomEvent<{ uid: string }>).detail

    if (detail.uid === uid) {
      emitSnapshot()
    }
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === getAchievementStorageKey(uid)) {
      emitSnapshot()
    }
  }

  window.addEventListener(ACHIEVEMENT_UPDATED_EVENT, handleAchievementUpdate)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(
      ACHIEVEMENT_UPDATED_EVENT,
      handleAchievementUpdate,
    )
    window.removeEventListener('storage', handleStorage)
  }
}

export function syncFinanceAchievementProgress(
  uid: string,
  { transactions, trackFinanceDay = false }: FinanceSyncPayload,
) {
  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === 'expense',
  )
  const incomeTransactions = transactions.filter(
    (transaction) => transaction.type === 'income',
  )
  const totalIncome = incomeTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  )
  const totalExpense = expenseTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  )

  if (transactions.length >= 1) {
    updateAchievementProgress(uid, 'finance_bronze_first_transaction')
  }

  setAchievementProgressCount(
    uid,
    'finance_silver_total_5_transactions',
    transactions.length,
  )

  setAchievementProgressCount(
    uid,
    'finance_gold_total_15_transactions',
    transactions.length,
  )
  setAchievementProgressCount(
    uid,
    'finance_gold_10_expenses',
    expenseTransactions.length,
  )
  setAchievementProgressCount(
    uid,
    'finance_gold_3_incomes',
    incomeTransactions.length,
  )

  if (totalIncome - totalExpense > 0) {
    updateAchievementProgress(uid, 'finance_gold_positive_balance')
  }

  if (trackFinanceDay) {
    updateAchievementProgress(uid, 'habit_gold_track_finance_7_days')
  }
}

export function syncDailyMissionAchievementProgress(
  uid: string,
  { completedCount, totalCount, allCompleted }: DailyMissionSyncPayload,
) {
  if (completedCount > 0) {
    updateAchievementProgress(uid, 'habit_bronze_complete_daily_mission')
  }

  if (allCompleted && totalCount > 0) {
    updateAchievementProgress(uid, 'habit_silver_complete_all_daily_missions_day')
    updateAchievementProgress(
      uid,
      'habit_gold_complete_all_daily_missions_3_times',
    )
  }
}

export function syncGamificationAchievementProgress(
  uid: string,
  stats: Pick<UserStats, 'level' | 'exp'>,
) {
  if (stats.level >= 2) {
    updateAchievementProgress(uid, 'habit_silver_reach_level_2')
  }

  setAchievementProgressCount(uid, 'habit_gold_earn_500_exp', stats.exp)

  if (stats.level >= 5) {
    updateAchievementProgress(uid, 'habit_gold_reach_level_5')
  }
}

export function syncShopPurchaseAchievementProgress(
  uid: string,
  item: Pick<ShopItem, 'type'>,
) {
  if (item.type === 'building') {
    updateAchievementProgress(uid, 'city_bronze_buy_first_building')
    updateAchievementProgress(uid, 'city_silver_3_city_objects')
  }

  if (item.type === 'decoration') {
    updateAchievementProgress(uid, 'city_silver_3_city_objects')
  }

  if (item.type === 'vehicle') {
    updateAchievementProgress(uid, 'city_gold_buy_vehicle')
  }
}

export function syncBuildingUpgradeAchievementProgress(
  uid: string,
  buildingType: 'bank' | 'barber',
  level: number,
) {
  if (buildingType === 'bank') {
    if (level >= 2) {
      updateAchievementProgress(uid, 'city_silver_bank_level_2')
    }

    if (level >= 3) {
      updateAchievementProgress(uid, 'city_gold_bank_level_3')
    }
  }

  if (buildingType === 'barber') {
    if (level >= 2) {
      updateAchievementProgress(uid, 'city_silver_barber_level_2')
    }

    if (level >= 3) {
      updateAchievementProgress(uid, 'city_gold_barber_level_3')
    }
  }
}
