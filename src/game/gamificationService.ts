import type { ShopItem } from './shopItems'
import {
  incrementAchievementProgressCount,
  syncDailyMissionAchievementProgress,
  syncGamificationAchievementProgress,
  syncShopPurchaseAchievementProgress,
  updateAchievementProgress,
} from './achievementService'
import { getLocalDateKey } from '../utils/date'

export type RewardType = 'exp' | 'coin' | 'diamond'
export type MissionRewardType = RewardType | 'bundle'
export type TransactionRewardAction = 'addExpense' | 'editExpense' | 'deleteExpense'

type MissionAction = 'addExpense' | 'editExpense' | 'deleteExpense' | 'allMissions'

export type RewardGrant = {
  type: RewardType
  amount: number
}

export type UserStats = {
  userId: string
  level: number
  exp: number
  coin: number
  diamond: number
  tutorialCompleted: boolean
  purchasedShopItems: string[]
}

export type DailyRewardLog = {
  userId: string
  date: string
  expEarnedToday: number
  coinEarnedToday: number
  claimedMissions: string[]
  completedMissions: string[]
  actionCounts: Record<Exclude<MissionAction, 'allMissions'>, number>
}

export type DailyMission = {
  id: string
  title: string
  description: string
  requirement: {
    action: MissionAction
    target: number
  }
  rewardType: MissionRewardType
  rewardAmount: number
  rewards: RewardGrant[]
  completed: boolean
  claimed: boolean
}

export type DailyLimitState = {
  date: string
  maxDailyExpReward: number
  maxDailyCoinReward: number
  expEarnedToday: number
  coinEarnedToday: number
  remainingExpReward: number
  remainingCoinReward: number
}

export type LevelProgress = {
  level: number
  exp: number
  currentLevelExp: number
  nextLevelExp: number
  progressPercent: number
}

export type RewardGrantResult = {
  type: RewardType
  requestedAmount: number
  grantedAmount: number
  limitReached: boolean
  balanceReached: boolean
  stats: UserStats
  dailyLimit: DailyLimitState
}

export type PurchaseResult = {
  success: boolean
  message: string
  stats: UserStats
}

export type GamificationSnapshot = {
  stats: UserStats
  dailyRewardLog: DailyRewardLog
  dailyMissions: DailyMission[]
  dailyLimit: DailyLimitState
  levelProgress: LevelProgress
}

const USER_STATS_STORAGE_PREFIX = 'after-gamifikasi-user-stats'
const DAILY_REWARD_LOG_STORAGE_PREFIX = 'after-gamifikasi-daily-reward-log'
const LEGACY_ECONOMY_STORAGE_KEY = 'after-gamifikasi-economy-state'
const GAMIFICATION_UPDATED_EVENT = 'after-gamifikasi:gamification-updated'

export const MAX_DAILY_EXP_REWARD = 300
export const MAX_DAILY_COIN_REWARD = 105
export const MAX_USER_COIN = 10000
export const MAX_USER_DIAMOND = 1000

export const LEVEL_UP_REWARD_BY_TARGET_LEVEL: Record<
  number,
  { coin: number; diamond: number }
> = {
  2: { coin: 500, diamond: 10 },
  3: { coin: 750, diamond: 20 },
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000]

const DAILY_MISSION_DEFINITIONS: Array<
  Omit<DailyMission, 'completed' | 'claimed' | 'rewardType' | 'rewardAmount'>
