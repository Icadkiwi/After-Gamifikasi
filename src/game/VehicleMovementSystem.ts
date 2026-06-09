import Phaser from 'phaser'

import {
  vehicleVisualConfig,
  type VehicleType,
} from './vehicleConfig'

export type VehicleDirection = 1 | -1

export type VehicleSpawnConfig = {
  id: string
  vehicleType: VehicleType
  assetKey: string
  x: number
  baseY: number
  minX: number
  maxX: number
  scaleMultiplier: number
  delay: number
  onClick: () => void
  onPointerDown?: (pointer: Phaser.Input.Pointer) => void
  onPointerMove?: (pointer: Phaser.Input.Pointer) => void
  onPointerUp?: (pointer: Phaser.Input.Pointer) => boolean
}

type ActiveVehicle = {
  id: string
  vehicleType: VehicleType
  sprite: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  direction: VehicleDirection
  speed: number
  minX: number
  maxX: number
  baseY: number
  visualScale: number
  pauseUntil: number
  bobPhase: number
}

export class VehicleMovementSystem {
  private readonly scene: Phaser.Scene
  private readonly vehicles: ActiveVehicle[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  setVehicles(configs: VehicleSpawnConfig[]) {
    this.clear()

    configs.forEach((config, index) => {
      if (!this.scene.textures.exists(config.assetKey)) {
        return
      }

      const visualConfig = vehicleVisualConfig[config.vehicleType]
      const visualScale = visualConfig.scale * config.scaleMultiplier
      const direction: VehicleDirection = index % 2 === 0 ? 1 : -1
      let pointerDownAt = 0
      let pointerStartX = 0
      let pointerStartY = 0
      const sprite = this.scene.add
        .image(config.x, config.baseY + visualConfig.yOffset, config.assetKey)
        .setOrigin(0.5, 1)
        .setScale(visualScale * direction, visualScale)
        .setDepth(23 + index)
        .setInteractive({ useHandCursor: true })
      const shadow = this.scene.add
        .ellipse(
          config.x,
          config.baseY - 4,
          Math.max(sprite.displayWidth * visualConfig.shadowWidthRatio, 34),
          visualConfig.shadowHeight,
          0x000000,
          0.22,
        )
        .setDepth(22 + index)

      sprite.on(
        'pointerdown',
        (
          pointer: Phaser.Input.Pointer,
          _localX: number,
          _localY: number,
          event: Phaser.Types.Input.EventData,
        ) => {
          pointerDownAt = this.scene.time.now
          pointerStartX = pointer.x
          pointerStartY = pointer.y
          config.onPointerDown?.(pointer)
          event.stopPropagation()
        },
      )
      sprite.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        config.onPointerMove?.(pointer)
      })
      sprite.on(
        'pointerup',
        (
          pointer: Phaser.Input.Pointer,
          _localX: number,
          _localY: number,
          event: Phaser.Types.Input.EventData,
        ) => {
          event.stopPropagation()
          const didCameraDrag = config.onPointerUp?.(pointer) ?? false
          const pressDuration = this.scene.time.now - pointerDownAt
          const moveDistance = Phaser.Math.Distance.Between(
            pointerStartX,
            pointerStartY,
            pointer.x,
            pointer.y,
          )

          if (didCameraDrag || pressDuration > 240 || moveDistance > 10) {
            return
          }

          config.onClick()
        },
      )

      this.vehicles.push({
        id: config.id,
        vehicleType: config.vehicleType,
        sprite,
        shadow,
        direction,
        speed: Phaser.Math.Between(
          visualConfig.speedMin,
          visualConfig.speedMax,
        ),
        minX: config.minX,
        maxX: config.maxX,
        baseY: config.baseY + visualConfig.yOffset,
        visualScale,
        pauseUntil: this.scene.time.now + config.delay,
        bobPhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      })
    })
  }

  update(delta: number) {
    const deltaSeconds = delta / 1000
    const now = this.scene.time.now

    this.vehicles.forEach((vehicle) => {
      if (now < vehicle.pauseUntil) {
        this.syncVehicleVisuals(vehicle, now)
        return
      }

      const nextX = vehicle.sprite.x + vehicle.direction * vehicle.speed * deltaSeconds

      if (nextX >= vehicle.maxX || nextX <= vehicle.minX) {
        vehicle.sprite.x = Phaser.Math.Clamp(nextX, vehicle.minX, vehicle.maxX)
        vehicle.direction = vehicle.direction === 1 ? -1 : 1
        vehicle.speed = Phaser.Math.Between(
          vehicleVisualConfig[vehicle.vehicleType].speedMin,
          vehicleVisualConfig[vehicle.vehicleType].speedMax,
        )
        vehicle.pauseUntil = now + Phaser.Math.Between(350, 1100)
        vehicle.sprite.setScale(
          vehicle.visualScale * vehicle.direction,
          vehicle.visualScale,
        )
      } else {
        vehicle.sprite.x = nextX
      }

      this.syncVehicleVisuals(vehicle, now)
    })
  }

  clear() {
    this.vehicles.forEach((vehicle) => {
      vehicle.sprite.destroy()
      vehicle.shadow.destroy()
    })
    this.vehicles.length = 0
  }

  getVehicleCount() {
    return this.vehicles.length
  }

  private syncVehicleVisuals(vehicle: ActiveVehicle, now: number) {
    const bounce = Math.sin(now / 260 + vehicle.bobPhase) * 1.25

    vehicle.sprite.y = vehicle.baseY + bounce
    vehicle.shadow.setPosition(vehicle.sprite.x, vehicle.baseY + 2)
    vehicle.shadow.setAlpha(0.18 + Math.max(0, 1 - Math.abs(bounce) / 3) * 0.08)
  }
}
