import { GameCanvas } from '../components/GameCanvas'

export function GamePage() {
  return (
    <section className="h-[calc(100vh-64px)] w-full overflow-hidden">
      <GameCanvas className="relative h-full w-full bg-cover bg-center" />
    </section>
  )
}
