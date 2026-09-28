import { useEffect, useRef, useState } from 'react'

import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../contexts/AuthContext'
import { getFirebaseErrorMessage } from '../lib/forgotPassword'

export function VerifyEmailPage() {
  const {
    user, loading, verificationError, verificationCooldownUntil,
    resendVerificationEmail, refreshUser, logout,
  } = useAuth()
  const actionPending = useRef(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [now, setNow] = useState(Date.now)
  const cooldownSeconds = Math.max(0, Math.ceil((verificationCooldownUntil - now) / 1000))
  const isBusy = loading || isResending || isRefreshing || isLoggingOut

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  async function handleResendEmail() {
    if (actionPending.current || loading || Date.now() < verificationCooldownUntil) return
    actionPending.current = true
    setMessage('')
    setError('')
    setIsResending(true)

    try {
      await resendVerificationEmail()
      setMessage('Email verifikasi sudah dikirim ulang.')
    } catch (cause) {
      setError(getFirebaseErrorMessage(cause, 'Gagal mengirim ulang email verifikasi. Coba lagi.'))
    } finally {
      actionPending.current = false
      setNow(Date.now())
      setIsResending(false)
    }
  }

  async function handleRefreshStatus() {
    if (actionPending.current || loading) return
    actionPending.current = true
    setMessage('')
    setError('')
    setIsRefreshing(true)

    try {
      const refreshedUser = await refreshUser()

      if (refreshedUser?.emailVerified) {
        return
      }

      setMessage('Email belum terverifikasi.')
    } catch (cause) {
      setError(getFirebaseErrorMessage(cause, 'Gagal menyegarkan status verifikasi. Coba lagi.'))
    } finally {
      actionPending.current = false
      setIsRefreshing(false)
    }
  }

  async function handleLogout() {
    if (actionPending.current || loading) return
    actionPending.current = true
    setError('')
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (cause) {
      setError(getFirebaseErrorMessage(cause, 'Gagal keluar. Coba lagi.'))
    } finally {
      actionPending.current = false
      setIsLoggingOut(false)
    }
  }

  return (
    <PageContainer
      title="Verifikasi Email"
      description={`Verifikasi ${user?.email ?? 'email kamu'} untuk melanjutkan.`}
    >
      <div aria-busy={isBusy} className="grid w-full max-w-md gap-4 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm leading-6 text-zinc-700">
          Cek kotak masuk atau folder spam untuk melakukan verifikasi.
          Setelah klik link verifikasi di email, kembali ke halaman ini lalu
          segarkan status. Jika email belum diterima, gunakan tombol kirim ulang.
        </p>

        {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
        {(error || verificationError) && (
          <p role="alert" className="text-sm text-red-600">{error || verificationError}</p>
        )}

        <button
          type="button"
          disabled={isBusy || cooldownSeconds > 0}
          onClick={handleResendEmail}
          className="min-h-11 rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          {isResending ? 'Mengirim...' : cooldownSeconds > 0
            ? `Kirim ulang dalam ${cooldownSeconds} detik`
            : 'Kirim ulang email verifikasi'}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={handleRefreshStatus}
          className="min-h-11 rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
        >
          {isRefreshing ? 'Menyegarkan...' : 'Segarkan status verifikasi'}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={handleLogout}
          className="min-h-11 rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
        >
          {isLoggingOut ? 'Keluar...' : 'Keluar'}
        </button>
      </div>
    </PageContainer>
  )
}