> = [
  {
    id: 'input-1-expense',
    title: 'Input 1 transaksi hari ini',
    description: 'Catat minimal 1 pengeluaran hari ini, lalu klaim Coin dan EXP.',
    requirement: {
      action: 'addExpense',
      target: 1,
    },
    rewards: [
      { type: 'coin', amount: 15 },
      { type: 'exp', amount: 30 },
    ],
  },
  {
    id: 'input-3-expenses',
    title: 'Input 3 transaksi hari ini',
    description: 'Catat 3 pengeluaran untuk membuka reward Coin dan EXP.',
    requirement: {
      action: 'addExpense',
      target: 3,
    },
    rewards: [
      { type: 'coin', amount: 35 },
      { type: 'exp', amount: 40 },
    ],
  },
  {
    id: 'edit-1-expense',
    title: 'Edit 1 transaksi',
    description: 'Rapikan 1 data pengeluaran untuk membuka reward Coin dan EXP.',
    requirement: {
      action: 'editExpense',
      target: 1,
    },
    rewards: [
      { type: 'coin', amount: 15 },
      { type: 'exp', amount: 20 },
    ],
  },
  {
    id: 'complete-all-daily-missions',
    title: 'Selesaikan semua misi harian',
    description: 'Klaim Diamond, Coin, dan EXP setelah seluruh misi harian selesai.',
    requirement: {
      action: 'allMissions',
      target: 3,
    },
    rewards: [
      { type: 'diamond', amount: 5 },
      { type: 'coin', amount: 40 },
      { type: 'exp', amount: 50 },
    ],
  },
]

function getUserStatsStorageKey(userId: string) {
  return `${USER_STATS_STORAGE_PREFIX}-${userId}`
}

function getDailyRewardLogStorageKey(userId: string, date: string) {
  return `${DAILY_REWARD_LOG_STORAGE_PREFIX}-${userId}-${date}`
}

function readJson<T>(key: string): T | null {
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

function writeJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Gamification persistence is optional; gameplay should continue.
  }
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeAmount(amount: number) {
  return Math.max(Math.floor(Number.isFinite(amount) ? amount : 0), 0)
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values))
}

function getLegacyEconomyState() {
  const legacyState = readJson<Partial<{ coins: number; diamonds: number }>>(
    LEGACY_ECONOMY_STORAGE_KEY,
  )

  return {
    coin: normalizeAmount(Number(legacyState?.coins ?? 0)),
    diamond: normalizeAmount(Number(legacyState?.diamonds ?? 0)),
  }
}

function createDefaultUserStats(userId: string): UserStats {
  const legacyState = getLegacyEconomyState()

  return {
    userId,
    level: 1,
    exp: 0,
    coin: clampNumber(legacyState.coin, 0, MAX_USER_COIN),
    diamond: clampNumber(legacyState.diamond, 0, MAX_USER_DIAMOND),
    tutorialCompleted: false,
    purchasedShopItems: [],
  }
}

function normalizeUserStats(
  userId: string,
  partialStats: Partial<UserStats> | null,
): UserStats {
  const defaultStats = createDefaultUserStats(userId)
  const exp = normalizeAmount(Number(partialStats?.exp ?? defaultStats.exp))

  return {
    userId,
    level: calculateLevel(exp),
    exp,
    coin: clampNumber(
      normalizeAmount(Number(partialStats?.coin ?? defaultStats.coin)),
      0,
      MAX_USER_COIN,
    ),
    diamond: clampNumber(
      normalizeAmount(Number(partialStats?.diamond ?? defaultStats.diamond)),
      0,
      MAX_USER_DIAMOND,
    ),
    tutorialCompleted: Boolean(partialStats?.tutorialCompleted),
    purchasedShopItems: Array.isArray(partialStats?.purchasedShopItems)
      ? uniqueValues(partialStats.purchasedShopItems)
      : [],
  }
}

function normalizeDailyRewardLog(
  userId: string,
  date: string,
  partialLog: Partial<DailyRewardLog> | null,
): DailyRewardLog {
  return {
    userId,
    date,
    expEarnedToday: normalizeAmount(Number(partialLog?.expEarnedToday ?? 0)),
    coinEarnedToday: normalizeAmount(Number(partialLog?.coinEarnedToday ?? 0)),
    claimedMissions: Array.isArray(partialLog?.claimedMissions)
      ? uniqueValues(partialLog.claimedMissions)
      : [],
    completedMissions: Array.isArray(partialLog?.completedMissions)
      ? uniqueValues(partialLog.completedMissions)
      : [],
    actionCounts: {
      addExpense: normalizeAmount(
        Number(partialLog?.actionCounts?.addExpense ?? 0),
      ),
      editExpense: normalizeAmount(
        Number(partialLog?.actionCounts?.editExpense ?? 0),
      ),
      deleteExpense: normalizeAmount(
        Number(partialLog?.actionCounts?.deleteExpense ?? 0),
      ),
    },
  }
}

