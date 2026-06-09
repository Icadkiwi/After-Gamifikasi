import Phaser from 'phaser'

import cloud01Url from '../../MBS_Toony_021523u/png/Props/cloud_01.png'
import cloud02Url from '../../MBS_Toony_021523u/png/Props/cloud_02.png'
import cloud03Url from '../../MBS_Toony_021523u/png/Props/cloud_03.png'
import cloud04Url from '../../MBS_Toony_021523u/png/Props/cloud_04.png'
import cloud05Url from '../../MBS_Toony_021523u/png/Props/cloud_05.png'
import cloud06Url from '../../MBS_Toony_021523u/png/Props/cloud_06.png'
import bankUrl from '../../MBS_Toony_021523u/png/Buildings/bank.png'
import barberShopUrl from '../../MBS_Toony_021523u/png/Buildings/barber_shop.png'
import coinUrl from '../../MBS_Toony_021523u/png/Props/Coin.jpg'
import diamondUrl from '../../MBS_Toony_021523u/png/Props/Diamond.jpg'
import fenceWireUrl from '../../MBS_Toony_021523u/png/Props/fence_wire.png'
import groundStreet01Url from '../../MBS_Toony_021523u/png/Props/ground_street_01.png'
import groundStreet02Url from '../../MBS_Toony_021523u/png/Props/ground_street_02.png'
import {
  emitGameEvent,
  gameEvents,
  type BuildingType,
  type ShopPurchaseResult,
} from './GameEvents'
import { CameraController } from './CameraController'
import {
  BANK_LEVELS,
  getBankCapacity,
  getBankUpgradeCost,
} from './bankConfig'
import {
  DEFAULT_SHOP_PRICE,
  shopAssetEntries,
  visibleShopItems,
  type ShopItem,
} from './shopItems'
import {
  VehicleMovementSystem,
  type VehicleSpawnConfig,
} from './VehicleMovementSystem'
import {
  getVehicleDefinitionByKey,
  getVehicleDefinitionByType,
  isVehicleShopKey,
} from './vehicleConfig'
import {
  getOwnedVehicleTypes,
  getRequiredVehicleForBuildingLevel3,
  isVehicleRequirementMet,
} from './vehicleUnlockLogic'
import { isVehicleShopItem } from './vehiclePurchaseSystem'

type WeatherMode = 'sunny' | 'dark'
type CloudKey =
  | 'cloud-01'
  | 'cloud-02'
  | 'cloud-03'
  | 'cloud-04'
  | 'cloud-05'
  | 'cloud-06'
type GroundKey = 'ground-street-01' | 'ground-street-02'

type GroundTileData = {
  hasBuilding: boolean
}

type GroundFrameConfig = {
  frame: string
  x: number
  y: number
  width: number
  height: number
}

type WeatherLayer = {
  mode: WeatherMode
  background: Phaser.GameObjects.Graphics
  clouds: Phaser.GameObjects.Image[]
  alpha: number
}

type PlaceableType = 'building' | 'property' | 'background-building'
type PlaceableId = string

type SavedPlaceablePositions = Partial<
  Record<PlaceableId, { x: number; y: number }>
>

type SavedShopPlaceable = ShopItem & {
  id: PlaceableId
  x: number
  y: number
  shopKey?: string
  buildingType?: BuildingType
  level?: number
  isDefault: boolean
  canSell: boolean
}

type PlaceableShopItem = ShopItem &
  Partial<Pick<SavedShopPlaceable, 'shopKey' | 'buildingType' | 'level' | 'isDefault' | 'canSell'>>

type SavedGroundTiles = Partial<Record<string, GroundKey>>

type EconomyState = {
  coins: number
  diamonds: number
  bankLevel: number
  barberLevel: number
  lastCollectedAt: number
}

interface PlaceableObject {
  id: PlaceableId
  sprite: Phaser.GameObjects.Image
  type: PlaceableType
  originalX: number
  originalY: number
  previousX: number
  previousY: number
  baseY: number
  shopKey?: string
  price?: number
  itemType?: ShopItem['type']
  isDefault: boolean
  canSell: boolean
  shopItem?: PlaceableShopItem
}

type PlacementPreview = {
  item: ShopItem
  sprite: Phaser.GameObjects.Image
  type: PlaceableType
}

type CameraKeyboardKeys = {
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
}

export class GameScene extends Phaser.Scene {
  private readonly minWorldWidth = 3000
  private readonly cloudKeysByWeather: Record<WeatherMode, CloudKey[]> = {
    sunny: ['cloud-01', 'cloud-02', 'cloud-03'],
    dark: ['cloud-04', 'cloud-05', 'cloud-06'],
  }
  private readonly skyColors: Record<
    WeatherMode,
    { top: number; bottom: number }
  > = {
    sunny: {
      top: 0x9bd8f0,
      bottom: 0xd7f3ff,
    },
    dark: {
      top: 0x263244,
      bottom: 0x07111f,
    },
  }
  private readonly groundFrames: Record<GroundKey, GroundFrameConfig> = {
    'ground-street-01': {
      frame: 'street-ground',
      x: 3,
      y: 0,
      width: 129,
      height: 64,
    },
    'ground-street-02': {
      frame: 'street-ground',
      x: 4,
      y: 2,
      width: 129,
      height: 73,
    },
  }
  private readonly groundLayout: GroundTileData[] = [
    { hasBuilding: true },
    { hasBuilding: true },
    { hasBuilding: true },
    { hasBuilding: true },
    { hasBuilding: true },
    { hasBuilding: true },
    { hasBuilding: false },
  ]
  private readonly groundOverlap = 4
  private readonly groundBottomOffset = 36
  private readonly cameraKeyboardSpeed = 700
  private readonly buildingSnapSize = 32
  private readonly tapMaxDuration = 200
  private readonly tapMaxDistance = 8
  private readonly placeableStorageKey = 'after-gamifikasi-placeable-positions'
  private readonly shopPlaceableStorageKey = 'after-gamifikasi-shop-placeables'
  private readonly groundStorageKey = 'after-gamifikasi-ground-tiles'
  private readonly economyStorageKey = 'after-gamifikasi-economy-state'
  private readonly bankLevels = BANK_LEVELS
  private readonly barberLevels: Record<number, { coinPerSecond: number }> = {
    1: { coinPerSecond: 1 },
    2: { coinPerSecond: 2 },
    3: { coinPerSecond: 3 },
  }
  private readonly weatherSwitchDelay = 20000
  private readonly weatherFadeDuration = 3000
  private readonly maxDiamonds = 1000
  private readonly diamondProductionDelay = 10000
  private activeWeatherMode: WeatherMode = 'sunny'
  private coins = 0
  private diamonds = 0
  private maxCoins = this.bankLevels[1].capacity
  private bankLevel = 1
  private barberLevel = 1
  private lastCollectedAt = Date.now()
  private weatherLayers?: Record<WeatherMode, WeatherLayer>
  private weatherSwitchEvent?: Phaser.Time.TimerEvent
  private coinProductionTimer?: Phaser.Time.TimerEvent
  private diamondProductionTimer?: Phaser.Time.TimerEvent
  private groundBase?: Phaser.GameObjects.Rectangle
  private vehicleMovementSystem?: VehicleMovementSystem
  private ownedShopItemKeys: string[] = []
  private groundTiles: Phaser.GameObjects.Image[] = []
  private buildings: Phaser.GameObjects.Image[] = []
  private decorations: Phaser.GameObjects.Image[] = []
  private placeableObjects: PlaceableObject[] = []
  private placementPreview?: PlacementPreview
  private groundReplacementItem?: ShopItem
  private undoStack: Array<{
    sprite: Phaser.GameObjects.Image
    x: number
    y: number
  }> = []
  private cursors?: CameraKeyboardKeys
  private worldWidth = this.minWorldWidth
  private cameraController?: CameraController
  private isObjectDragging = false

  constructor() {
    super('GameScene')
  }

  preload() {
    const queuedImageKeys = new Set<string>()
    const loadImage = (key: string, url: string) => {
      if (queuedImageKeys.has(key)) {
        return
      }

      queuedImageKeys.add(key)
      this.load.image(key, url)
    }

    loadImage('cloud-01', cloud01Url)
    loadImage('cloud-02', cloud02Url)
    loadImage('cloud-03', cloud03Url)
    loadImage('cloud-04', cloud04Url)
    loadImage('cloud-05', cloud05Url)
    loadImage('cloud-06', cloud06Url)
    loadImage('building-bank', bankUrl)
    loadImage('building-barber-shop', barberShopUrl)
    loadImage('coin', coinUrl)
    loadImage('diamond', diamondUrl)
    loadImage('fence_wire', fenceWireUrl)
    loadImage('ground-street-01', groundStreet01Url)
    loadImage('ground-street-02', groundStreet02Url)

    shopAssetEntries.forEach(({ assetKey, imageUrl }) => {
      loadImage(assetKey, imageUrl)
    })
  }

