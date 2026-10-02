import { getShopLearningRequirement, purchaseLearningShopItem } from '../services/gameProgressionService'
import { cityStorageKey } from '../game/city/storage'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { AdminToolsModal } from '../components/admin/AdminToolsModal'
import { AchievementModal } from '../components/achievements/AchievementModal'
import { AchievementToast } from '../components/achievements/AchievementToast'
import { BuildingModal } from '../components/BuildingModal'
import { LearningDashboard } from '../components/learning/LearningDashboard'
import { CityHallModal } from '../components/city/CityHallModal'
import { DailyMissionPanel } from '../components/gamification/DailyMissionPanel'
import { GamificationHud } from '../components/gamification/GamificationHud'
import { LevelUpRewardToast } from '../components/gamification/LevelUpRewardToast'
import { TutorialOnboardingModal } from '../components/gamification/TutorialOnboardingModal'
import { GameCanvas } from '../components/GameCanvas'
import { ShopModal } from '../components/ShopModal'
import { VehicleModal } from '../components/VehicleModal'
import { useAuth } from '../contexts/AuthContext'
import {
  emitGameEvent,
  subscribeGameEvent,
  type BuildingModalPayload,
  type BuildingType,
  type CurrencyState,
  type VehicleModalPayload,
} from '../game/GameEvents'
import {
  syncBuildingUpgradeAchievementProgress,
  syncGamificationAchievementProgress,
} from '../gamification/achievements/achievementService'
import {
  claimMissionReward,
  completeTutorial,
  adminUpgradeUserLevel,
  MAX_USER_COIN,
  MAX_USER_DIAMOND,
  getUserStats,
  resetUserLevel,
  sellShopItem,
  syncCurrencyFromGame,
} from '../gamification/rewards/gamificationService'
import { visibleShopItems, type ShopItem } from '../game/shopItems'
import { useGamification } from '../gamification/rewards/useGamification'
import { useCityProgress } from '../game/useCityProgress'
import { useStreakGamification } from '../gamification/streak/useStreakGamification'
import { StreakGiftToast } from '../components/gamification/streak/StreakGiftToast'

const DAILY_MISSION_MINIMIZED_STORAGE_KEY = 'dailyMissionMinimized'
const DAILY_MISSION_AUTO_MINIMIZE_DELAY = 6500

export function GamePage() {
  const { user } = useAuth()
  return user ? <UserGamePage key={user.uid} /> : null
}