function emitGamificationUpdate(userId: string) {
  window.dispatchEvent(
    new CustomEvent(GAMIFICATION_UPDATED_EVENT, {
      detail: {
        userId,
      },
    }),
  )
}

function saveUserStats(stats: UserStats) {
  const normalizedStats = normalizeUserStats(stats.userId, stats)

  writeJson(getUserStatsStorageKey(stats.userId), normalizedStats)
  emitGamificationUpdate(stats.userId)
  syncGamificationAchievementProgress(stats.userId, normalizedStats)

  return normalizedStats
}

function saveDailyRewardLog(log: DailyRewardLog) {
  const normalizedLog = normalizeDailyRewardLog(log.userId, log.date, log)

  writeJson(
    getDailyRewardLogStorageKey(normalizedLog.userId, normalizedLog.date),
    normalizedLog,
  )
  emitGamificationUpdate(normalizedLog.userId)

  return normalizedLog
}

function getLevelStartExp(level: number) {
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level - 1] ?? 0
  }

  return getNextLevelExp(level - 1)
}

function getNextLevelExp(level: number) {
  if (level < LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level]
  }

  const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const levelsAfterTable = level - LEVEL_THRESHOLDS.length + 1

  return lastThreshold + levelsAfterTable * 1000
}

function calculateLevel(exp: number) {
  let level = 1

  while (exp >= getNextLevelExp(level)) {
    level += 1
  }

  return level
}

function getMissionRewardType(rewards: RewardGrant[]): MissionRewardType {
  if (rewards.length === 1) {
    return rewards[0].type
  }

  return 'bundle'
}

function getMissionRewardAmount(rewards: RewardGrant[]) {
  return rewards.reduce((total, reward) => total + reward.amount, 0)
}

function getMillisecondsUntilNextLocalDay(date = new Date()) {
  const nextDay = new Date(date)

  nextDay.setHours(24, 0, 0, 0)

  return Math.max(nextDay.getTime() - date.getTime(), 1000)
}

function isMissionRequirementMet(
  mission: Pick<DailyMission, 'id' | 'requirement'>,
  log: DailyRewardLog,
): boolean {
  if (mission.requirement.action === 'allMissions') {
    return DAILY_MISSION_DEFINITIONS.filter(
      (definition) => definition.requirement.action !== 'allMissions',
    ).every((definition) =>
      isMissionRequirementMet(
        {
          id: definition.id,
          requirement: definition.requirement,
        },
        log,
      ),
    )
  }

  return log.actionCounts[mission.requirement.action] >= mission.requirement.target
}

function refreshCompletedMissions(userId: string) {
  let log = getDailyRewardLog(userId)
  const completedMissionIds = DAILY_MISSION_DEFINITIONS.filter((definition) =>
    isMissionRequirementMet(
      {
        id: definition.id,
        requirement: definition.requirement,
      },
      log,
    ),
  ).map((definition) => definition.id)
  const nextCompletedMissions = uniqueValues([
    ...log.completedMissions,
    ...completedMissionIds,
  ])

  if (nextCompletedMissions.length !== log.completedMissions.length) {
    log = saveDailyRewardLog({
      ...log,
      completedMissions: nextCompletedMissions,
    })
  }

  syncDailyMissionAchievements(userId, log)

  return log
}

