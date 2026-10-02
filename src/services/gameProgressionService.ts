import { getLearningUnlockRequirement } from '../game/city/learningUnlocks'
import type { ShopItem } from '../game/shopItems'
import { getUserStats, purchaseShopItem, type PurchaseResult } from '../gamification/rewards/gamificationService'
import { LocalLearningRepository } from './persistence/learningRepository'

export function getShopLearningRequirement(userId: string, shopKey: string) {
  return getLearningUnlockRequirement(shopKey, new LocalLearningRepository().load(userId))
}

export function purchaseLearningShopItem(userId: string, item: ShopItem): PurchaseResult {
  try {
    const requirement = getShopLearningRequirement(userId, item.key)
    if (requirement) return { success: false, message: requirement, stats: getUserStats(userId) }
    return purchaseShopItem(userId, item)
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Progres belajar tidak dapat dibaca.', stats: getUserStats(userId) }
  }
}
