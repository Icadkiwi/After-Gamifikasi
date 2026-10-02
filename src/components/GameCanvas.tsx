import { useEffect, useRef } from 'react'

import { createGame } from '../game/Game'
import { GameScene } from '../game/GameScene'
import { subscribeGameEvent } from '../game/GameEvents'

type GameCanvasProps = {
  userId: string
  interactionEnabled?: boolean
  className?: string
}

export function GameCanvas({ userId, interactionEnabled = true, className = '' }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null)
  const initialInteraction = useRef(interactionEnabled)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return
    }

    gameRef.current = createGame(containerRef.current, userId, initialInteraction.current)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [userId])

  useEffect(() => {
    const sync = () => {
      const scene = gameRef.current?.scene.getScene('GameScene')
      if (scene instanceof GameScene) scene.setInteractionEnabled(interactionEnabled)
    }
    sync()
    return subscribeGameEvent('GAME_SCENE_READY', sync)
  }, [interactionEnabled])

  return (
    <div className={`game-canvas-root overflow-hidden bg-sky-100 ${className}`}>
      <div
        ref={containerRef}
        className="relative h-full w-full bg-cover bg-center [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
      />
    </div>
  )
}