function syncDailyMissionAchievements(
  userId: string,
  log = getDailyRewardLog(userId),
) {
  const completedCount = DAILY_MISSION_DEFINITIONS.filter((definition) =>
    log.completedMissions.includes(definition.id) ||
    isMissionRequirementMet(
      {
        id: definition.id,
        requirement: definition.requirement,
      },
      log,
    ),
  ).length

  syncDailyMissionAchievementProgress(userId, {
    completedCount,
    totalCount: DAILY_MISSION_DEFINITIONS.length,
    allCompleted: completedCount >= DAILY_MISSION_DEFINITIONS.length,
  })
}

export function getTodayKey(date = new Date()) {
  return getLocalDateKey(date)
}

export function getUserStats(userId: string) {
  return normalizeUserStats(
    userId,
    readJson<Partial<UserStats>>(getUserStatsStorageKey(userId)),
  )
}

export function getDailyRewardLog(userId: string, date = getTodayKey()) {
  return normalizeDailyRewardLog(
    userId,
    date,
    readJson<Partial<DailyRewardLog>>(
      getDailyRewardLogStorageKey(userId, date),
    ),
  )
}

export function getLevelProgress(stats: UserStats): LevelProgress {
  const currentLevelExp = getLevelStartExp(stats.level)
  const nextLevelExp = getNextLevelExp(stats.level)
  const levelExpRange = Math.max(nextLevelExp - currentLevelExp, 1)
  const progressPercent = clampNumber(
    ((stats.exp - currentLevelExp) / levelExpRange) * 100,
    0,
    100,
  )

  return {
    level: stats.level,
    exp: stats.exp,
    currentLevelExp,
    nextLevelExp,
    progressPercent,
  }
}

export function checkDailyLimit(userId: string): DailyLimitState {
  const log = getDailyRewardLog(userId)

  return {
    date: log.date,
    maxDailyExpReward: MAX_DAILY_EXP_REWARD,
    maxDailyCoinReward: MAX_DAILY_COIN_REWARD,
    expEarnedToday: log.expEarnedToday,
    coinEarnedToday: log.coinEarnedToday,
    remainingExpReward: Math.max(
      MAX_DAILY_EXP_REWARD - log.expEarnedToday,
      0,
    ),
    remainingCoinReward: Math.max(
      MAX_DAILY_COIN_REWARD - log.coinEarnedToday,
      0,
    ),
  }
}

export function addExp(userId: string, amount: number): RewardGrantResult {
  const requestedAmount = normalizeAmount(amount)
  const dailyLimit = checkDailyLimit(userId)
  const grantedAmount = Math.min(requestedAmount, dailyLimit.remainingExpReward)
  const log = getDailyRewardLog(userId)
  const currentStats = getUserStats(userId)
  const nextStats =
    grantedAmount > 0
      ? grantLevelUpReward(
          userId,
          currentStats.level,
          saveUserStats({
            ...currentStats,
            exp: currentStats.exp + grantedAmount,
          }),
        )
      : currentStats

  if (grantedAmount > 0) {
    saveDailyRewardLog({
      ...log,
      expEarnedToday: log.expEarnedToday + grantedAmount,
    })
  }

  if (grantedAmount > 0) {
    syncGamificationAchievementProgress(userId, nextStats)
  }

  return {
    type: 'exp',
    requestedAmount,
    grantedAmount,
    limitReached: grantedAmount < requestedAmount,
    balanceReached: false,
    stats: nextStats,
    dailyLimit: checkDailyLimit(userId),
  }
}

function grantLevelUpReward(
  userId: string,
  previousLevel: number,
  nextStats: UserStats,
) {
  const levelIncrease = Math.max(nextStats.level - previousLevel, 0)

  if (levelIncrease <= 0) {
    return nextStats
  }

  const reward = getLevelUpReward(previousLevel, nextStats.level)
  const nextCoin = clampNumber(nextStats.coin + reward.coin, 0, MAX_USER_COIN)
  const nextDiamond = clampNumber(
    nextStats.diamond + reward.diamond,
    0,
    MAX_USER_DIAMOND,
  )
  const grantedCoin = nextCoin - nextStats.coin
  const grantedDiamond = nextDiamond - nextStats.diamond

  if (grantedCoin <= 0 && grantedDiamond <= 0) {
    return nextStats
  }

  const rewardedStats = saveUserStats({
    ...nextStats,
    coin: nextCoin,
    diamond: nextDiamond,
  })

  if (grantedCoin > 0) {
    incrementAchievementProgressCount(
      userId,
      'city_gold_earn_1000_coin',
      grantedCoin,
    )
  }

  if (grantedDiamond > 0) {
    incrementAchievementProgressCount(
      userId,
      'city_gold_earn_100_diamond',
      grantedDiamond,
    )
  }

  return rewardedStats
}

