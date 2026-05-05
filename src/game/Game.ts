import Phaser from 'phaser'

import { GameScene } from './GameScene'

export function createGame(parent: HTMLElement) {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#bae6fd',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 450,
    },
    scene: [GameScene],
  }

  return new Phaser.Game(config)
}
