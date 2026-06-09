export type BankLevelConfig = {
  capacity: number
  upgradeCost?: number
}

export const BANK_LEVELS: Record<number, BankLevelConfig> = {
  1: { capacity: 1000, upgradeCost: 700 },
  2: { capacity: 2500, upgradeCost: 1400 },
  3: { capacity: 5000 },
}

export function getBankCapacity(level: number) {
  return BANK_LEVELS[clampBankLevel(level)].capacity
}

export function getBankUpgradeCost(level: number) {
  return BANK_LEVELS[clampBankLevel(level)].upgradeCost
}

export function getNextBankCapacity(level: number) {
  return BANK_LEVELS[clampBankLevel(level + 1)]?.capacity
}

function clampBankLevel(level: number) {
  return Math.min(Math.max(Math.floor(level), 1), 3)
}