function getLevelUpReward(previousLevel: number, nextLevel: number) {
  return Array.from(
    { length: Math.max(nextLevel - previousLevel, 0) },
    (_, index) => getLevelUpRewardForTargetLevel(previousLevel + index + 1),
  ).reduce(
    (total, reward) => ({
      coin: total.coin + reward.coin,
      diamond: total.diamond + reward.diamond,
    }),
    { coin: 0, diamond: 0 },
  )
}

function getLevelUpRewardForTargetLevel(targetLevel: number) {
  const configuredReward = LEVEL_UP_REWARD_BY_TARGET_LEVEL[targetLevel]

  if (configuredReward) {
    return configuredReward
  }

  return {
    coin: 750 + Math.max(targetLevel - 3, 0) * 250,
    diamond: 20 + Math.max(targetLevel - 3, 0) * 10,
  }
}

export function addCoin(userId: string, amount: number): RewardGrantResult {
  const requestedAmount = normalizeAmount(amount)
  const dailyLimit = checkDailyLimit(userId)
  const currentStats = getUserStats(userId)
  const balanceRoom = Math.max(MAX_USER_COIN - currentStats.coin, 0)
  const grantedAmount = Math.min(
    requestedAmount,
    dailyLimit.remainingCoinReward,
    balanceRoom,
  )
  const log = getDailyRewardLog(userId)
  const nextStats =
    grantedAmount > 0
      ? saveUserStats({
          ...currentStats,
          coin: currentStats.coin + grantedAmount,
        })
      : currentStats

  if (grantedAmount > 0) {
    saveDailyRewardLog({
      ...log,
      coinEarnedToday: log.coinEarnedToday + grantedAmount,
    })
    incrementAchievementProgressCount(
      userId,
      'city_gold_earn_1000_coin',
      grantedAmount,
    )
  }

  return {
    type: 'coin',
    requestedAmount,
    grantedAmount,
    limitReached: grantedAmount < requestedAmount,
    balanceReached: grantedAmount < requestedAmount && balanceRoom <= grantedAmount,
    stats: nextStats,
    dailyLimit: checkDailyLimit(userId),
  }
}

export function addDiamond(userId: string, amount: number): RewardGrantResult {
  const requestedAmount = normalizeAmount(amount)
  const currentStats = getUserStats(userId)
  const balanceRoom = Math.max(MAX_USER_DIAMOND - currentStats.diamond, 0)
  const grantedAmount = Math.min(requestedAmount, balanceRoom)
  const nextStats =
    grantedAmount > 0
      ? saveUserStats({
          ...currentStats,
          diamond: currentStats.diamond + grantedAmount,
        })
      : currentStats

  if (grantedAmount > 0) {
    incrementAchievementProgressCount(
      userId,
      'city_gold_earn_100_diamond',
      grantedAmount,
    )
  }

  return {
    type: 'diamond',
    requestedAmount,
    grantedAmount,
    limitReached: false,
    balanceReached: grantedAmount < requestedAmount,
    stats: nextStats,
    dailyLimit: checkDailyLimit(userId),
  }
}

