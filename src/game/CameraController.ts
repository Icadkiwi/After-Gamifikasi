import Phaser from 'phaser'

type DragGesture = {
  pointerId: number
  startX: number
  startY: number
  startScrollX: number
  lastX: number
  lastMoveAt: number
  isDragging: boolean
}

export class CameraController {
  private readonly scene: Phaser.Scene
  private readonly getWorldWidth: () => number
  private readonly dragThreshold = 8
  private readonly horizontalBias = 1.15
  private readonly maxMomentumVelocity = 1800
  private readonly momentumFriction = 0.9
  private gesture?: DragGesture
  private momentumVelocityX = 0
  private lastDraggedPointerId: number | null = null
  private lastDraggedUntil = 0

  constructor(scene: Phaser.Scene, getWorldWidth: () => number) {
    this.scene = scene
    this.getWorldWidth = getWorldWidth
  }

  handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.gesture && this.gesture.pointerId !== pointer.id) {
      return
    }

    this.momentumVelocityX = 0
    this.gesture = {
      pointerId: pointer.id,
      startX: pointer.x,
      startY: pointer.y,
      startScrollX: this.scene.cameras.main.scrollX,
      lastX: pointer.x,
      lastMoveAt: this.scene.time.now,
      isDragging: false,
    }
  }

  handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.gesture || this.gesture.pointerId !== pointer.id) {
      return false
    }

    const deltaX = pointer.x - this.gesture.startX
    const deltaY = pointer.y - this.gesture.startY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (!this.gesture.isDragging) {
      if (
        absX < this.dragThreshold ||
        (absY > 0 && absX < absY * this.horizontalBias)
      ) {
        return false
      }

      this.gesture.isDragging = true
    }

    const now = this.scene.time.now
    const elapsedSeconds = Math.max((now - this.gesture.lastMoveAt) / 1000, 0.016)
    const scrollDelta = this.gesture.lastX - pointer.x
    const nextVelocity = scrollDelta / elapsedSeconds

    this.momentumVelocityX = Phaser.Math.Clamp(
      nextVelocity,
      -this.maxMomentumVelocity,
      this.maxMomentumVelocity,
    )
    this.gesture.lastX = pointer.x
    this.gesture.lastMoveAt = now
    this.setScrollX(this.gesture.startScrollX - deltaX)
    this.preventNativeGesture(pointer)

    return true
  }

  handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.gesture || this.gesture.pointerId !== pointer.id) {
      return this.didDrag(pointer)
    }

    const didDrag = this.gesture.isDragging

    if (didDrag) {
      this.lastDraggedPointerId = pointer.id
      this.lastDraggedUntil = this.scene.time.now + 250
    } else {
      this.momentumVelocityX = 0
    }

    this.gesture = undefined

    return didDrag
  }

  update(delta: number) {
    if (this.gesture || Math.abs(this.momentumVelocityX) < 8) {
      return
    }

    const deltaSeconds = delta / 1000
    const currentScrollX = this.scene.cameras.main.scrollX
    const nextScrollX = currentScrollX + this.momentumVelocityX * deltaSeconds
    const clampedScrollX = this.clampScrollX(nextScrollX)

    this.scene.cameras.main.scrollX = clampedScrollX

    if (clampedScrollX !== nextScrollX) {
      this.momentumVelocityX = 0
      return
    }

    this.momentumVelocityX *= Math.pow(this.momentumFriction, delta / 16.6667)
  }

  setScrollX(scrollX: number) {
    this.scene.cameras.main.scrollX = this.clampScrollX(scrollX)
  }

  clampToBounds() {
    this.setScrollX(this.scene.cameras.main.scrollX)
  }

  cancel() {
    this.gesture = undefined
    this.momentumVelocityX = 0
  }

  didDrag(pointer: Phaser.Input.Pointer) {
    if (this.gesture?.pointerId === pointer.id && this.gesture.isDragging) {
      return true
    }

    return (
      this.lastDraggedPointerId === pointer.id &&
      this.scene.time.now <= this.lastDraggedUntil
    )
  }

  private clampScrollX(scrollX: number) {
    return Phaser.Math.Clamp(scrollX, 0, this.getMaxScrollX())
  }

  private getMaxScrollX() {
    return Math.max(this.getWorldWidth() - this.scene.scale.width, 0)
  }

  private preventNativeGesture(pointer: Phaser.Input.Pointer) {
    const event = pointer.event

    if (event.cancelable) {
      event.preventDefault()
    }
  }
}