  create() {
    const { width, height } = this.scale

    this.cameras.main.roundPixels = true
    this.worldWidth = this.getWorldWidth(width)
    this.cameras.main.setBounds(0, 0, this.worldWidth, height)
    this.cameraController = new CameraController(this, () => this.worldWidth)
    this.vehicleMovementSystem = new VehicleMovementSystem(this)
    this.createGroundFrames()
    this.layoutWeatherLayers(width, height, this.worldWidth)
    this.layoutGround(this.worldWidth, height)
    this.initializeEconomy()
    this.setupControls()
    this.startWeatherSwitching()
    this.startCoinProduction()
    this.startDiamondProduction()

    this.scale.on('resize', this.handleResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this)
      this.input.off('pointerdown', this.handlePointerDown, this)
      this.input.off('pointermove', this.handlePointerMove, this)
      this.input.off('pointerup', this.handlePointerUp, this)
      this.input.off('pointerupoutside', this.handlePointerUp, this)
      this.input.keyboard?.off('keydown-Z', this.handleUndoShortcut, this)
      gameEvents.removeEventListener(
        'UPGRADE_BUILDING',
        this.handleUpgradeBuildingCommand,
      )
      gameEvents.removeEventListener(
        'BUY_SHOP_ITEM',
        this.handleBuyShopItemCommand,
      )
      gameEvents.removeEventListener(
        'SELL_PLACEABLE',
        this.handleSellPlaceableCommand,
      )
      gameEvents.removeEventListener(
        'SELL_PLACED_OBJECT',
        this.handleSellPlaceableCommand,
      )
      gameEvents.removeEventListener(
        'ADMIN_RESET_CURRENCY',
        this.handleAdminResetCurrencyCommand,
      )
      gameEvents.removeEventListener(
        'ADMIN_ADD_COINS',
        this.handleAdminAddCoinsCommand,
      )
      gameEvents.removeEventListener(
        'ADMIN_ADD_DIAMONDS',
        this.handleAdminAddDiamondsCommand,
      )
      gameEvents.removeEventListener(
        'SYNC_GAME_CURRENCY',
        this.handleSyncGameCurrencyCommand,
      )
      gameEvents.removeEventListener(
        'SYNC_OWNED_SHOP_ITEMS',
        this.handleSyncOwnedShopItemsCommand,
      )
      gameEvents.removeEventListener(
        'REQUEST_CITY_PROGRESS',
        this.handleRequestCityProgressCommand,
      )
      gameEvents.removeEventListener(
        'UPGRADE_PLACED_BUILDING',
        this.handleUpgradePlacedBuildingCommand,
      )
      this.weatherSwitchEvent?.remove(false)
      this.coinProductionTimer?.remove(false)
      this.diamondProductionTimer?.remove(false)
      this.destroyPlacementPreview()
      this.cameraController?.cancel()
      this.vehicleMovementSystem?.clear()
      this.groundReplacementItem = undefined
    })
  }

  update(_time: number, delta: number) {
    this.cameraController?.update(delta)
    this.vehicleMovementSystem?.update(delta)

    if (!this.cursors || this.isEditableElementActive()) {
      return
    }

    const scrollStep = this.cameraKeyboardSpeed * (delta / 1000)

    if (this.cursors.left.isDown) {
      this.cameraController?.setScrollX(this.cameras.main.scrollX - scrollStep)
    }

    if (this.cursors.right.isDown) {
      this.cameraController?.setScrollX(this.cameras.main.scrollX + scrollStep)
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.worldWidth = this.getWorldWidth(gameSize.width)
    this.cameras.main.setBounds(0, 0, this.worldWidth, gameSize.height)
    this.layoutWeatherLayers(gameSize.width, gameSize.height, this.worldWidth)
    this.layoutGround(this.worldWidth, gameSize.height)
    this.cameraController?.clampToBounds()
  }

  private layoutWeatherLayers(width: number, height: number, worldWidth: number) {
    this.destroyWeatherLayers()

    const sunnyLayer = this.createWeatherLayer(
      'sunny',
      width,
      height,
      worldWidth,
      this.activeWeatherMode === 'sunny' ? 1 : 0,
    )
    const darkLayer = this.createWeatherLayer(
      'dark',
      width,
      height,
      worldWidth,
      this.activeWeatherMode === 'dark' ? 1 : 0,
    )

    this.weatherLayers = {
      sunny: sunnyLayer,
      dark: darkLayer,
    }
  }

  private createWeatherLayer(
    mode: WeatherMode,
    width: number,
    height: number,
    worldWidth: number,
    alpha: number,
  ): WeatherLayer {
    const colors = this.skyColors[mode]
    const background = this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(-30)

    background
      .fillGradientStyle(colors.top, colors.top, colors.bottom, colors.bottom)
      .fillRect(0, 0, width, height)

    const layer: WeatherLayer = {
      mode,
      background,
      clouds: [],
      alpha,
    }
    const cloudKeys = this.cloudKeysByWeather[mode]
    const cloudScale = Phaser.Math.Clamp(height / 1600, 0.18, 0.35)
    const cloudYPositions = [height * 0.16, height * 0.25, height * 0.12]
    const cloudStep = 520
    let x = -120
    let index = 0

    while (x < worldWidth + cloudStep) {
      const key = cloudKeys[index % cloudKeys.length]
      const y = cloudYPositions[index % cloudYPositions.length]
      const scale = cloudScale * (index % 2 === 0 ? 1 : 0.82)
      const direction = index % 2 === 0 ? 1 : -1
      const travelDistance = 90 + (index % 3) * 35
      const cloud = this.add
        .image(x, y, key)
        .setOrigin(0.5, 0.5)
        .setScale(scale)
        .setDepth(-20)
        .setScrollFactor(0.35)

      this.tweens.add({
        targets: cloud,
        x: x + travelDistance * direction,
        duration: 45000 + (index % 4) * 9000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })

      layer.clouds.push(cloud)
      x += cloudStep
      index += 1
    }

    this.setWeatherLayerAlpha(layer, alpha)

    return layer
  }

  private startWeatherSwitching() {
    this.weatherSwitchEvent = this.time.addEvent({
      delay: this.weatherSwitchDelay,
      loop: true,
      callback: this.switchWeather,
      callbackScope: this,
    })
  }

  private initializeEconomy() {
    const savedState = this.getSavedEconomyState()

    this.bankLevel = savedState?.bankLevel ?? 1
    this.barberLevel = savedState?.barberLevel ?? 1
    this.maxCoins = this.bankLevels[this.bankLevel].capacity
    this.coins = Math.floor(
      Phaser.Math.Clamp(savedState?.coins ?? 0, 0, this.maxCoins),
    )
    this.diamonds = Math.floor(
      Phaser.Math.Clamp(savedState?.diamonds ?? 0, 0, this.maxDiamonds),
    )
    this.lastCollectedAt = savedState?.lastCollectedAt ?? Date.now()

    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private startCoinProduction() {
    if (this.coinProductionTimer) {
      this.coinProductionTimer.remove(false)
      this.coinProductionTimer = undefined
    }

    this.coinProductionTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.produceCoinsOnce,
      callbackScope: this,
    })
  }

  private produceCoinsOnce() {
    if (!this.hasPlacedBarberShop()) {
      return
    }

    if (this.coins >= this.maxCoins) {
      return
    }

    const level = this.getPrimaryBarberLevel()
    const rate = this.barberLevels[level]?.coinPerSecond ?? 1

    this.coins = Math.floor(Math.min(this.maxCoins, this.coins + rate))
    this.lastCollectedAt = Date.now()
    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private startDiamondProduction() {
    if (this.diamondProductionTimer) {
      this.diamondProductionTimer.remove(false)
      this.diamondProductionTimer = undefined
    }

    this.diamondProductionTimer = this.time.addEvent({
      delay: this.diamondProductionDelay,
      loop: true,
      callback: this.produceDiamondsOnce,
      callbackScope: this,
    })
  }

  private produceDiamondsOnce() {
    if (!this.hasPlacedBarberShop()) {
      return
    }

    if (this.diamonds >= this.maxDiamonds) {
      return
    }

    this.diamonds = Math.floor(Math.min(this.maxDiamonds, this.diamonds + 1))
    this.lastCollectedAt = Date.now()
    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private upgradeBank() {
    if (this.bankLevel >= 3) {
      return
    }

    const upgradeCost = getBankUpgradeCost(this.bankLevel)

    if (!upgradeCost) {
      return
    }

    if (this.coins < upgradeCost) {
      emitGameEvent(
        'SHOP_ERROR',
        `Coin tidak cukup. Upgrade Bank LV ${this.bankLevel + 1} butuh ${upgradeCost.toLocaleString('id-ID')} coin.`,
      )
      this.emitCurrencyUpdate()
      return
    }

    this.coins = Math.floor(this.coins - upgradeCost)
    this.bankLevel += 1
    this.maxCoins = getBankCapacity(this.bankLevel)
    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private upgradeBarber() {
    if (this.barberLevel >= 3) {
      return
    }

    this.barberLevel += 1
    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private emitCurrencyUpdate() {
    const coins = Math.floor(this.coins)
    const diamonds = Math.floor(this.diamonds)
    const currencyState = {
      coins,
      maxCoins: this.maxCoins,
      diamonds,
      maxDiamonds: this.maxDiamonds,
      bankLevel: this.bankLevel,
      barberLevel: this.barberLevel,
      bankCapacity: this.bankLevels[this.bankLevel].capacity,
      barberCoinPerSecond: this.barberLevels[this.barberLevel].coinPerSecond,
      coinPerSecond: this.barberLevels[this.barberLevel].coinPerSecond,
    }

    emitGameEvent('CURRENCY_UPDATE', currencyState)
    emitGameEvent('COINS_UPDATED', currencyState)
    this.emitCityProgressUpdate()
  }

  private emitCityProgressUpdate() {
    const buildingCount = this.placeableObjects.filter(
      (placeable) => placeable.type === 'building',
    ).length
    const vehicleNpcCount = this.vehicleMovementSystem?.getVehicleCount() ?? 0
    const passiveIncomePerCycle = this.hasPlacedBarberShop()
      ? this.barberLevels[this.barberLevel].coinPerSecond
      : 0
    const cityLevel = Math.max(1, this.bankLevel + this.barberLevel - 1)

    emitGameEvent('CITY_PROGRESS_UPDATE', {
      buildingCount,
      vehicleNpcCount,
      passiveIncomePerCycle,
      cityLevel,
    })
  }

  private openBuildingModal(type: BuildingType) {
    emitGameEvent('OPEN_BUILDING_MODAL', {
      type,
      level: type === 'bank' ? this.bankLevel : this.barberLevel,
    })
  }

  private openPlaceableModal(placeable: PlaceableObject) {
    const buildingType = this.getBuildingTypeForPlaceable(placeable)

    if (
      placeable.itemType === 'ground' ||
      placeable.shopKey?.startsWith('ground_street')
    ) {
      return
    }

    if (!placeable.shopItem) {
      if (buildingType) {
        this.openBuildingModal(buildingType)
      }

      return
    }

    const price =
      placeable.price && placeable.price > 0
        ? placeable.price
        : placeable.shopItem.price && placeable.shopItem.price > 0
          ? placeable.shopItem.price
          : DEFAULT_SHOP_PRICE

    const placeableUpgradeState = this.getPlaceableUpgradeState(placeable)

    emitGameEvent('OPEN_BUILDING_MODAL', {
      type: buildingType ?? undefined,
      level: buildingType
        ? buildingType === 'bank'
          ? this.bankLevel
          : buildingType === 'barber'
            ? this.barberLevel
            : placeableUpgradeState.level
        : placeableUpgradeState.level,
      placeableId: placeable.id,
      shopKey: placeable.shopKey,
      name: placeable.shopItem.name,
      itemType: placeable.itemType,
      imageUrl: placeable.shopItem.imageUrl,
      price,
      sellPrice: placeable.canSell ? Math.floor(price * 0.5) : undefined,
      isDefault: placeable.isDefault,
      canSell: placeable.canSell,
      canUpgrade: placeableUpgradeState.canUpgrade,
      upgradeRequirement: placeableUpgradeState.requirement,
    })
  }

  private readonly handleUpgradeBuildingCommand = (event: Event) => {
    const { type } = (event as CustomEvent<{ type: BuildingType }>).detail

    if (type === 'bank') {
      this.upgradeBank()
    } else if (type === 'barber') {
      this.upgradeBarber()
    }
  }

  private readonly handleUpgradePlacedBuildingCommand = (event: Event) => {
    const { placeableId } = (
      event as CustomEvent<{ placeableId: string }>
    ).detail
    const placeable = this.placeableObjects.find(
      (item) => item.id === placeableId,
    )

    if (!placeable?.shopItem || placeable.itemType !== 'building') {
      emitGameEvent('SHOP_ERROR', 'Building tidak bisa di-upgrade.')
      return
    }

    const buildingType = this.getBuildingTypeForPlaceable(placeable)

    if (buildingType === 'bank' || buildingType === 'barber') {
      return
    }

    const upgradeState = this.getPlaceableUpgradeState(placeable)

    if (!upgradeState.canUpgrade) {
      emitGameEvent(
        'SHOP_ERROR',
        upgradeState.requirement ?? 'Requirement upgrade belum terpenuhi.',
      )
      this.openPlaceableModal(placeable)
      return
    }

    placeable.shopItem.level = Math.min((upgradeState.level ?? 1) + 1, 3)
    this.saveShopPlaceables()
    this.openPlaceableModal(placeable)
    this.emitCityProgressUpdate()
  }

  private readonly handleBuyShopItemCommand = (event: Event) => {
    const { item } = (event as CustomEvent<{ item: ShopItem }>).detail

    if (isVehicleShopItem(item)) {
      this.buyVehicleItem(item)
      return
    }

    if (item.key === 'bank') {
      emitGameEvent('SHOP_ERROR', 'Bank hanya boleh ada 1 di kota')
      return
    }

    if (item.key.toLowerCase().includes('background')) {
      emitGameEvent('SHOP_ERROR', 'Item background tidak bisa dibeli')
      return
    }

    if (!this.textures.exists(item.assetKey)) {
      emitGameEvent('SHOP_ERROR', 'Asset belum tersedia')
      return
    }

    if (!this.hasEnoughCurrencyForItem(item)) {
      emitGameEvent('SHOP_ERROR', `${this.getItemCurrencyName(item)} tidak cukup`)
      this.emitCurrencyUpdate()
      return
    }

    if (item.type === 'ground') {
      this.startGroundReplacementMode(item)
      return
    }

    this.startPlacementMode(item)
  }

  private readonly handleSellPlaceableCommand = (event: Event) => {
    const { placeableId } = (
      event as CustomEvent<{ placeableId: string }>
    ).detail
    const placeable = this.placeableObjects.find(
      (item) => item.id === placeableId,
    )

    if (!placeable?.shopItem) {
      emitGameEvent('SHOP_ERROR', 'Object ini tidak bisa dijual')
      return
    }

    if (placeable.isDefault || !placeable.canSell) {
      console.warn('Default object cannot be sold')
      emitGameEvent('SHOP_ERROR', 'Object default tidak bisa dijual')
      return
    }

    const sellPrice = Math.floor(placeable.shopItem.price * 0.5)

    this.coins = Math.floor(Math.min(this.maxCoins, this.coins + sellPrice))
    this.removePlaceable(placeable)
    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private readonly handleAdminResetCurrencyCommand = () => {
    this.coins = 0
    this.diamonds = 0
    this.lastCollectedAt = Date.now()
    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private readonly handleAdminAddCoinsCommand = (event: Event) => {
    const { amount } = (event as CustomEvent<{ amount: number }>).detail

    this.coins = Math.floor(
      Math.min(this.maxCoins, this.coins + Math.max(amount, 0)),
    )
    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private readonly handleAdminAddDiamondsCommand = (event: Event) => {
    const { amount } = (event as CustomEvent<{ amount: number }>).detail

    this.diamonds = Math.floor(
      Math.min(this.maxDiamonds, this.diamonds + Math.max(amount, 0)),
    )
    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private readonly handleSyncGameCurrencyCommand = (event: Event) => {
    const { coins, diamonds } = (
      event as CustomEvent<{ coins: number; diamonds: number }>
    ).detail

    this.coins = Math.floor(Phaser.Math.Clamp(coins, 0, this.maxCoins))
    this.diamonds = Math.floor(
      Phaser.Math.Clamp(diamonds, 0, this.maxDiamonds),
    )
    this.saveEconomyState()
    this.emitCurrencyUpdate()
  }

  private readonly handleSyncOwnedShopItemsCommand = (event: Event) => {
    const { itemKeys } = (
      event as CustomEvent<{ itemKeys: string[] }>
    ).detail

    this.ownedShopItemKeys = Array.isArray(itemKeys)
      ? Array.from(new Set(itemKeys.filter((key) => isVehicleShopKey(key))))
      : []
    this.syncVehicleSpawns()
    this.emitCityProgressUpdate()
  }

  private readonly handleRequestCityProgressCommand = () => {
    this.emitCityProgressUpdate()
  }

  private startPlacementMode(item: ShopItem) {
    this.destroyPlacementPreview()
    this.groundReplacementItem = undefined

    const targetTile = this.findNearestGroundStreet02(
      this.cameras.main.scrollX + this.scale.width / 2,
    )

    if (!targetTile) {
      emitGameEvent('SHOP_ERROR', 'Ground street 02 tidak tersedia')
      return
    }

    const type = this.getPlaceableTypeFromShopItem(item)
    const baseY = this.getGroundStreetTopY(targetTile)
    const preview = this.add
      .image(this.getTileCenterX(targetTile), baseY, item.assetKey)
      .setOrigin(0.5, 1)
      .setScale(this.getShopItemScale(item.assetKey))
      .setDepth(99)
      .setAlpha(0.72)
      .setTint(0xffffaa)

    this.placementPreview = {
      item,
      sprite: preview,
      type,
    }

    this.updatePlacementPreviewPosition(preview.x)
  }

  private updatePlacementPreviewPosition(worldX: number) {
    if (!this.placementPreview) {
      return
    }

    const { sprite, type } = this.placementPreview
    const nearestTile = this.findNearestGroundStreet02(worldX)

    if (!nearestTile) {
      sprite.setTint(0xff8888)
      return
    }

    const groundArea = this.getConnectedGroundStreet02Area(nearestTile)
    const halfWidth = sprite.displayWidth / 2
    const minX = Math.max(groundArea.minX + halfWidth, halfWidth)
    const maxX = Math.min(
      groundArea.maxX - halfWidth,
      this.worldWidth - halfWidth,
    )
    const targetY = this.getGroundStreetTopY(nearestTile)

    if (minX > maxX) {
      sprite.setPosition(this.getTileCenterX(nearestTile), targetY)
      sprite.setTint(0xff8888)
      return
    }

    sprite.setPosition(Phaser.Math.Clamp(worldX, minX, maxX), targetY)

    if (
      this.isFullyOnGroundStreet02(sprite) &&
      !this.hasBuildingSpriteCollision(sprite, type)
    ) {
      sprite.setTint(0xffffaa)
      return
    }

    sprite.setTint(0xff8888)
  }

  private placePreviewItem(worldX: number) {
    if (!this.placementPreview) {
      return
    }

    const { item, sprite, type } = this.placementPreview

    this.updatePlacementPreviewPosition(worldX)

    if (!this.isFullyOnGroundStreet02(sprite)) {
      emitGameEvent('SHOP_ERROR', 'Pilih posisi di atas ground-street-02')
      return
    }

    if (this.hasBuildingSpriteCollision(sprite, type)) {
      emitGameEvent('SHOP_ERROR', 'Bangunan bertabrakan')
      return
    }

    if (!this.completeShopPurchase(item)) {
      return
    }

    const placedSprite = sprite
    const id = `${item.key}-${Date.now()}`
    const baseY = placedSprite.y
    const placedItem: PlaceableShopItem = {
      ...item,
      isDefault: false,
      canSell: true,
    }

    placedSprite
      .setAlpha(1)
      .clearTint()
      .setDepth(this.getPlaceableRestingDepth(type))

    this.addPlaceableSpriteToCollection(placedSprite, type)
    this.placementPreview = undefined
    this.registerPlaceable(id, placedSprite, type, baseY, placedItem)
    this.saveShopPlaceables()
  }

  private destroyPlacementPreview() {
    this.placementPreview?.sprite.destroy()
    this.placementPreview = undefined
  }

  private startGroundReplacementMode(item: ShopItem) {
    this.destroyPlacementPreview()
    this.groundReplacementItem = item
  }

  private replaceGroundTileAt(worldX: number, worldY: number) {
    const item = this.groundReplacementItem

    if (!item) {
      return
    }

    const nextGroundKey = this.getGroundKeyFromShopItem(item)
    const targetTile = this.findGroundTileAt(worldX, worldY)

    if (!nextGroundKey || !targetTile) {
      emitGameEvent('SHOP_ERROR', 'Klik tile ground existing')
      return
    }

    if (this.isGroundTileOccupied(targetTile)) {
      emitGameEvent('SHOP_ERROR', 'Tile ini sedang ditempati object')
      return
    }

    if (!this.completeShopPurchase(item)) {
      return
    }

    targetTile.setTexture(nextGroundKey, this.groundFrames[nextGroundKey].frame)
    targetTile.setData('groundKey', nextGroundKey)
    this.saveGroundTile(targetTile, nextGroundKey)
    this.groundReplacementItem = undefined
  }

  private completeShopPurchase(item: ShopItem) {
    if (!this.hasEnoughCurrencyForItem(item)) {
      emitGameEvent('SHOP_ERROR', `${this.getItemCurrencyName(item)} tidak cukup`)
      this.emitCurrencyUpdate()
      return false
    }

    const purchaseResult = this.requestShopPurchase(item)

    if (!purchaseResult.success) {
      emitGameEvent('SHOP_ERROR', purchaseResult.message)
      this.emitCurrencyUpdate()
      return false
    }

    this.coins = Math.floor(Phaser.Math.Clamp(purchaseResult.coins, 0, this.maxCoins))
    this.diamonds = Math.floor(
      Phaser.Math.Clamp(purchaseResult.diamonds, 0, this.maxDiamonds),
    )
    this.saveEconomyState()
    this.emitCurrencyUpdate()

    return true
  }

  private buyVehicleItem(item: ShopItem) {
    const definition = getVehicleDefinitionByKey(item.key)

    if (!definition || !item.vehicleType) {
      emitGameEvent('SHOP_ERROR', 'Vehicle tidak ditemukan.')
      return
    }

    if (definition.unavailable || !this.textures.exists(item.assetKey)) {
      emitGameEvent('SHOP_ERROR', 'Asset vehicle belum tersedia.')
      return
    }

    if (this.ownedShopItemKeys.includes(item.key)) {
      emitGameEvent('SHOP_ERROR', 'Vehicle sudah dimiliki.')
      return
    }

    if (!isVehicleRequirementMet(item.vehicleType)) {
      emitGameEvent('SHOP_ERROR', item.unlockRequirement ?? 'Vehicle masih locked.')
      return
    }

    if (
      definition.limitGroup &&
      this.ownedShopItemKeys.some((ownedKey) => {
        const ownedDefinition = getVehicleDefinitionByKey(ownedKey)

        return ownedDefinition?.limitGroup === definition.limitGroup
      })
    ) {
      emitGameEvent('SHOP_ERROR', 'Vehicle limit untuk building ini sudah tercapai.')
      return
    }

    if (!this.completeShopPurchase(item)) {
      return
    }

    this.ownedShopItemKeys = Array.from(
      new Set([...this.ownedShopItemKeys, item.key]),
    )
    this.syncVehicleSpawns()
    this.emitCityProgressUpdate()
  }

  private requestShopPurchase(item: ShopItem): ShopPurchaseResult {
    let purchaseResult: ShopPurchaseResult | null = null

    emitGameEvent('SHOP_PURCHASE_REQUEST', {
      item,
      resolve: (result) => {
        purchaseResult = result
      },
    })

    if (purchaseResult) {
      return purchaseResult
    }

    if (!this.hasEnoughCurrencyForItem(item)) {
      return {
        success: false,
        message: `${this.getItemCurrencyName(item)} tidak cukup`,
        coins: this.coins,
        diamonds: this.diamonds,
      }
    }

    if ((item.currencyType ?? 'coin') === 'diamond') {
      return {
        success: true,
        message: 'Pembelian berhasil.',
        coins: this.coins,
        diamonds: this.diamonds - item.price,
      }
    }

    return {
      success: true,
      message: 'Pembelian berhasil.',
      coins: this.coins - item.price,
      diamonds: this.diamonds,
    }
  }

  private hasEnoughCurrencyForItem(item: ShopItem) {
    return this.getItemCurrencyAmount(item) >= item.price
  }

  private getItemCurrencyAmount(item: ShopItem) {
    return (item.currencyType ?? 'coin') === 'diamond'
      ? this.diamonds
      : this.coins
  }

  private getItemCurrencyName(item: ShopItem) {
    return (item.currencyType ?? 'coin') === 'diamond' ? 'Diamond' : 'Coin'
  }

  private switchWeather() {
    const nextMode = this.activeWeatherMode === 'sunny' ? 'dark' : 'sunny'
    const currentLayer = this.weatherLayers?.[this.activeWeatherMode]
    const nextLayer = this.weatherLayers?.[nextMode]

    if (!currentLayer || !nextLayer) {
      this.activeWeatherMode = nextMode
      return
    }

    this.activeWeatherMode = nextMode

    this.tweens.killTweensOf(currentLayer)
    this.tweens.killTweensOf(nextLayer)

    this.tweens.add({
      targets: currentLayer,
      alpha: 0,
      duration: this.weatherFadeDuration,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.setWeatherLayerAlpha(currentLayer, currentLayer.alpha),
    })

    this.tweens.add({
      targets: nextLayer,
      alpha: 1,
      duration: this.weatherFadeDuration,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.setWeatherLayerAlpha(nextLayer, nextLayer.alpha),
    })
  }

  private setWeatherLayerAlpha(layer: WeatherLayer, alpha: number) {
    layer.alpha = alpha
    layer.background.setAlpha(alpha)

    const cloudAlpha = layer.mode === 'sunny' ? 0.92 : 0.88

    layer.clouds.forEach((cloud) => cloud.setAlpha(alpha * cloudAlpha))
  }

  private destroyWeatherLayers() {
    if (!this.weatherLayers) {
      return
    }

    Object.values(this.weatherLayers).forEach((layer) => {
      this.tweens.killTweensOf(layer)
      layer.background.destroy()
      layer.clouds.forEach((cloud) => {
        this.tweens.killTweensOf(cloud)
        cloud.destroy()
      })
    })

    this.weatherLayers = undefined
  }

  private layoutGround(worldWidth: number, height: number) {
    this.groundBase?.destroy()
    this.vehicleMovementSystem?.clear()
    this.decorations.forEach((decoration) => decoration.destroy())
    this.buildings.forEach((building) => building.destroy())
    this.groundTiles.forEach((tile) => tile.destroy())
    this.decorations = []
    this.buildings = []
    this.groundTiles = []
    this.placeableObjects = []
    this.undoStack = []

    const groundScale = Phaser.Math.Clamp(height / 720, 0.75, 1)
    const groundY = height - this.groundBottomOffset
    this.groundBase = this.add
      .rectangle(0, groundY - 1, worldWidth, this.groundBottomOffset + 1, 0x2f3030)
      .setOrigin(0, 0)
      .setDepth(-1)
    let x = 0
    let index = 0
    const savedGroundTiles = this.getSavedGroundTiles()

    while (x < worldWidth) {
      const tileData = this.groundLayout[index % this.groundLayout.length]
      const key = savedGroundTiles[index] ?? this.getGroundKey(tileData)
      const frame = this.groundFrames[key].frame
      const tileX = Math.round(x)
      const tile = this.add
        .image(tileX, groundY, key, frame)
        .setOrigin(0, 1)
        .setScale(groundScale)
        .setDepth(0)

      tile.setData('groundKey', key)
      tile.setData('tileIndex', index)
      this.groundTiles.push(tile)

      x = tileX + Math.ceil(tile.displayWidth) - this.groundOverlap
      index += 1
    }

    const savedObjects = this.loadPlacedObjects()

    if (!savedObjects || savedObjects.length === 0) {
      const starterObjects = this.spawnStarterObjects()

      this.savePlacedObjects(starterObjects)
      this.spawnPlacedObjects(starterObjects)
    } else {
      const placedObjects = this.ensureStarterObjects(savedObjects)

      this.spawnPlacedObjects(placedObjects)
    }

    this.syncVehicleSpawns()
  }

  private syncVehicleSpawns() {
    const streetTiles = this.getGroundStreet02Tiles()

    if (!this.vehicleMovementSystem || streetTiles.length === 0) {
      return
    }

    const ownedVehicleItems = this.ownedShopItemKeys.flatMap((key) => {
      const definition = getVehicleDefinitionByKey(key)

      if (
        !definition ||
        definition.vehicleType === 'taxi' ||
        definition.unavailable ||
        !this.textures.exists(definition.assetKey)
      ) {
        return []
      }

      return [definition]
    })
    const vehicleConfigs: VehicleSpawnConfig[] = ownedVehicleItems.flatMap(
      (vehicle, index) => {
        const tile = streetTiles[(index * 2 + 2) % streetTiles.length]

        if (!tile) {
          return []
        }

        const groundArea = this.getConnectedGroundStreet02Area(tile)
        const margin = 96
        const minX = Math.max(groundArea.minX + margin, margin)
        const maxX = Math.min(groundArea.maxX - margin, this.worldWidth - margin)

        if (minX >= maxX) {
          return []
        }

        const progress = (index + 1) / (ownedVehicleItems.length + 1)
        const x = Phaser.Math.Linear(minX, maxX, progress)

        return [
          {
            id: vehicle.key,
            vehicleType: vehicle.vehicleType,
            assetKey: vehicle.assetKey,
            x,
            baseY: this.getVehicleLaneY(tile, index),
            minX,
            maxX,
            scaleMultiplier: this.getVehicleScaleMultiplier(),
            delay: index * 550,
            onPointerDown: (pointer) => {
              this.cameraController?.handlePointerDown(pointer)
            },
            onPointerMove: (pointer) => {
              this.cameraController?.handlePointerMove(pointer)
            },
            onPointerUp: (pointer) =>
              this.cameraController?.handlePointerUp(pointer) ?? false,
            onClick: () => {
              emitGameEvent('OPEN_NPC_PANEL', {})
            },
          },
        ]
      },
    )

    this.vehicleMovementSystem.setVehicles(vehicleConfigs)
    this.emitCityProgressUpdate()
  }

  private getVehicleLaneY(tile: Phaser.GameObjects.Image, index: number) {
    return tile.y - 7 - (index % 2) * 7
  }

  private getVehicleScaleMultiplier() {
    return this.scale.width < 640 ? 0.9 : 1
  }

  private spawnStarterObjects() {
    const anchorTile = this.groundTiles.find(
      (tile) => tile.getData('groundKey') === 'ground-street-02',
    )

    if (!anchorTile) {
      return []
    }

    const baseY = this.getGroundStreetTopY(anchorTile)
    const bankX = this.getTileCenterX(anchorTile)
    const fenceX = bankX + 120
    const starterObjects: SavedShopPlaceable[] = [
      {
        id: 'starter-bank',
        key: 'bank',
        shopKey: 'bank',
        name: 'Bank',
        assetKey: 'building-bank',
        type: 'building',
        buildingType: 'bank',
        level: 1,
        price: DEFAULT_SHOP_PRICE,
        imageUrl: bankUrl,
        x: bankX,
        y: baseY,
        isDefault: true,
        canSell: false,
      },
      {
        id: 'starter-fence-wire',
        key: 'fence_wire',
        shopKey: 'fence_wire',
        name: 'Fence Wire',
        assetKey: 'fence_wire',
        type: 'decoration',
        level: 1,
        price: DEFAULT_SHOP_PRICE,
        imageUrl: fenceWireUrl,
        x: fenceX,
        y: baseY,
        isDefault: true,
        canSell: false,
      },
    ]

    return starterObjects
  }

  private ensureStarterObjects(savedObjects: SavedShopPlaceable[]) {
    const starterObjects = this.spawnStarterObjects()

    if (starterObjects.length === 0) {
      return savedObjects
    }

    const nextObjects = [...savedObjects]
    let didRepairObjects = false

    starterObjects.forEach((starterObject) => {
      if (
        this.hasEquivalentPlacedObject(nextObjects, starterObject)
      ) {
        return
      }

      nextObjects.push(starterObject)
      didRepairObjects = true
    })

    if (didRepairObjects) {
      this.savePlacedObjects(nextObjects)
    }

    return nextObjects
  }

  private getPlaceableTypeFromShopItem(item: Pick<ShopItem, 'type'>) {
    return item.type === 'building' ? 'building' : 'property'
  }

  private getGroundKeyFromShopItem(item: ShopItem): GroundKey | null {
    if (item.assetKey === 'ground-street-01' || item.key === 'ground_street_01') {
      return 'ground-street-01'
    }

    if (item.assetKey === 'ground-street-02' || item.key === 'ground_street_02') {
      return 'ground-street-02'
    }

    return null
  }

  private getShopItemScale(assetKey: string) {
    if (assetKey === 'building-bank') {
      return 0.43
    }

    if (assetKey === 'building-barber-shop') {
      return 0.54
    }

    if (assetKey === 'fence_wire') {
      return 0.55
    }

    return 0.5
  }

  private addPlaceableSpriteToCollection(
    sprite: Phaser.GameObjects.Image,
    type: PlaceableType,
  ) {
    if (type === 'building') {
      this.buildings.push(sprite)
      return
    }

    this.decorations.push(sprite)
  }

  private removePlaceable(placeable: PlaceableObject) {
    this.placeableObjects = this.placeableObjects.filter(
      (item) => item !== placeable,
    )
    this.buildings = this.buildings.filter(
      (sprite) => sprite !== placeable.sprite,
    )
    this.decorations = this.decorations.filter(
      (sprite) => sprite !== placeable.sprite,
    )
    this.undoStack = this.undoStack.filter(
      (entry) => entry.sprite !== placeable.sprite,
    )

    const savedPositions = this.getSavedPlaceablePositions()

    delete savedPositions[placeable.id]

    try {
      localStorage.setItem(
        this.placeableStorageKey,
        JSON.stringify(savedPositions),
      )
    } catch {
      // Position persistence is optional; gameplay should continue without storage.
    }

    placeable.sprite.destroy()
    this.saveShopPlaceables()
  }

  private registerPlaceable(
    id: PlaceableId,
    sprite: Phaser.GameObjects.Image,
    type: PlaceableType,
    baseY: number,
    shopItem?: PlaceableShopItem,
  ) {
    const defaultX = sprite.x
    const defaultY = sprite.y
    let restoredBaseY = this.applySavedPlaceablePosition(id, sprite, baseY)
    const isDefault = shopItem?.isDefault ?? this.isDefaultStarterObjectId(id)
    const canSell = shopItem?.canSell ?? !isDefault
    let placeable: PlaceableObject = {
      id,
      sprite,
      type,
      originalX: sprite.x,
      originalY: sprite.y,
      previousX: sprite.x,
      previousY: sprite.y,
      baseY: restoredBaseY,
      shopKey: shopItem?.shopKey ?? shopItem?.key,
      price: shopItem?.price,
      itemType: shopItem?.type,
      isDefault,
      canSell,
      shopItem: shopItem
        ? {
            ...shopItem,
            isDefault,
            canSell,
          }
        : undefined,
    }

    if (this.hasBuildingCollision(placeable)) {
      sprite.setPosition(defaultX, defaultY)
      restoredBaseY = baseY
      placeable = {
        ...placeable,
        originalX: defaultX,
        originalY: defaultY,
        previousX: defaultX,
        previousY: defaultY,
        baseY: restoredBaseY,
        shopKey: shopItem?.shopKey ?? shopItem?.key,
        price: shopItem?.price,
        itemType: shopItem?.type,
        isDefault,
        canSell,
        shopItem: shopItem
          ? {
              ...shopItem,
              isDefault,
              canSell,
            }
          : undefined,
      }
    }

    this.placeableObjects.push(placeable)
    this.makePlaceableDraggable(placeable)
  }

  private makePlaceableDraggable(placeable: PlaceableObject) {
    const { sprite } = placeable
    const originalScaleX = sprite.scaleX
    const originalScaleY = sprite.scaleY
    const restingDepth = this.getPlaceableRestingDepth(placeable.type)
    let didDrag = false
    let pointerDownAt = 0
    let pointerStartX = 0
    let pointerStartY = 0

    sprite.setInteractive({ draggable: true })
    this.input.setDraggable(sprite)

    sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      didDrag = false
      pointerDownAt = this.time.now
      pointerStartX = pointer.x
      pointerStartY = pointer.y

      if (pointer.wasTouch) {
        this.cameraController?.handlePointerDown(pointer)
        return
      }

      this.isObjectDragging = true
      this.cameraController?.cancel()
    })

    sprite.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const didCameraDrag =
        this.cameraController?.handlePointerUp(pointer) ??
        this.cameraController?.didDrag(pointer) ??
        false
      const pressDuration = this.time.now - pointerDownAt
      const moveDistance = Phaser.Math.Distance.Between(
        pointerStartX,
        pointerStartY,
        pointer.x,
        pointer.y,
      )
      this.isObjectDragging = false

      if (
        didCameraDrag ||
        didDrag ||
        this.placementPreview ||
        this.groundReplacementItem ||
        pressDuration > this.tapMaxDuration ||
        moveDistance > this.tapMaxDistance
      ) {
        return
      }

      this.openPlaceableModal(placeable)
    })

    sprite.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      if (pointer.wasTouch) {
        didDrag = true
        this.isObjectDragging = false
        return
      }

      didDrag = true
      placeable.previousX = sprite.x
      placeable.previousY = sprite.y
      this.isObjectDragging = true
      this.cameraController?.cancel()
      sprite.setDepth(99)
      sprite.setTint(0xffffaa)
      sprite.setScale(originalScaleX * 1.04, originalScaleY * 1.04)
    })

    sprite.on(
      'drag',
      (pointer: Phaser.Input.Pointer, dragX: number) => {
        if (pointer.wasTouch) {
          this.cameraController?.handlePointerMove(pointer)
          return
        }

        didDrag = true
        const nearestTile = this.findNearestGroundStreet02(dragX)

        if (!nearestTile) {
          sprite.setPosition(placeable.previousX, placeable.previousY)
          return
        }

        const groundArea = this.getConnectedGroundStreet02Area(nearestTile)
        const halfWidth = sprite.displayWidth / 2
        const minX = Math.max(groundArea.minX + halfWidth, halfWidth)
        const maxX = Math.min(
          groundArea.maxX - halfWidth,
          this.worldWidth - halfWidth,
        )
        const clampedX = minX <= maxX
          ? Phaser.Math.Clamp(dragX, minX, maxX)
          : placeable.previousX
        const targetY = nearestTile
          ? this.getGroundStreetTopY(nearestTile)
          : placeable.baseY

        sprite.setPosition(clampedX, targetY)
      },
    )

    sprite.on('dragend', (pointer: Phaser.Input.Pointer) => {
      if (pointer.wasTouch) {
        this.cameraController?.handlePointerUp(pointer)
        this.isObjectDragging = false
        return
      }

      const snappedX =
        Math.round(sprite.x / this.buildingSnapSize) * this.buildingSnapSize
      const targetTile = this.findNearestGroundStreet02(snappedX)

      sprite.clearTint()
      sprite.setScale(originalScaleX, originalScaleY)
      sprite.setDepth(restingDepth)

      if (!targetTile) {
        this.revertPlaceable(placeable)
        return
      }

      const nextY = this.getGroundStreetTopY(targetTile)
      const groundArea = this.getConnectedGroundStreet02Area(targetTile)
      const halfWidth = sprite.displayWidth / 2
      const minX = Math.max(groundArea.minX + halfWidth, halfWidth)
      const maxX = Math.min(
        groundArea.maxX - halfWidth,
        this.worldWidth - halfWidth,
      )

      if (minX > maxX) {
        this.revertPlaceable(placeable)
        return
      }

      sprite.setPosition(Phaser.Math.Clamp(snappedX, minX, maxX), nextY)

      if (
        !this.isFullyOnGroundStreet02(sprite) ||
        this.hasBuildingCollision(placeable)
      ) {
        this.revertPlaceable(placeable)
        return
      }

      if (sprite.x !== placeable.previousX || sprite.y !== placeable.previousY) {
        this.undoStack.push({
          sprite,
          x: placeable.previousX,
          y: placeable.previousY,
        })
      }

      placeable.baseY = nextY
      this.savePlaceablePosition(placeable)
      this.isObjectDragging = false
    })
  }

  private getPlaceableRestingDepth(type: PlaceableType) {
    if (type === 'property') {
      return 20
    }

    if (type === 'background-building') {
      return 4
    }

    return 10
  }

  private getBuildingTypeForPlaceable(placeable: PlaceableObject) {
    if (placeable.shopKey === 'bank' || placeable.id.includes('bank')) {
      return 'bank' satisfies BuildingType
    }

    if (
      placeable.shopKey === 'barber_shop' ||
      placeable.id.includes('barber')
    ) {
      return 'barber' satisfies BuildingType
    }

    const shopKey = placeable.shopKey ?? placeable.shopItem?.key ?? ''
    const mappedBuildingType = this.getBuildingTypeFromShopKey(shopKey)

    if (mappedBuildingType) {
      return mappedBuildingType
    }

    if (shopKey.startsWith('house_large')) {
      return 'large_house' satisfies BuildingType
    }

    if (shopKey === 'hospital') {
      return 'hospital' satisfies BuildingType
    }

    if (shopKey === 'building_medium_blue') {
      return 'police_station' satisfies BuildingType
    }

    if (shopKey === 'fire_station') {
      return 'fire_station' satisfies BuildingType
    }

    return null
  }

  private getPlaceableUpgradeState(placeable: PlaceableObject) {
    const buildingType = this.getBuildingTypeForPlaceable(placeable)
    const level =
      buildingType === 'bank'
        ? this.bankLevel
        : buildingType === 'barber'
          ? this.barberLevel
          : Phaser.Math.Clamp(placeable.shopItem?.level ?? 1, 1, 3)

    if (placeable.itemType !== 'building') {
      return {
        level: undefined,
        canUpgrade: false,
        requirement: undefined,
      }
    }

    if (level >= 3) {
      return {
        level,
        canUpgrade: false,
        requirement: undefined,
      }
    }

    if (buildingType === 'bank' || buildingType === 'barber') {
      return {
        level,
        canUpgrade: true,
        requirement: undefined,
      }
    }

    const requiredVehicle = getRequiredVehicleForBuildingLevel3(
      buildingType ?? undefined,
    )

    if (level === 2 && requiredVehicle) {
      const ownedVehicleTypes = getOwnedVehicleTypes(this.ownedShopItemKeys)

      if (!ownedVehicleTypes.includes(requiredVehicle)) {
        const requiredVehicleName =
          getVehicleDefinitionByType(requiredVehicle)?.name ?? 'vehicle terkait'

        return {
          level,
          canUpgrade: false,
          requirement: `LV3 requires ${requiredVehicleName}.`,
        }
      }
    }

    return {
      level,
      canUpgrade: true,
      requirement: undefined,
    }
  }

  private hasPlacedBarberShop() {
    return this.placeableObjects.some(
      (placeable) => this.getBuildingTypeForPlaceable(placeable) === 'barber',
    )
  }

  private getPrimaryBarberLevel() {
    const barber = this.placeableObjects.find(
      (placeable) => this.getBuildingTypeForPlaceable(placeable) === 'barber',
    )

    if (!barber) {
      return 1
    }

    return Phaser.Math.Clamp(this.barberLevel, 1, 3)
  }

  private revertPlaceable(placeable: PlaceableObject) {
    placeable.sprite.setPosition(placeable.previousX, placeable.previousY)
    placeable.sprite.setDepth(this.getPlaceableRestingDepth(placeable.type))
    placeable.sprite.clearTint()
    placeable.baseY = placeable.previousY
    this.isObjectDragging = false
  }

  private findNearestGroundStreet02(x: number) {
    const streetTiles = this.getGroundStreet02Tiles()

    if (streetTiles.length === 0) {
      return null
    }

    return streetTiles.reduce((nearest, tile) => {
      const nearestDistance = Math.abs(this.getTileCenterX(nearest) - x)
      const tileDistance = Math.abs(this.getTileCenterX(tile) - x)

      return tileDistance < nearestDistance ? tile : nearest
    })
  }

  private isFullyOnGroundStreet02(sprite: Phaser.GameObjects.Image) {
    const bounds = sprite.getBounds()
    const leftFootX = bounds.left + 4
    const rightFootX = bounds.right - 4
    const footY = bounds.bottom + 2

    return (
      this.isPointOnGroundStreet02(leftFootX, footY) &&
      this.isPointOnGroundStreet02(rightFootX, footY) &&
      bounds.left >= 0 &&
      bounds.right <= this.worldWidth
    )
  }

  private isPointOnGroundStreet02(x: number, y: number) {
    return this.groundTiles.some((tile) => {
      const bounds = tile.getBounds()

      return (
        tile.getData('groundKey') === 'ground-street-02' &&
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.top &&
        y <= bounds.bottom
      )
    })
  }

  private findGroundTileAt(x: number, y: number) {
    return this.groundTiles.find((tile) => {
      const bounds = tile.getBounds()

      return (
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.top &&
        y <= bounds.bottom
      )
    })
  }

  private isGroundTileOccupied(tile: Phaser.GameObjects.Image) {
    return this.placeableObjects.some((placeable) => {
      if (placeable.type !== 'building') {
        return false
      }

      return this.isSpriteFootOnGroundTile(placeable.sprite, tile)
    })
  }

  private isSpriteFootOnGroundTile(
    sprite: Phaser.GameObjects.Image,
    tile: Phaser.GameObjects.Image,
  ) {
    const spriteBounds = sprite.getBounds()
    const tileBounds = tile.getBounds()
    const footY = spriteBounds.bottom + 2
    const footPoints = [
      spriteBounds.left + 4,
      spriteBounds.centerX,
      spriteBounds.right - 4,
    ]

    return footPoints.some(
      (footX) =>
        footX >= tileBounds.left &&
        footX <= tileBounds.right &&
        footY >= tileBounds.top &&
        footY <= tileBounds.bottom,
    )
  }

  private hasBuildingCollision(current: PlaceableObject) {
    return this.hasBuildingSpriteCollision(
      current.sprite,
      current.type,
      current,
    )
  }

  private hasBuildingSpriteCollision(
    sprite: Phaser.GameObjects.Image,
    type: PlaceableType,
    current?: PlaceableObject,
  ) {
    if (type !== 'building') {
      return false
    }

    const currentBounds = sprite.getBounds()

    return this.placeableObjects.some((other) => {
      if (other === current || other.type !== 'building') {
        return false
      }

      return Phaser.Geom.Intersects.RectangleToRectangle(
        currentBounds,
        other.sprite.getBounds(),
      )
    })
  }

  private undoLastMove() {
    const last = this.undoStack.pop()

    if (!last) {
      return
    }

    last.sprite.setPosition(last.x, last.y)

    const placeable = this.placeableObjects.find(
      (item) => item.sprite === last.sprite,
    )

    if (placeable) {
      placeable.previousX = last.x
      placeable.previousY = last.y
      placeable.baseY = last.y
      this.savePlaceablePosition(placeable)
    }
  }

  private applySavedPlaceablePosition(
    id: PlaceableId,
    sprite: Phaser.GameObjects.Image,
    fallbackY: number,
  ) {
    const savedPosition = this.getSavedPlaceablePositions()[id]

    if (!savedPosition) {
      return fallbackY
    }

    const targetTile = this.findNearestGroundStreet02(savedPosition.x)

    if (!targetTile) {
      return fallbackY
    }

    const groundArea = this.getConnectedGroundStreet02Area(targetTile)
    const halfWidth = sprite.displayWidth / 2
    const minX = Math.max(groundArea.minX + halfWidth, halfWidth)
    const maxX = Math.min(
      groundArea.maxX - halfWidth,
      this.worldWidth - halfWidth,
    )

    if (minX > maxX) {
      return fallbackY
    }

    const restoredX = Phaser.Math.Clamp(savedPosition.x, minX, maxX)
    const restoredY = this.getGroundStreetTopY(targetTile)
    const previousX = sprite.x
    const previousY = sprite.y

    sprite.setPosition(restoredX, restoredY)

    if (!this.isFullyOnGroundStreet02(sprite)) {
      sprite.setPosition(previousX, previousY)
      return fallbackY
    }

    return restoredY
  }

  private savePlaceablePosition(placeable: PlaceableObject) {
    const savedPositions = this.getSavedPlaceablePositions()

    savedPositions[placeable.id] = {
      x: placeable.sprite.x,
      y: placeable.sprite.y,
    }

    try {
      localStorage.setItem(
        this.placeableStorageKey,
        JSON.stringify(savedPositions),
      )
      this.saveShopPlaceables()
    } catch {
      // Position persistence is optional; gameplay should continue without storage.
    }
  }

  private getSavedPlaceablePositions(): SavedPlaceablePositions {
    try {
      const rawPositions = localStorage.getItem(this.placeableStorageKey)

      if (!rawPositions) {
        return {}
      }

      return JSON.parse(rawPositions) as SavedPlaceablePositions
    } catch {
      return {}
    }
  }

  private spawnPlacedObjects(placedObjects: SavedShopPlaceable[]) {
    placedObjects.forEach((item) => {
      if (
      item.type === 'ground' ||
      item.type === 'vehicle' ||
      item.key.startsWith('ground_street') ||
        (item.key === 'bank' && !this.isStarterBankObject(item)) ||
        item.key.toLowerCase().includes('background') ||
        !this.textures.exists(item.assetKey)
      ) {
        return
      }

      const targetTile = this.findNearestGroundStreet02(item.x)

      if (!targetTile) {
        return
      }

      const type = this.getPlaceableTypeFromShopItem(item)
      const y = this.getGroundStreetTopY(targetTile)
      const sprite = this.add
        .image(item.x, y, item.assetKey)
        .setOrigin(0.5, 1)
        .setScale(this.getShopItemScale(item.assetKey))
        .setDepth(this.getPlaceableRestingDepth(type))

      const groundArea = this.getConnectedGroundStreet02Area(targetTile)
      const halfWidth = sprite.displayWidth / 2
      const minX = Math.max(groundArea.minX + halfWidth, halfWidth)
      const maxX = Math.min(
        groundArea.maxX - halfWidth,
        this.worldWidth - halfWidth,
      )

      if (minX > maxX) {
        sprite.destroy()
        return
      }

      sprite.setPosition(Phaser.Math.Clamp(item.x, minX, maxX), y)

      if (
        !this.isFullyOnGroundStreet02(sprite) ||
        this.hasBuildingSpriteCollision(sprite, type)
      ) {
        sprite.destroy()
        return
      }

      this.addPlaceableSpriteToCollection(sprite, type)
      this.registerPlaceable(item.id, sprite, type, y, item)
    })
  }

  private saveShopPlaceables() {
    this.savePlacedObjects(
      this.placeableObjects.flatMap((placeable) => {
        if (!placeable.shopItem) {
          return []
        }

        return [
          {
            ...placeable.shopItem,
            id: placeable.id,
            shopKey: placeable.shopKey ?? placeable.shopItem.shopKey,
            buildingType:
              placeable.shopItem.buildingType ??
              this.getBuildingTypeForPlaceable(placeable) ??
              undefined,
            level: placeable.shopItem.level ?? 1,
            x: placeable.sprite.x,
            y: placeable.sprite.y,
            isDefault: placeable.isDefault,
            canSell: placeable.canSell,
          },
        ]
      }),
    )
  }

  private savePlacedObjects(placedObjects: SavedShopPlaceable[]) {
    try {
      localStorage.setItem(
        this.shopPlaceableStorageKey,
        JSON.stringify(placedObjects),
      )
    } catch {
      // Placed object persistence is optional; gameplay should continue without storage.
    }
  }

  private loadPlacedObjects() {
    try {
      const rawItems = localStorage.getItem(this.shopPlaceableStorageKey)

      if (!rawItems) {
        return null
      }

      const parsedItems = JSON.parse(rawItems)

      if (!Array.isArray(parsedItems)) {
        return null
      }

      const normalizedItems = parsedItems
        .map((item) => this.normalizePlacedObject(item))
        .filter((item): item is SavedShopPlaceable => Boolean(item))
      const migratedItems = this.migratePlacedObjects(normalizedItems)

      if (migratedItems.length !== normalizedItems.length) {
        this.savePlacedObjects(migratedItems)
      }

      return migratedItems
    } catch {
      return null
    }
  }

  private migratePlacedObjects(placedObjects: SavedShopPlaceable[]) {
    return placedObjects.filter((object) => {
      if (object.id === 'starter-barber-shop') {
        return false
      }

      if (object.buildingType === 'barber' && object.isDefault) {
        return false
      }

      return true
    })
  }

  private normalizePlacedObject(
    item: Partial<SavedShopPlaceable>,
  ): SavedShopPlaceable | null {
    const { id, key, assetKey, type, x } = item

    if (
      !id ||
      !key ||
      !assetKey ||
      !type ||
      typeof x !== 'number'
    ) {
      return null
    }

    if (
      type === 'ground' ||
      type === 'vehicle' ||
      key.startsWith('ground_street') ||
      key.toLowerCase().includes('background')
    ) {
      return null
    }

    if (key === 'bank' && !this.isStarterBankObject({ id, key })) {
      return null
    }

    const currentItem = visibleShopItems.find(
      (shopItem) => shopItem.key === key,
    )
    const normalizedId = this.normalizeStarterId(id, key)
    const fallbackItem = this.getStarterFallbackItem(key)
    const isDefault =
      item.isDefault ?? this.isDefaultStarterObjectId(normalizedId)
    const canSell = item.canSell ?? !isDefault

    return {
      ...item,
      ...currentItem,
      ...fallbackItem,
      id: normalizedId,
      key,
      x,
      y: typeof item.y === 'number' ? item.y : 0,
      shopKey: item.shopKey ?? key,
      name: currentItem?.name ?? fallbackItem?.name ?? item.name ?? 'Item',
      price: DEFAULT_SHOP_PRICE,
      imageUrl:
        currentItem?.imageUrl ?? fallbackItem?.imageUrl ?? item.imageUrl ?? '',
      type: currentItem?.type ?? fallbackItem?.type ?? type,
      assetKey: currentItem?.assetKey ?? fallbackItem?.assetKey ?? assetKey,
      buildingType:
        item.buildingType ??
        fallbackItem?.buildingType ??
        this.getBuildingTypeFromShopKey(key),
      level: item.level ?? 1,
      isDefault,
      canSell: isDefault ? false : canSell,
    }
  }

  private getStarterFallbackItem(key: string): Partial<SavedShopPlaceable> | null {
    if (key === 'bank') {
      return {
        name: 'Bank',
        assetKey: 'building-bank',
        type: 'building',
        buildingType: 'bank',
        imageUrl: bankUrl,
        isDefault: true,
        canSell: false,
      }
    }

    if (key === 'barber_shop') {
      return {
        name: 'Barber Shop',
        assetKey: 'building-barber-shop',
        type: 'building',
        buildingType: 'barber',
        imageUrl: barberShopUrl,
        isDefault: true,
        canSell: false,
      }
    }

    if (key === 'fence_wire') {
      return {
        name: 'Fence Wire',
        assetKey: 'fence_wire',
        type: 'decoration',
        imageUrl: fenceWireUrl,
        isDefault: true,
        canSell: false,
      }
    }

    return null
  }

  private getBuildingTypeFromShopKey(key: string): BuildingType | undefined {
    if (key === 'bank') {
      return 'bank'
    }

    if (key === 'barber_shop') {
      return 'barber'
    }

    if (key === 'hospital') {
      return 'hospital'
    }

    if (key === 'building_medium_blue') {
      return 'police_station'
    }

    if (key === 'fire_station') {
      return 'fire_station'
    }

    if (key.startsWith('house_large')) {
      return 'large_house'
    }

    return undefined
  }

  private normalizeStarterId(id: string, key: string) {
    if (key === 'bank' && (id === 'default-bank' || id === 'bank')) {
      return 'starter-bank'
    }

    if (
      key === 'fence_wire' &&
      (id === 'default-fence-wire' || id === 'fence-wire')
    ) {
      return 'starter-fence-wire'
    }

    if (
      key === 'barber_shop' &&
      (id === 'default-barber-shop' || id === 'barber-shop')
    ) {
      return 'starter-barber-shop'
    }

    return id
  }

  private hasEquivalentPlacedObject(
    placedObjects: SavedShopPlaceable[],
    starterObject: SavedShopPlaceable,
  ) {
    return placedObjects.some((item) => item.id === starterObject.id)
  }

  private isStarterBankObject(item: Pick<SavedShopPlaceable, 'id' | 'key'>) {
    return (
      item.key === 'bank' &&
      (item.id === 'starter-bank' ||
        item.id === 'default-bank' ||
        item.id === 'bank')
    )
  }

  private isDefaultStarterObjectId(placeableId: string) {
    return (
      placeableId === 'starter-bank' ||
      placeableId === 'starter-fence-wire' ||
      placeableId === 'starter-barber-shop'
    )
  }

  private saveGroundTile(tile: Phaser.GameObjects.Image, key: GroundKey) {
    const tileIndex = tile.getData('tileIndex')

    if (typeof tileIndex !== 'number') {
      return
    }

    const savedGroundTiles = this.getSavedGroundTiles()

    savedGroundTiles[tileIndex] = key

    try {
      localStorage.setItem(
        this.groundStorageKey,
        JSON.stringify(savedGroundTiles),
      )
    } catch {
      // Ground persistence is optional; gameplay should continue without storage.
    }
  }

  private getSavedGroundTiles(): SavedGroundTiles {
    try {
      const rawTiles = localStorage.getItem(this.groundStorageKey)

      if (!rawTiles) {
        return {}
      }

      const parsedTiles = JSON.parse(rawTiles) as SavedGroundTiles

      return Object.fromEntries(
        Object.entries(parsedTiles).filter(
          ([, key]) => key === 'ground-street-01' || key === 'ground-street-02',
        ),
      ) as SavedGroundTiles
    } catch {
      return {}
    }
  }

  private saveEconomyState() {
    const economyState: EconomyState = {
      coins: Math.floor(this.coins),
      diamonds: Math.floor(this.diamonds),
      bankLevel: this.bankLevel,
      barberLevel: this.barberLevel,
      lastCollectedAt: this.lastCollectedAt,
    }

    try {
      localStorage.setItem(
        this.economyStorageKey,
        JSON.stringify(economyState),
      )
    } catch {
      // Economy persistence is optional; gameplay should continue without storage.
    }
  }

  private getSavedEconomyState() {
    try {
      const rawState = localStorage.getItem(this.economyStorageKey)

      if (!rawState) {
        return null
      }

      const parsedState = JSON.parse(rawState) as Partial<EconomyState>

      return {
        coins: Math.floor(Number(parsedState.coins ?? 0)),
        diamonds: Math.floor(Number(parsedState.diamonds ?? 0)),
        bankLevel: Phaser.Math.Clamp(Number(parsedState.bankLevel ?? 1), 1, 3),
        barberLevel: Phaser.Math.Clamp(
          Number(parsedState.barberLevel ?? 1),
          1,
          3,
        ),
        lastCollectedAt: Number(parsedState.lastCollectedAt ?? Date.now()),
      } satisfies EconomyState
    } catch {
      return null
    }
  }

  private handleUndoShortcut(event: KeyboardEvent) {
    if (!event.ctrlKey || this.isEditableEventTarget(event)) {
      return
    }

    event.preventDefault()
    this.undoLastMove()
  }

  private isEditableElementActive() {
    return this.isEditableElement(document.activeElement)
  }

  private isEditableEventTarget(event: Event) {
    return this.isEditableElement(event.target)
  }

  private isEditableElement(target: EventTarget | Element | null) {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    const tagName = target.tagName.toLowerCase()

    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable
    )
  }

  private getGroundStreet02Tiles() {
    return this.groundTiles.filter(
      (tile) => tile.getData('groundKey') === 'ground-street-02',
    )
  }

  private getConnectedGroundStreet02Area(anchorTile: Phaser.GameObjects.Image) {
    const streetTiles = this.getGroundStreet02Tiles()
    const anchorIndex = streetTiles.indexOf(anchorTile)

    if (anchorIndex === -1) {
      return {
        minX: anchorTile.x,
        maxX: anchorTile.x + anchorTile.displayWidth,
      }
    }

    let startIndex = anchorIndex
    let endIndex = anchorIndex

    while (
      startIndex > 0 &&
      this.areGroundTilesConnected(streetTiles[startIndex - 1], streetTiles[startIndex])
    ) {
      startIndex -= 1
    }

    while (
      endIndex < streetTiles.length - 1 &&
      this.areGroundTilesConnected(streetTiles[endIndex], streetTiles[endIndex + 1])
    ) {
      endIndex += 1
    }

    const firstTile = streetTiles[startIndex]
    const lastTile = streetTiles[endIndex]

    return {
      minX: firstTile.x,
      maxX: lastTile.x + lastTile.displayWidth,
    }
  }

  private areGroundTilesConnected(
    leftTile: Phaser.GameObjects.Image,
    rightTile: Phaser.GameObjects.Image,
  ) {
    const expectedNextX = leftTile.x + leftTile.displayWidth - this.groundOverlap

    return rightTile.x <= expectedNextX + 8
  }

  private getTileCenterX(tile: Phaser.GameObjects.Image) {
    return tile.x + tile.displayWidth / 2
  }

  private getGroundStreetTopY(tile: Phaser.GameObjects.Image) {
    return tile.y - tile.displayHeight + 8
  }

  private setupControls() {
    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', this.handlePointerUp, this)
    this.input.on('pointerupoutside', this.handlePointerUp, this)
    const keyboard = this.input.keyboard

    if (keyboard) {
      keyboard.removeCapture([
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.SHIFT,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
      ])
      this.cursors = keyboard.addKeys(
        {
          left: Phaser.Input.Keyboard.KeyCodes.LEFT,
          right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        },
        false,
      ) as CameraKeyboardKeys
      keyboard.on('keydown-Z', this.handleUndoShortcut, this)
    }
    gameEvents.addEventListener(
      'UPGRADE_BUILDING',
      this.handleUpgradeBuildingCommand,
    )
    gameEvents.addEventListener(
      'BUY_SHOP_ITEM',
      this.handleBuyShopItemCommand,
    )
    gameEvents.addEventListener(
      'SELL_PLACEABLE',
      this.handleSellPlaceableCommand,
    )
    gameEvents.addEventListener(
      'SELL_PLACED_OBJECT',
      this.handleSellPlaceableCommand,
    )
    gameEvents.addEventListener(
      'ADMIN_RESET_CURRENCY',
      this.handleAdminResetCurrencyCommand,
    )
    gameEvents.addEventListener(
      'ADMIN_ADD_COINS',
      this.handleAdminAddCoinsCommand,
    )
    gameEvents.addEventListener(
      'ADMIN_ADD_DIAMONDS',
      this.handleAdminAddDiamondsCommand,
    )
    gameEvents.addEventListener(
      'SYNC_GAME_CURRENCY',
      this.handleSyncGameCurrencyCommand,
    )
    gameEvents.addEventListener(
      'SYNC_OWNED_SHOP_ITEMS',
      this.handleSyncOwnedShopItemsCommand,
    )
    gameEvents.addEventListener(
      'REQUEST_CITY_PROGRESS',
      this.handleRequestCityProgressCommand,
    )
    gameEvents.addEventListener(
      'UPGRADE_PLACED_BUILDING',
      this.handleUpgradePlacedBuildingCommand,
    )
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.groundReplacementItem) {
      this.replaceGroundTileAt(
        this.getPointerWorldX(pointer),
        this.getPointerWorldY(pointer),
      )
      return
    }

    if (this.placementPreview) {
      this.placePreviewItem(this.getPointerWorldX(pointer))
      return
    }

    if (this.isObjectDragging) {
      return
    }

    this.cameraController?.handlePointerDown(pointer)
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.placementPreview) {
      this.updatePlacementPreviewPosition(this.getPointerWorldX(pointer))
      return
    }

    if (this.isObjectDragging) {
      return
    }

    this.cameraController?.handlePointerMove(pointer)
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    this.cameraController?.handlePointerUp(pointer)
    this.isObjectDragging = false
  }

  private getPointerWorldX(pointer: Phaser.Input.Pointer) {
    return pointer.worldX ?? pointer.x + this.cameras.main.scrollX
  }

  private getPointerWorldY(pointer: Phaser.Input.Pointer) {
    return pointer.worldY ?? pointer.y + this.cameras.main.scrollY
  }

  private getGroundKey(tileData: GroundTileData): GroundKey {
    return tileData.hasBuilding ? 'ground-street-02' : 'ground-street-01'
  }

  private getWorldWidth(screenWidth: number) {
    return Math.max(this.minWorldWidth, screenWidth)
  }

  private createGroundFrames() {
    Object.entries(this.groundFrames).forEach(([key, frameConfig]) => {
      const texture = this.textures.get(key)

      texture.setFilter(Phaser.Textures.FilterMode.NEAREST)

      if (!texture.has(frameConfig.frame)) {
        texture.add(
          frameConfig.frame,
          0,
          frameConfig.x,
          frameConfig.y,
          frameConfig.width,
          frameConfig.height,
        )
      }
    })
  }
}