export function completeMission(userId: string, missionId: string) {
  const log = refreshCompletedMissions(userId)
  const mission = getDailyMissions(userId).find((item) => item.id === missionId)

  if (!mission?.completed) {
    return {
      success: false,
      message: 'Misi belum selesai.',
      dailyRewardLog: log,
    }
  }

  if (log.completedMissions.includes(missionId)) {
    return {
      success: true,
      message: 'Misi sudah selesai.',
      dailyRewardLog: log,
    }
  }

  const savedLog = saveDailyRewardLog({
    ...log,
    completedMissions: uniqueValues([...log.completedMissions, missionId]),
  })

  syncDailyMissionAchievements(userId, savedLog)

  return {
    success: true,
    message: 'Misi selesai.',
    dailyRewardLog: savedLog,
  }
}

export function claimMissionReward(userId: string, missionId: string) {
  refreshCompletedMissions(userId)
  const mission = getDailyMissions(userId).find((item) => item.id === missionId)

  if (!mission) {
    return {
      success: false,
      message: 'Misi tidak ditemukan.',
      rewards: [] as RewardGrantResult[],
      stats: getUserStats(userId),
    }
  }

  if (!mission.completed) {
    return {
      success: false,
      message: 'Misi belum selesai.',
      rewards: [] as RewardGrantResult[],
      stats: getUserStats(userId),
    }
  }

  if (mission.claimed) {
    return {
      success: false,
      message: 'Reward misi sudah diambil.',
      rewards: [] as RewardGrantResult[],
      stats: getUserStats(userId),
    }
  }

  const rewards = mission.rewards.map((reward) => {
    if (reward.type === 'exp') {
      return addExp(userId, reward.amount)
    }

    if (reward.type === 'coin') {
      return addCoin(userId, reward.amount)
    }

    return addDiamond(userId, reward.amount)
  })
  const nextLog = getDailyRewardLog(userId)

  saveDailyRewardLog({
    ...nextLog,
    claimedMissions: uniqueValues([...nextLog.claimedMissions, missionId]),
  })
  updateAchievementProgress(userId, 'habit_silver_claim_daily_reward')
  updateAchievementProgress(userId, 'habit_gold_claim_5_daily_rewards')
  syncDailyMissionAchievements(userId)

  return {
    success: true,
    message: 'Reward misi berhasil diambil.',
    rewards,
    stats: getUserStats(userId),
  }
}

export function grantTransactionReward(
  userId: string,
  actionType: TransactionRewardAction,
) {
  const currentLog = getDailyRewardLog(userId)
  saveDailyRewardLog({
    ...currentLog,
    actionCounts: {
      ...currentLog.actionCounts,
      [actionType]: currentLog.actionCounts[actionType] + 1,
    },
  })
  const dailyRewardLog = refreshCompletedMissions(userId)

  return {
    actionType,
    rewards: [] as RewardGrantResult[],
    dailyRewardLog,
    dailyMissions: getDailyMissions(userId),
    dailyLimit: checkDailyLimit(userId),
    stats: getUserStats(userId),
  }
}

export function getDailyMissions(userId: string) {
  const log = getDailyRewardLog(userId)

  return DAILY_MISSION_DEFINITIONS.map((definition) => {
    const completed =
      log.completedMissions.includes(definition.id) ||
      isMissionRequirementMet(
        {
          id: definition.id,
          requirement: definition.requirement,
        },
        log,
      )
    const claimed = log.claimedMissions.includes(definition.id)

    return {
      ...definition,
      rewardType: getMissionRewardType(definition.rewards),
      rewardAmount: getMissionRewardAmount(definition.rewards),
      completed,
      claimed,
    }
  })
}

export function completeTutorial(userId: string) {
  return saveUserStats({
    ...getUserStats(userId),
    tutorialCompleted: true,
  })
}

export function resetTutorial(userId: string) {
  return saveUserStats({
    ...getUserStats(userId),
    tutorialCompleted: false,
  })
}

