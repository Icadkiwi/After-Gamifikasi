import { useRef, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { getFirebaseErrorMessage } from '../lib/forgotPassword'

type AuthGateProps = {
  children: ReactNode
  allowUnverified?: boolean
  guestOnly?: boolean
}

export function AuthGate({
  children,
  allowUnverified = false,
  guestOnly = false,
}: AuthGateProps) {
  const { user, loading, initializing, authError, refreshUser, logout } = useAuth()
  const location = useLocation()
  const actionPending = useRef(false)
  const [actionError, setActionError] = useState('')

  async function recoverSession(action: () => Promise<unknown>) {
    if (actionPending.current || loading) return
    actionPending.current = true
    setActionError('')
    try {
      await action()
    } catch (cause) {
      setActionError(getFirebaseErrorMessage(cause, 'Gagal memulihkan sesi. Coba lagi.'))
    } finally {
      actionPending.current = false
    }
  }

  if (authError) {
    return (
      <div className="mx-auto grid w-full max-w-md gap-4 px-6 py-12 text-sm text-zinc-700">
        <p role="alert" className="text-red-600">{actionError || authError}</p>
        <button
          type="button"
          disabled={loading}
          onClick={() => void recoverSession(refreshUser)}
          className="min-h-11 rounded-md bg-zinc-950 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Coba lagi'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void recoverSession(logout)}
          className="min-h-11 rounded-md border border-zinc-300 px-4 py-2.5 font-semibold disabled:opacity-50"
        >
          Keluar
        </button>
      </div>
    )
  }

  if (loading) {
    // Pertahankan form dan pesannya selama operasi; redirect menunggu sesi siap.
    if (!initializing && (guestOnly || allowUnverified)) return children
    return (
      <div role="status" className="mx-auto w-full max-w-4xl px-6 py-12 text-sm text-zinc-700">
        Memuat...
      </div>
    )
  }

  if (guestOnly) {
    if (!user) {
      return children
    }

    return (
      <Navigate to={user.emailVerified ? '/game' : '/verify-email'} replace />
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!user.emailVerified && !allowUnverified) {
    return <Navigate to="/verify-email" replace />
  }

  if (user.emailVerified && allowUnverified) {
    return <Navigate to="/game" replace />
  }

  return children
}
