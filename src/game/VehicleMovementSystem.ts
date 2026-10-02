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
  minY: number
  maxY: number
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
  minY: number
  maxY: number
  baseY: number
  targetBaseY: number
  laneChangeAt: number
  visualScale: number
  pauseUntil: number
  bobPhase: number
}

export class VehicleMovementSystem {
  private readonly scene: Phaser.Scene
  private readonly vehicles: ActiveVehicle[] = []
  private readonly speedMultiplier = 2.6

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
      const minY = Math.min(config.minY, config.maxY)
      const maxY = Math.max(config.minY, config.maxY)
      const baseY = Phaser.Math.Clamp(config.baseY, minY, maxY)
      let pointerDownAt = 0
      let pointerStartX = 0
      let pointerStartY = 0
      let activePointerId: number | null = null
      let releaseHandled = false
      let clearScenePointerRelease = () => {}
      const sprite = this.scene.add
        .image(config.x, baseY + visualConfig.yOffset, config.assetKey)
        .setOrigin(0.5, 1)
        .setScale(visualScale * direction, visualScale)
        .setDepth(60 + index)
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
        .setDepth(59 + index)

      const handlePointerRelease = (pointer: Phaser.Input.Pointer) => {
        if (releaseHandled || pointer.id !== activePointerId) {
          return
        }

        releaseHandled = true
        clearScenePointerRelease()

        const didCameraDrag = config.onPointerUp?.(pointer) ?? false
        const pressDuration = this.scene.time.now - pointerDownAt
        const moveDistance = Phaser.Math.Distance.Between(
          pointerStartX,
          pointerStartY,
          pointer.x,
          pointer.y,
        )

        activePointerId = null

        if (pointer.event.target !== this.scene.game.canvas || didCameraDrag || pressDuration > 260 || moveDistance > 12) {
          return
        }

        config.onClick()
      }

      const handleScenePointerRelease = (pointer: Phaser.Input.Pointer) => {
        handlePointerRelease(pointer)
      }

      sprite.on(
        'pointerdown',
        (
          pointer: Phaser.Input.Pointer,
          _localX: number,
          _localY: number,
          event: Phaser.Types.Input.EventData,
        ) => {
          // Phaser also receives window mouse events over React overlays.
          if (pointer.event.target !== this.scene.game.canvas) return
          pointerDownAt = this.scene.time.now
          pointerStartX = pointer.x
          pointerStartY = pointer.y
          activePointerId = pointer.id
          releaseHandled = false
          config.onPointerDown?.(pointer)
          clearScenePointerRelease()
          this.scene.input.once('pointerup', handleScenePointerRelease)
          this.scene.input.once('pointerupoutside', handleScenePointerRelease)
          clearScenePointerRelease = () => {
            this.scene.input.off('pointerup', handleScenePointerRelease)
            this.scene.input.off('pointerupoutside', handleScenePointerRelease)
          }
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
          handlePointerRelease(pointer)
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
        ) * this.speedMultiplier,
        minX: config.minX,
        maxX: config.maxX,
        minY,
        maxY,
        baseY: baseY + visualConfig.yOffset,
        targetBaseY: baseY + visualConfig.yOffset,
        laneChangeAt: this.scene.time.now + Phaser.Math.Between(900, 2200),
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
        ) * this.speedMultiplier
        vehicle.pauseUntil = now + Phaser.Math.Between(350, 1100)
        vehicle.targetBaseY = this.getNextLaneY(vehicle)
        vehicle.laneChangeAt = now + Phaser.Math.Between(1200, 2600)
        vehicle.sprite.setScale(
          vehicle.visualScale * vehicle.direction,
          vehicle.visualScale,
        )
      } else {
        vehicle.sprite.x = nextX
      }

      if (now >= vehicle.laneChangeAt) {
        vehicle.targetBaseY = this.getNextLaneY(vehicle)
        vehicle.laneChangeAt = now + Phaser.Math.Between(1400, 3200)
      }

      const verticalStep = 30 * deltaSeconds
      const verticalDistance = vehicle.targetBaseY - vehicle.baseY

      vehicle.baseY =
        Math.abs(verticalDistance) <= verticalStep
          ? vehicle.targetBaseY
          : vehicle.baseY + Math.sign(verticalDistance) * verticalStep
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

  private getNextLaneY(vehicle: ActiveVehicle) {
    if (Math.abs(vehicle.maxY - vehicle.minY) < 3) {
      return vehicle.baseY
    }

    const nextY = Phaser.Math.Between(
      Math.round(vehicle.minY),
      Math.round(vehicle.maxY),
    )

    if (Math.abs(nextY - vehicle.baseY) < 5) {
      return vehicle.baseY <= (vehicle.minY + vehicle.maxY) / 2
        ? vehicle.maxY
        : vehicle.minY
    }

    return nextY
  }
}
