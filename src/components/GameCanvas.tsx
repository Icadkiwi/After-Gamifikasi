import { useEffect, useRef } from 'react'

import { createGame } from '../game/Game'

type GameCanvasProps = {
  className?: string
}

export function GameCanvas({ className = '' }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return
    }

    gameRef.current = createGame(containerRef.current)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div className={`game-canvas-root overflow-hidden bg-sky-100 ${className}`}>
      <div
        ref={containerRef}
        className="relative h-full w-full bg-cover bg-center [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
      />
    </div>
  )
}
