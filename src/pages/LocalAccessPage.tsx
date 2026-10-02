import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, UserRound, LogIn, UserPlus } from 'lucide-react'

import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../contexts/AuthContext'
import { getFirebaseErrorMessage } from '../lib/forgotPassword'
import type { LocalRole } from '../lib/localAccess'

export function LocalAccessPage() {
  const { user, loading, isLocalSession, startLocalSession, logout } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function openAccess(target: LocalRole | '/login' | '/register') {
    if (pending) return
    setPending(target)
    setError('')
    try {
      if (target === 'admin' || target === 'user') {
        await startLocalSession(target)
        navigate('/game')
      } else {
        // Make the real forms reachable even after testing a signed-in session.
        await logout()
        navigate(target)
      }
    } catch (cause) {
      setError(getFirebaseErrorMessage(cause, 'Gagal membuka akses. Coba lagi.'))
    } finally {
      setPending(null)
    }
  }

  const disabled = pending !== null
  const buttonClass = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50'

  return (
    <PageContainer title="Pilih akses pengujian" description="Masuk ke kota sebagai admin, coba pengalaman pengguna, atau uji alur masuk dan pendaftaran akun.">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">Khusus localhost</span>
        <span className="text-zinc-600">Akses cepat hanya tersedia saat menjalankan mode pengembangan.</span>
      </div>

      {user && (
        <p className="text-sm text-zinc-700">
          Sesi aktif: <strong>{user.displayName || user.email}</strong> ({isLocalSession ? 'lokal' : 'Firebase'}).{' '}
          <Link to="/game" className="font-semibold text-emerald-700 underline">Lanjutkan sesi</Link>
        </p>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2" aria-busy={disabled}>
        <section className="flex flex-col gap-5 rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
          <ShieldCheck className="size-8 text-emerald-700" aria-hidden="true" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Coba aplikasi langsung</h2>
            <p className="text-sm leading-6 text-zinc-600">Tanpa email dan kata sandi. Admin dapat membuka Kontrol Admin; user mendapat tampilan pengguna biasa.</p>
          </div>
          <div className="mt-auto grid gap-3">
            <button type="button" disabled={disabled} onClick={() => void openAccess('admin')} className={`${buttonClass} bg-emerald-700 text-white hover:bg-emerald-800`}>
              <ShieldCheck className="size-4" aria-hidden="true" />{pending === 'admin' ? 'Membuka...' : 'Masuk Admin Lokal'}
            </button>
            <button type="button" disabled={disabled} onClick={() => void openAccess('user')} className={`${buttonClass} border border-zinc-300 text-zinc-900 hover:bg-zinc-100`}>
              <UserRound className="size-4" aria-hidden="true" />{pending === 'user' ? 'Membuka...' : 'Coba User Lokal'}
            </button>
          </div>
          <p className="text-xs leading-5 text-zinc-500">Dua profil uji terpisah. Progres tersimpan di browser dan tidak membuat akun Firebase.</p>
        </section>

        <section className="flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <LogIn className="size-8 text-sky-700" aria-hidden="true" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Uji akun pengguna</h2>
            <p className="text-sm leading-6 text-zinc-600">Gunakan formulir asli untuk memeriksa login, registrasi, dan verifikasi email melalui Firebase.</p>
          </div>
          <div className="mt-auto grid gap-3">
            <button type="button" disabled={disabled || loading} onClick={() => void openAccess('/login')} className={`${buttonClass} bg-zinc-950 text-white hover:bg-zinc-800`}>
              <LogIn className="size-4" aria-hidden="true" />{pending === '/login' ? 'Membuka...' : 'Tes Login User'}
            </button>
            <button type="button" disabled={disabled || loading} onClick={() => void openAccess('/register')} className={`${buttonClass} border border-zinc-300 text-zinc-900 hover:bg-zinc-100`}>
              <UserPlus className="size-4" aria-hidden="true" />{pending === '/register' ? 'Membuka...' : 'Tes Registrasi User'}
            </button>
          </div>
          <p className="text-xs leading-5 text-zinc-500">Mengakhiri sesi yang aktif. Registrasi membuat akun pada proyek Firebase yang terhubung.</p>
        </section>
      </div>
    </PageContainer>
  )
}
