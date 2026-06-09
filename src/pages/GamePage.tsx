import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { AchievementModal } from '../components/achievements/AchievementModal'
import { AchievementToast } from '../components/achievements/AchievementToast'
import { BuildingModal } from '../components/BuildingModal'
import { FinanceManagementModal } from '../components/finance/finance-management-modal'
import { DailyMissionPanel } from '../components/gamification/DailyMissionPanel'
import { GamificationHud } from '../components/gamification/GamificationHud'
import { TutorialOnboardingModal } from '../components/gamification/TutorialOnboardingModal'
import { GameCanvas } from '../components/GameCanvas'
import { ShopModal } from '../components/ShopModal'
import { useAuth } from '../contexts/AuthContext'
import {
  emitGameEvent,
  subscribeGameEvent,
  type BuildingModalPayload,
  type BuildingType,
  type CurrencyState,
} from '../game/GameEvents'
import {
  syncBuildingUpgradeAchievementProgress,
  syncGamificationAchievementProgress,
} from '../game/achievementService'
import {
  claimMissionReward,
  completeTutorial,
  MAX_USER_COIN,
  MAX_USER_DIAMOND,
  purchaseShopItem,
  syncCurrencyFromGame,
} from '../game/gamificationService'
import { visibleShopItems, type ShopItem } from '../game/shopItems'
import { useGamification } from '../game/useGamification'
import { isAdminEmail } from '../utils/admin'

const DAILY_MISSION_MINIMIZED_STORAGE_KEY = 'dailyMissionMinimized'
const DAILY_MISSION_AUTO_MINIMIZE_DELAY = 6500

