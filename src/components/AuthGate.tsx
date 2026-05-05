import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

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
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12 text-sm text-zinc-600">
        Loading...
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
