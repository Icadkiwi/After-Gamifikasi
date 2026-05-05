import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
  private background?: Phaser.GameObjects.Image
  private character?: Phaser.GameObjects.Sprite
  private characterTween?: Phaser.Tweens.Tween

  constructor() {
    super('GameScene')
  }

  create() {
    this.createPlaceholderTextures()

    const { width, height } = this.scale

    this.background = this.add.image(width / 2, height / 2, 'game-background')

    this.character = this.add
      .sprite(width * 0.2, height * 0.75, 'character-sprite')
      .setOrigin(0.5, 1)

    this.layoutScene(width, height)
    this.startCharacterTween(width, height)

    this.scale.on('resize', this.handleResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this)
    })
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.layoutScene(gameSize.width, gameSize.height)
    this.startCharacterTween(gameSize.width, gameSize.height)
  }

  private layoutScene(width: number, height: number) {
    this.background?.setPosition(width / 2, height / 2).setDisplaySize(width, height)

    const characterScale = Phaser.Math.Clamp(
      Math.min(width / 800, height / 450),
      0.65,
      1.8,
    )

    this.character?.setPosition(width * 0.2, height * 0.78).setScale(characterScale)
  }

  private startCharacterTween(width: number, height: number) {
    if (!this.character) {
      return
    }

    this.characterTween?.remove()
    this.character.setPosition(width * 0.2, height * 0.78).setFlipX(false)

    this.characterTween = this.tweens.add({
      targets: this.character,
      x: width * 0.8,
      duration: 2200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onYoyo: () => this.character?.setFlipX(true),
      onRepeat: () => this.character?.setFlipX(false),
    })
  }

  private createPlaceholderTextures() {
    if (!this.textures.exists('game-background')) {
      const background = this.add.graphics()

      background.fillGradientStyle(0x93c5fd, 0xbae6fd, 0x86efac, 0x4ade80)
      background.fillRect(0, 0, 800, 450)

      background.fillStyle(0xffffff, 0.75)
      background.fillCircle(110, 70, 24)
      background.fillCircle(138, 66, 30)
      background.fillCircle(168, 74, 22)

      background.fillStyle(0x22c55e, 1)
      background.fillRect(0, 345, 800, 105)
      background.fillStyle(0x15803d, 1)
      background.fillRect(0, 405, 800, 45)

      background.generateTexture('game-background', 800, 450)
      background.destroy()
    }

    if (!this.textures.exists('character-sprite')) {
      const character = this.add.graphics()

      character.fillStyle(0x27272a, 1)
      character.fillRect(24, 58, 8, 28)
      character.fillRect(40, 58, 8, 28)

      character.fillStyle(0x2563eb, 1)
      character.fillRoundedRect(18, 30, 36, 36, 8)

      character.fillStyle(0xfacc15, 1)
      character.fillCircle(36, 18, 16)

      character.fillStyle(0x18181b, 1)
      character.fillCircle(31, 16, 2)
      character.fillCircle(41, 16, 2)
      character.fillRect(31, 24, 10, 2)

      character.fillStyle(0x1d4ed8, 1)
      character.fillRect(12, 36, 10, 24)
      character.fillRect(50, 36, 10, 24)

      character.generateTexture('character-sprite', 72, 92)
      character.destroy()
    }
  }
}