export function GamePage() {
  const { user } = useAuth()
  const gamification = useGamification(user?.uid)
  const hasSyncedSceneCurrencyRef = useRef(false)
  const [sceneCurrency, setSceneCurrency] = useState<CurrencyState | null>(null)
  const [activeBuilding, setActiveBuilding] =
    useState<BuildingModalPayload | null>(null)
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [isFinanceOpen, setIsFinanceOpen] = useState(false)
  const [isAchievementOpen, setIsAchievementOpen] = useState(false)
  const [isDailyMissionMinimized, setIsDailyMissionMinimized] = useState(true)
  const [hasDailyMissionPreference, setHasDailyMissionPreference] =
    useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [shopError, setShopError] = useState('')
  const currency = useMemo<CurrencyState | null>(() => {
    if (!gamification) {
      return sceneCurrency
    }

    return {
      coins: gamification.stats.coin,
      maxCoins: sceneCurrency?.maxCoins ?? MAX_USER_COIN,
      diamonds: gamification.stats.diamond,
      maxDiamonds: MAX_USER_DIAMOND,
      bankLevel: sceneCurrency?.bankLevel ?? 1,
      barberLevel: sceneCurrency?.barberLevel ?? 1,
      bankCapacity: sceneCurrency?.bankCapacity ?? MAX_USER_COIN,
      barberCoinPerSecond: sceneCurrency?.barberCoinPerSecond ?? 1,
      coinPerSecond: sceneCurrency?.coinPerSecond ?? 1,
    }
  }, [gamification, sceneCurrency])

  const updateDailyMissionMinimized = useCallback((nextMinimized: boolean) => {
    setIsDailyMissionMinimized(nextMinimized)
    setHasDailyMissionPreference(true)
    saveDailyMissionMinimizedPreference(nextMinimized)
  }, [])
  const gamificationCoin = gamification?.stats.coin
  const gamificationDiamond = gamification?.stats.diamond
  const tutorialCompleted = gamification?.stats.tutorialCompleted
  const gamificationUserId = gamification?.stats.userId
  const purchasedShopItems = gamification?.stats.purchasedShopItems
  const isAdmin = isAdminEmail(user?.email)

  useLayoutEffect(() => {
    const unsubscribeCurrency = subscribeGameEvent(
      'CURRENCY_UPDATE',
      (nextCurrency) => {
        setSceneCurrency(nextCurrency)

        if (user?.uid && hasSyncedSceneCurrencyRef.current) {
          syncCurrencyFromGame(user.uid, {
            coin: nextCurrency.coins,
            diamond: nextCurrency.diamonds,
          })
        }
      },
    )
    const unsubscribeModal = subscribeGameEvent(
      'OPEN_BUILDING_MODAL',
      (payload) => setActiveBuilding(payload),
    )
    const unsubscribeOpenShop = subscribeGameEvent('OPEN_SHOP', () => {
      setShopError('')
      setIsShopOpen(true)
    })
    const unsubscribeOpenNpcPanel = subscribeGameEvent('OPEN_NPC_PANEL', () => {
      updateDailyMissionMinimized(false)
    })
    const unsubscribeShopError = subscribeGameEvent('SHOP_ERROR', (message) => {
      setShopError(message)
      setIsShopOpen(true)
    })
    const unsubscribeShopPurchaseRequest = subscribeGameEvent(
      'SHOP_PURCHASE_REQUEST',
      ({ item, resolve }) => {
        if (!user?.uid) {
          resolve({
            success: false,
            message: 'User belum login.',
            coins: 0,
            diamonds: 0,
          })
          return
        }

        const result = purchaseShopItem(user.uid, item)

        if (!result.success) {
          setShopError(result.message)
          setIsShopOpen(true)
        }

        resolve({
          success: result.success,
          message: result.message,
          coins: result.stats.coin,
          diamonds: result.stats.diamond,
        })
      },
    )

    return () => {
      unsubscribeCurrency()
      unsubscribeModal()
      unsubscribeOpenShop()
      unsubscribeOpenNpcPanel()
      unsubscribeShopError()
      unsubscribeShopPurchaseRequest()
    }
  }, [updateDailyMissionMinimized, user?.uid])

  useEffect(() => {
    if (gamificationCoin === undefined || gamificationDiamond === undefined) {
      hasSyncedSceneCurrencyRef.current = false
      return
    }

    hasSyncedSceneCurrencyRef.current = true
    emitGameEvent('SYNC_GAME_CURRENCY', {
      coins: gamificationCoin,
      diamonds: gamificationDiamond,
    })
  }, [gamificationCoin, gamificationDiamond])

  useEffect(() => {
    if (!user?.uid || !gamification) {
      return
    }

    syncGamificationAchievementProgress(user.uid, gamification.stats)
  }, [gamification, user?.uid])

  useEffect(() => {
    if (!user?.uid || !currency) {
      return
    }

    syncBuildingUpgradeAchievementProgress(user.uid, 'bank', currency.bankLevel)
    syncBuildingUpgradeAchievementProgress(
      user.uid,
      'barber',
      currency.barberLevel,
    )
  }, [currency, user?.uid])

  useEffect(() => {
    emitGameEvent('SYNC_OWNED_SHOP_ITEMS', {
      itemKeys: purchasedShopItems ?? [],
    })
  }, [purchasedShopItems])

  useEffect(() => {
    if (tutorialCompleted === false) {
      queueMicrotask(() => setIsTutorialOpen(true))
    }
  }, [tutorialCompleted])

  useEffect(() => {
    if (!gamificationUserId) {
      return
    }

    const preference = readDailyMissionMinimizedPreference()

    queueMicrotask(() => {
      setHasDailyMissionPreference(preference !== null)
      setIsDailyMissionMinimized(preference ?? false)
    })
  }, [gamificationUserId])

  useEffect(() => {
    if (
      !gamification ||
      hasDailyMissionPreference ||
      isDailyMissionMinimized
    ) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      updateDailyMissionMinimized(true)
    }, DAILY_MISSION_AUTO_MINIMIZE_DELAY)

    return () => window.clearTimeout(timeoutId)
  }, [
    gamification,
    hasDailyMissionPreference,
    isDailyMissionMinimized,
    updateDailyMissionMinimized,
  ])

  function handleUpgrade(type: BuildingType) {
    emitGameEvent('UPGRADE_BUILDING', { type })
  }

  function handleUpgradePlaceable(placeableId: string) {
    emitGameEvent('UPGRADE_PLACED_BUILDING', { placeableId })
  }

  function handleSell(placeableId: string) {
    emitGameEvent('SELL_PLACED_OBJECT', { placeableId })
    setActiveBuilding(null)
  }

  function handleResetCurrency() {
    if (!isAdmin) {
      return
    }

    if (user?.uid) {
      syncCurrencyFromGame(user.uid, {
        coin: 0,
        diamond: 0,
      })
    }

    emitGameEvent('ADMIN_RESET_CURRENCY', {})
  }

  function handleAdminAddCoins(amount: number) {
    if (!isAdmin) {
      return
    }

    emitGameEvent('ADMIN_ADD_COINS', { amount })
  }

  function handleAdminAddDiamonds(amount: number) {
    if (!isAdmin) {
      return
    }

    emitGameEvent('ADMIN_ADD_DIAMONDS', { amount })
  }

  function handleBuyShopItem(item: ShopItem) {
    if (!user?.uid || !gamification) {
      setShopError('User belum login')
      return
    }

    const currencyType = item.currencyType ?? 'coin'
    const balance =
      currencyType === 'diamond'
        ? gamification.stats.diamond
        : gamification.stats.coin

    if (balance < item.price) {
      setShopError(`${currencyType === 'diamond' ? 'Diamond' : 'Coin'} tidak cukup`)
      return
    }

    setShopError('')
    setIsShopOpen(false)
    emitGameEvent('BUY_SHOP_ITEM', { item })
  }

  function handleClaimMission(missionId: string) {
    if (!user?.uid) {
      return
    }

    claimMissionReward(user.uid, missionId)
  }

  function handleCompleteTutorial() {
    if (user?.uid) {
      completeTutorial(user.uid)
    }

    setIsTutorialOpen(false)
  }

  function handleCloseTutorial() {
    if (!gamification?.stats.tutorialCompleted) {
      handleCompleteTutorial()
      return
    }

    setIsTutorialOpen(false)
  }

  return (
    <section className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      <GameCanvas className="relative h-full w-full bg-cover bg-center" />

      {gamification && (
        <GamificationHud
          stats={gamification.stats}
          levelProgress={gamification.levelProgress}
          coinCapacity={currency?.bankCapacity ?? MAX_USER_COIN}
          canResetCurrency={isAdmin}
          onOpenAchievements={() => setIsAchievementOpen(true)}
          onResetCurrency={handleResetCurrency}
          onAdminAddCoins={handleAdminAddCoins}
          onAdminAddDiamonds={handleAdminAddDiamonds}
        />
      )}

      <AchievementToast uid={user?.uid} />

      {gamification && (
        <DailyMissionPanel
          missions={gamification.dailyMissions}
          dailyRewardLog={gamification.dailyRewardLog}
          isMinimized={isDailyMissionMinimized}
          onClaimMission={handleClaimMission}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenShop={() => {
            setShopError('')
            setIsShopOpen(true)
          }}
          onOpenFinance={() => setIsFinanceOpen(true)}
          onMinimize={() => updateDailyMissionMinimized(true)}
          onExpand={() => updateDailyMissionMinimized(false)}
        />
      )}

      {activeBuilding && currency && (
        <BuildingModal
          building={activeBuilding}
          currency={currency}
          onClose={() => setActiveBuilding(null)}
          onUpgrade={handleUpgrade}
          onUpgradePlaceable={handleUpgradePlaceable}
          onSell={handleSell}
        />
      )}

      {isShopOpen && (
        <ShopModal
          items={visibleShopItems}
          currency={currency}
          errorMessage={shopError}
          purchasedItemKeys={purchasedShopItems}
          onBuy={handleBuyShopItem}
          onClose={() => {
            setShopError('')
            setIsShopOpen(false)
          }}
        />
      )}

      {isFinanceOpen && (
        <FinanceManagementModal onClose={() => setIsFinanceOpen(false)} />
      )}

      {isAchievementOpen && user?.uid && (
        <AchievementModal
          uid={user.uid}
          onClose={() => setIsAchievementOpen(false)}
        />
      )}

      {isTutorialOpen && gamification && (
        <TutorialOnboardingModal
          onComplete={handleCompleteTutorial}
          onClose={handleCloseTutorial}
        />
      )}
    </section>
  )
}

function readDailyMissionMinimizedPreference() {
  try {
    const value = localStorage.getItem(DAILY_MISSION_MINIMIZED_STORAGE_KEY)

    if (value === null) {
      return null
    }

    return value === 'true'
  } catch {
    return null
  }
}

function saveDailyMissionMinimizedPreference(nextMinimized: boolean) {
  try {
    localStorage.setItem(
      DAILY_MISSION_MINIMIZED_STORAGE_KEY,
      String(nextMinimized),
    )
  } catch {
    // Preference persistence is optional; the game should keep running.
  }
}
