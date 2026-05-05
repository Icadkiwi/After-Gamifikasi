import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageContainer } from '../components/PageContainer'
import { useAuth } from '../contexts/AuthContext'

export function VerifyEmailPage() {
  const { user, resendVerificationEmail, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function handleResendEmail() {
    setMessage('')
    setError('')
    setIsResending(true)

    try {
      await resendVerificationEmail()
      setMessage('Email verifikasi sudah dikirim ulang.')
    } catch {
      setError('Gagal mengirim ulang email verifikasi.')
    } finally {
      setIsResending(false)
    }
  }

  async function handleRefreshStatus() {
    setMessage('')
    setError('')
    setIsRefreshing(true)

    try {
      const refreshedUser = await refreshUser()

      if (refreshedUser?.emailVerified) {
        navigate('/game')
        return
      }

      setMessage('Email belum terverifikasi.')
    } catch {
      setError('Gagal refresh status verifikasi.')
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <PageContainer
      title="Verifikasi Email"
      description={`Kami sudah mengirim link verifikasi ke ${user?.email ?? 'email kamu'}.`}
    >
      <div className="grid max-w-md gap-4 rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Setelah klik link verifikasi di email, kembali ke halaman ini lalu
          refresh status.
        </p>

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={isResending}
          onClick={handleResendEmail}
          className="rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          {isResending ? 'Mengirim...' : 'Resend verification email'}
        </button>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={handleRefreshStatus}
          className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
        >
          {isRefreshing ? 'Refresh...' : 'Refresh verification status'}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
        >
          Logout
        </button>
      </div>
    </PageContainer>
  )
}