export function syncCurrencyFromGame(
  userId: string,
  balance: { coin: number; diamond: number },
) {
  const currentStats = getUserStats(userId)
  const nextCoin = clampNumber(normalizeAmount(balance.coin), 0, MAX_USER_COIN)
  const nextDiamond = clampNumber(
    normalizeAmount(balance.diamond),
    0,
    MAX_USER_DIAMOND,
  )

  if (currentStats.coin === nextCoin && currentStats.diamond === nextDiamond) {
    return currentStats
  }

  const nextStats = saveUserStats({
    ...currentStats,
    coin: nextCoin,
    diamond: nextDiamond,
  })

  if (nextCoin > currentStats.coin) {
    incrementAchievementProgressCount(
      userId,
      'city_gold_earn_1000_coin',
      nextCoin - currentStats.coin,
    )
  }

  if (nextDiamond > currentStats.diamond) {
    incrementAchievementProgressCount(
      userId,
      'city_gold_earn_100_diamond',
      nextDiamond - currentStats.diamond,
    )
  }

  return nextStats
}

export function purchaseShopItem(userId: string, item: ShopItem): PurchaseResult {
  const currentStats = getUserStats(userId)
  const currencyType = item.currencyType ?? 'coin'
  const price = normalizeAmount(item.price)
  const balance = currencyType === 'diamond' ? currentStats.diamond : currentStats.coin
  const currencyName = currencyType === 'diamond' ? 'Diamond' : 'Coin'

  if (item.type === 'vehicle' && currentStats.purchasedShopItems.includes(item.key)) {
    return {
      success: false,
      message: 'Vehicle sudah dimiliki.',
      stats: currentStats,
    }
  }

  if (balance < price) {
    return {
      success: false,
      message: `${currencyName} tidak cukup.`,
      stats: currentStats,
    }
  }

  const nextStats = saveUserStats({
    ...currentStats,
    coin: currencyType === 'coin' ? currentStats.coin - price : currentStats.coin,
    diamond:
      currencyType === 'diamond'
        ? currentStats.diamond - price
        : currentStats.diamond,
    purchasedShopItems:
      item.type === 'vehicle'
        ? uniqueValues([...currentStats.purchasedShopItems, item.key])
        : currentStats.purchasedShopItems,
  })

  syncShopPurchaseAchievementProgress(userId, item)

  return {
    success: true,
    message: 'Pembelian berhasil.',
    stats: nextStats,
  }
}

export function getGamificationSnapshot(userId: string): GamificationSnapshot {
  const stats = getUserStats(userId)

  return {
    stats,
    dailyRewardLog: getDailyRewardLog(userId),
    dailyMissions: getDailyMissions(userId),
    dailyLimit: checkDailyLimit(userId),
    levelProgress: getLevelProgress(stats),
  }
}

export function subscribeGamification(
  userId: string,
  handler: (snapshot: GamificationSnapshot) => void,
) {
  const emitSnapshot = () => handler(getGamificationSnapshot(userId))
  let dailyRolloverTimer: number | undefined
  const scheduleDailyRollover = () => {
    window.clearTimeout(dailyRolloverTimer)
    dailyRolloverTimer = window.setTimeout(() => {
      emitSnapshot()
      scheduleDailyRollover()
    }, getMillisecondsUntilNextLocalDay() + 250)
  }
  const handleGamificationUpdate = (event: Event) => {
    const detail = (event as CustomEvent<{ userId: string }>).detail

    if (detail.userId === userId) {
      emitSnapshot()
    }
  }
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === getUserStatsStorageKey(userId) ||
      event.key?.startsWith(`${DAILY_REWARD_LOG_STORAGE_PREFIX}-${userId}-`)
    ) {
      emitSnapshot()
    }
  }

  window.addEventListener(GAMIFICATION_UPDATED_EVENT, handleGamificationUpdate)
  window.addEventListener('storage', handleStorage)
  scheduleDailyRollover()

  return () => {
    window.clearTimeout(dailyRolloverTimer)
    window.removeEventListener(
      GAMIFICATION_UPDATED_EVENT,
      handleGamificationUpdate,
    )
    window.removeEventListener('storage', handleStorage)
  }
}
