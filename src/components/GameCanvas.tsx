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
    const container = containerRef.current
    if (!container || gameRef.current) {
      return
    }

    let cancelled = false
    // Defer creation one frame. React StrictMode mounts → unmounts → remounts
    // effects synchronously, and a Phaser instance destroyed before its boot
    // still appends its canvas afterwards — leaving a second canvas stacked in
    // the DOM (observed in dev). Cancelling the first pass avoids creating the
    // doomed instance at all.
    const frame = requestAnimationFrame(() => {
      const element = containerRef.current
      if (cancelled || !element || gameRef.current) {
        return
      }
      gameRef.current = createGame(element, userId, initialInteraction.current)
      // Verification aid (STEP G.5): expose the live instance on its container
      // so browser tests can read scene state. Attached to the DOM node (not
      // window) and cleared on cleanup, so it cannot leak across remounts.
      ;(element as HTMLDivElement & { __PHASER_GAME__?: unknown }).__PHASER_GAME__ = gameRef.current
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      gameRef.current?.destroy(true)
      gameRef.current = null
      // Belt-and-braces: remove any canvas the destroyed instance left behind.
      container.querySelectorAll('canvas').forEach((canvas) => canvas.remove())
      ;(container as HTMLDivElement & { __PHASER_GAME__?: unknown }).__PHASER_GAME__ = undefined
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