function UserGamePage() {
  const { user, isAdmin } = useAuth()
  const gamification = useGamification(user?.uid)
  const hasSyncedSceneCurrencyRef = useRef(false)
  const [sceneCurrency, setSceneCurrency] = useState<CurrencyState | null>(null)
  const [activeBuilding, setActiveBuilding] =
    useState<BuildingModalPayload | null>(null)
  const [activeVehicle, setActiveVehicle] =
    useState<VehicleModalPayload | null>(null)
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [isLearningOpen, setIsLearningOpen] = useState(false)
  const [isAchievementOpen, setIsAchievementOpen] = useState(false)
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(false)
  const [isDailyMissionMinimized, setIsDailyMissionMinimized] = useState(true)
  const [hasDailyMissionPreference, setHasDailyMissionPreference] =
    useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [shopError, setShopError] = useState('')
  const [vehicleError, setVehicleError] = useState('')
  const [gameErrorMessage, setGameErrorMessage] = useState('')
  const [activePlacementItem, setActivePlacementItem] =
    useState<ShopItem | null>(null)
  const [pendingPlacementItem, setPendingPlacementItem] =
    useState<ShopItem | null>(null)
  const [isCityHallOpen, setIsCityHallOpen] = useState(false)
  const cityProgress = useCityProgress(user?.uid ?? '')
  const streakGamification = useStreakGamification(user?.uid ?? '')
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
      barberCoinPerHour: sceneCurrency?.barberCoinPerHour ?? 5,
      coinPerHour: sceneCurrency?.coinPerHour ?? 0,
    }
  }, [gamification, sceneCurrency])
  const hudStats = useMemo(() => {
    if (!gamification) {
      return null
    }

    return {
      ...gamification.stats,
      coin: currency?.coins ?? gamification.stats.coin,
      diamond: currency?.diamonds ?? gamification.stats.diamond,
    }
  }, [currency, gamification])

  const updateDailyMissionMinimized = useCallback((nextMinimized: boolean) => {
    setIsDailyMissionMinimized(nextMinimized)
    setHasDailyMissionPreference(true)
    saveDailyMissionMinimizedPreference(nextMinimized, user?.uid ?? '')
  }, [user?.uid])

  const handleUseStreakProtection = useCallback(() => {
    if (!user?.uid) return
    streakGamification.protectStreak()
  }, [user?.uid, streakGamification])
  const gamificationCoin = gamification?.stats.coin
  const gamificationDiamond = gamification?.stats.diamond
  const tutorialCompleted = gamification?.stats.tutorialCompleted
  const gamificationUserId = gamification?.stats.userId
  const purchasedShopItems = gamification?.stats.purchasedShopItems
  const soldShopItems = gamification?.stats.soldShopItems
  const purchasedShopItemsRef = useRef<string[]>([])
  const purchasedShopItemsSignature = useMemo(
    () => (purchasedShopItems ?? []).slice().sort().join('|'),
    [purchasedShopItems],
  )

  useEffect(() => {
    purchasedShopItemsRef.current = purchasedShopItems ?? []
  }, [purchasedShopItems])

  const syncOwnedShopItemsToScene = useCallback(() => {
    emitGameEvent('SYNC_OWNED_SHOP_ITEMS', {
      itemKeys: purchasedShopItemsRef.current,
    })
  }, [])

  useLayoutEffect(() => {
    const unsubscribeGameSceneReady = subscribeGameEvent(
      'GAME_SCENE_READY',
      () => {
        if (user?.uid) {
          const stats = getUserStats(user.uid)
          hasSyncedSceneCurrencyRef.current = true
          emitGameEvent('SYNC_GAME_CURRENCY', { coins: stats.coin, diamonds: stats.diamond })
        }
        syncOwnedShopItemsToScene()
      },
    )
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
    const unsubscribeVehicleModal = subscribeGameEvent(
      'OPEN_VEHICLE_MODAL',
      (payload) => {
        setVehicleError('')
        setActiveBuilding(null)
        setIsShopOpen(false)
        setActiveVehicle(payload)
      },
    )
    const unsubscribeOpenShop = subscribeGameEvent('OPEN_SHOP', () => {
      setShopError('')
      setGameErrorMessage('')
      setActiveVehicle(null)
      setIsShopOpen(true)
    })
    const unsubscribeCityHall = subscribeGameEvent('OPEN_CITY_HALL', () => {
      setIsCityHallOpen(true)
    })
    const unsubscribeSchoolEntry = subscribeGameEvent('OPEN_LEARNING_ENTRY', () => {
      setIsLearningOpen(true)
    })
    const unsubscribeShopError = subscribeGameEvent('SHOP_ERROR', (message) => {
      if (shouldShowPlacementErrorPopup(message)) {
        setGameErrorMessage(message)
        setShopError('')
        return
      }

      setShopError(message)
      setIsShopOpen(true)
    })
    const unsubscribeShopPlacementStarted = subscribeGameEvent(
      'SHOP_PLACEMENT_STARTED',
      ({ item }) => {
        setActivePlacementItem(item)
        setPendingPlacementItem(null)
        setShopError('')
        setGameErrorMessage('')
        setIsShopOpen(false)
      },
    )
    const unsubscribeShopPlacementConfirmRequest = subscribeGameEvent(
      'SHOP_PLACEMENT_CONFIRM_REQUEST',
      ({ item }) => {
        setPendingPlacementItem(item)
      },
    )
    const unsubscribeShopPurchaseCompleted = subscribeGameEvent(
      'SHOP_PURCHASE_COMPLETED',
      () => {
        setActivePlacementItem(null)
        setPendingPlacementItem(null)
        setShopError('')
        setGameErrorMessage('')
        setIsShopOpen(false)
      },
    )
    const unsubscribeShopPlacementCancelled = subscribeGameEvent(
      'SHOP_PLACEMENT_CANCELLED',
      () => {
        setActivePlacementItem(null)
        setPendingPlacementItem(null)
        setGameErrorMessage('')
      },
    )
    const unsubscribeShopSellCompleted = subscribeGameEvent(
      'SHOP_SELL_COMPLETED',
      ({ currency: nextCurrency }) => {
        setSceneCurrency(nextCurrency)

        if (user?.uid) {
          syncCurrencyFromGame(user.uid, {
            coin: nextCurrency.coins,
            diamond: nextCurrency.diamonds,
          })
        }
      },
    )
    const unsubscribeShopPurchaseRequest = subscribeGameEvent(
      'SHOP_PURCHASE_REQUEST',
      ({ item, resolve }) => {
        if (!user?.uid) {
          resolve({
            success: false,
            message: 'Pengguna belum masuk.',
            coins: 0,
            diamonds: 0,
          })
          return
        }

        const result = purchaseLearningShopItem(user.uid, item)

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
      unsubscribeGameSceneReady()
      unsubscribeCurrency()
      unsubscribeModal()
      unsubscribeVehicleModal()
      unsubscribeOpenShop()
      unsubscribeCityHall()
      unsubscribeSchoolEntry()
      unsubscribeShopError()
      unsubscribeShopPlacementStarted()
      unsubscribeShopPlacementConfirmRequest()
      unsubscribeShopPurchaseCompleted()
      unsubscribeShopPlacementCancelled()
      unsubscribeShopSellCompleted()
      unsubscribeShopPurchaseRequest()
    }
  }, [syncOwnedShopItemsToScene, updateDailyMissionMinimized, user?.uid])

  useEffect(() => {
    if (gamificationCoin === undefined || gamificationDiamond === undefined) {
      hasSyncedSceneCurrencyRef.current = false
      return
    }

    if (!hasSyncedSceneCurrencyRef.current) return
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
    const timeoutIds = [0, 250, 900].map((delay) =>
      window.setTimeout(syncOwnedShopItemsToScene, delay),
    )

    syncOwnedShopItemsToScene()

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [purchasedShopItemsSignature, syncOwnedShopItemsToScene])

  useEffect(() => {
    if (tutorialCompleted === false) {
      queueMicrotask(() => setIsTutorialOpen(true))
    }
  }, [tutorialCompleted])

  useEffect(() => {
    if (!gamificationUserId) {
      return
    }

    const preference = readDailyMissionMinimizedPreference(gamificationUserId)

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

  function handleAdminResetLevels() {
    if (!isAdmin) {
      return
    }

    emitGameEvent('ADMIN_RESET_LEVELS', {})
  }

  function handleAdminUpgradeLevels() {
    if (!isAdmin) {
      return
    }

    emitGameEvent('ADMIN_UPGRADE_LEVELS', {})
  }

  function handleAdminResetCityBuildings() {
    if (!isAdmin) {
      return
    }

    emitGameEvent('ADMIN_RESET_CITY_BUILDINGS', {})
  }

  function handleAdminResetPlayerLevel() {
    if (!isAdmin || !user?.uid) {
      return
    }

    resetUserLevel(user.uid)
  }

  function handleAdminUpgradePlayerLevel() {
    if (!isAdmin || !user?.uid) {
      return
    }

    adminUpgradeUserLevel(user.uid)
  }

  function handleBuyShopItem(item: ShopItem) {
    if (user?.uid) {
      try {
        const requirement = getShopLearningRequirement(user.uid, item.key)
        if (requirement) { setShopError(requirement); return }
      } catch (error) { setShopError(error instanceof Error ? error.message : 'Progres belajar tidak dapat dibaca.'); return }
    }

    if (!user?.uid || !gamification) {
      setShopError('Pengguna belum masuk')
      return
    }

    const currencyType = item.currencyType ?? 'coin'
    const balance =
      currencyType === 'diamond'
        ? gamification.stats.diamond
        : gamification.stats.coin

    if (balance < item.price) {
      setShopError(`${currencyType === 'diamond' ? 'Berlian' : 'Koin'} tidak cukup`)
      return
    }

    setShopError('')
    emitGameEvent('BUY_SHOP_ITEM', { item })
  }

  function handleCancelPlacement() {
    setActivePlacementItem(null)
    setPendingPlacementItem(null)
    setGameErrorMessage('')
    emitGameEvent('CANCEL_SHOP_PLACEMENT', {})
  }

  function handleSellShopItem(item: ShopItem) {
    if (!user?.uid) {
      setShopError('Pengguna belum masuk')
      return
    }

    const result = sellShopItem(user.uid, item)

    if (!result.success) {
      setShopError(result.message)
      setIsShopOpen(true)
      return
    }

    setShopError('')
    emitGameEvent('SYNC_GAME_CURRENCY', {
      coins: result.stats.coin,
      diamonds: result.stats.diamond,
    })
    emitGameEvent('SYNC_OWNED_SHOP_ITEMS', {
      itemKeys: result.stats.purchasedShopItems,
    })
  }

  function handleSellVehicle(item: ShopItem) {
    if (!user?.uid) {
      setVehicleError('Pengguna belum masuk')
      return
    }

    const result = sellShopItem(user.uid, item)

    if (!result.success) {
      setVehicleError(result.message)
      return
    }

    setVehicleError('')
    setActiveVehicle(null)
    emitGameEvent('SYNC_GAME_CURRENCY', {
      coins: result.stats.coin,
      diamonds: result.stats.diamond,
    })
    emitGameEvent('SYNC_OWNED_SHOP_ITEMS', {
      itemKeys: result.stats.purchasedShopItems,
    })
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
    <section className="relative h-[calc(100dvh-64px)] min-h-[calc(100svh-64px)] w-full overflow-hidden">
      <GameCanvas userId={user?.uid ?? ''} interactionEnabled={!isLearningOpen && !isShopOpen && !isAchievementOpen && !isAdminToolsOpen && !isTutorialOpen && !activeBuilding && !activeVehicle && !pendingPlacementItem && !gameErrorMessage && !isCityHallOpen} className="relative h-full w-full bg-cover bg-center" />

      {gamification && hudStats && (
        <GamificationHud
          stats={hudStats}
          levelProgress={gamification.levelProgress}
          coinCapacity={currency?.bankCapacity ?? MAX_USER_COIN}
          canResetCurrency={isAdmin}
          streak={streakGamification.streak}
          upcomingGift={streakGamification.upcomingGift}
          onUseStreakProtection={handleUseStreakProtection}
          onOpenAchievements={() => setIsAchievementOpen(true)}
          onOpenAdminTools={() => setIsAdminToolsOpen(true)}
        />
      )}

      <AchievementToast uid={user?.uid} />
      <LevelUpRewardToast uid={user?.uid} />
      {streakGamification.reveal && (
        <StreakGiftToast reveal={streakGamification.reveal} onClose={streakGamification.dismissReveal} />
      )}

      {gamification && (
        <DailyMissionPanel
          missions={gamification.dailyMissions}
          dailyRewardLog={gamification.dailyRewardLog}
          dailyLimit={gamification.dailyLimit}
          isMinimized={isDailyMissionMinimized}
          onClaimMission={handleClaimMission}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenShop={() => {
            setShopError('')
            setIsShopOpen(true)
          }}
          onOpenLearning={() => setIsLearningOpen(true)}
          onMinimize={() => updateDailyMissionMinimized(true)}
          onExpand={() => updateDailyMissionMinimized(false)}
        />
      )}

      {isCityHallOpen && (
        <CityHallModal
          cityProgress={cityProgress}
          onClose={() => setIsCityHallOpen(false)}
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

      {activeVehicle && (
        <VehicleModal
          vehicle={activeVehicle}
          errorMessage={vehicleError}
          onClose={() => {
            setVehicleError('')
            setActiveVehicle(null)
          }}
          onSell={handleSellVehicle}
        />
      )}

      {isShopOpen && (
        <ShopModal
          userId={user?.uid ?? ''}
          items={visibleShopItems}
          currency={currency}
          errorMessage={shopError}
          purchasedItemKeys={purchasedShopItems}
          soldItemKeys={soldShopItems}
          onBuy={handleBuyShopItem}
          onSell={handleSellShopItem}
          onClose={() => {
            setShopError('')
            setIsShopOpen(false)
          }}
        />
      )}

      {isLearningOpen && (
        <LearningDashboard userId={user?.uid ?? ''} onClose={() => setIsLearningOpen(false)} />
      )}

      {activePlacementItem && !pendingPlacementItem && (
        <PlacementActionPanel
          item={activePlacementItem}
          onCancel={handleCancelPlacement}
        />
      )}

      {isAchievementOpen && user?.uid && (
        <AchievementModal
          uid={user.uid}
          onClose={() => setIsAchievementOpen(false)}
        />
      )}

      {isAdminToolsOpen && isAdmin && user?.uid && (
        <AdminToolsModal
          uid={user.uid}
          onResetCurrency={handleResetCurrency}
          onResetLevels={handleAdminResetLevels}
          onUpgradeLevels={handleAdminUpgradeLevels}
          onResetCityBuildings={handleAdminResetCityBuildings}
          onResetPlayerLevel={handleAdminResetPlayerLevel}
          onUpgradePlayerLevel={handleAdminUpgradePlayerLevel}
          onAdminAddCoins={handleAdminAddCoins}
          onAdminAddDiamonds={handleAdminAddDiamonds}
          onClose={() => setIsAdminToolsOpen(false)}
        />
      )}

      {pendingPlacementItem && (
        <PlacementConfirmModal
          item={pendingPlacementItem}
          onConfirm={() => {
            setPendingPlacementItem(null)
            emitGameEvent('CONFIRM_SHOP_PLACEMENT', {})
          }}
          onCancel={() => {
            setPendingPlacementItem(null)
            emitGameEvent('CANCEL_SHOP_PLACEMENT_CONFIRM', {})
          }}
          onCancelPurchase={handleCancelPlacement}
        />
      )}

      {gameErrorMessage && (
        <GameErrorPopup
          message={gameErrorMessage}
          onClose={() => setGameErrorMessage('')}
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

type GameErrorPopupProps = {
  message: string
  onClose: () => void
}

function GameErrorPopup({ message, onClose }: GameErrorPopupProps) {
  return (
    <div className="absolute inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-slate-950/25 px-3 py-4 backdrop-blur-sm">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-lg border border-red-200 bg-white p-4 shadow-2xl sm:p-5">
        <p className="text-xs font-bold uppercase text-red-600">
          Tidak bisa ditaruh
        </p>
        <h3 className="mt-2 text-lg font-semibold text-zinc-950">
          {message}
        </h3>
        <p className="mt-2 text-sm text-zinc-700">
          Pilih posisi lain yang masih kosong di atas jalan.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 min-h-11 w-full rounded-md bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Mengerti
        </button>
      </div>
    </div>
  )
}

type PlacementConfirmModalProps = {
  item: ShopItem
  onConfirm: () => void
  onCancel: () => void
  onCancelPurchase: () => void
}

function PlacementConfirmModal({
  item,
  onConfirm,
  onCancel,
  onCancelPurchase,
}: PlacementConfirmModalProps) {
  return (
    <div className="absolute inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-slate-950/35 px-3 py-4 backdrop-blur-sm">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-2xl sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-md bg-sky-50">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-emerald-600">
              Konfirmasi Lokasi
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-snug text-zinc-950">
              Taruh {item.name} di sini?
            </h3>
            <p className="mt-1 text-sm text-zinc-700">
              Pilih posisi lain kalau kamu masih mau menggeser peta.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
          >
            Pilih Posisi Lain
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-md bg-green-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
          >
            Taruh di Sini
          </button>
        </div>

        <button
          type="button"
          onClick={onCancelPurchase}
          className="mt-3 min-h-11 w-full rounded-md bg-red-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Batalkan Pembelian
        </button>
      </div>
    </div>
  )
}

type PlacementActionPanelProps = {
  item: ShopItem
  onCancel: () => void
}

function PlacementActionPanel({
  item,
  onCancel,
}: PlacementActionPanelProps) {
  return (
    <div className="absolute inset-x-2 bottom-3 z-[1050] flex justify-center sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2">
      <div className="flex w-full max-w-md items-center gap-3 rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-2xl backdrop-blur-md">
        <div className="flex h-12 w-12 shrink-0 items-end justify-center overflow-hidden rounded-md bg-sky-50">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-950">
            Menempatkan {item.name}
          </p>
          <p className="text-xs font-medium text-zinc-700">
            Klik jalan untuk memilih lokasi.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 shrink-0 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Batal
        </button>
      </div>
    </div>
  )
}

function shouldShowPlacementErrorPopup(message: string) {
  return [
    'Bangunan bertabrakan',
    'Pilih posisi di atas jalan utama',
    'Klik petak jalan yang tersedia',
    'Petak ini sedang ditempati objek',
  ].includes(message)
}

function readDailyMissionMinimizedPreference(userId: string) {
  try {
    const value = localStorage.getItem(cityStorageKey(DAILY_MISSION_MINIMIZED_STORAGE_KEY, userId))

    if (value === null) {
      return null
    }

    return value === 'true'
  } catch {
    return null
  }
}

function saveDailyMissionMinimizedPreference(nextMinimized: boolean, userId: string) {
  try {
    localStorage.setItem(
      cityStorageKey(DAILY_MISSION_MINIMIZED_STORAGE_KEY, userId),
      String(nextMinimized),
    )
  } catch {
    // Preference persistence is optional; the game should keep running.
  }
}
