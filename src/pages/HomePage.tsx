import { GameCanvas } from '../components/GameCanvas'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { user } = useAuth()

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-12">
      <GameCanvas className="h-[320px] rounded-lg border border-zinc-200 shadow-sm" />

      <h1 className="text-3xl font-semibold text-zinc-950">After Gamifikasi</h1>
      <p className="text-base text-zinc-600">
        Dashboard sederhana untuk {user?.email}
      </p>
    </section>
  )
}
