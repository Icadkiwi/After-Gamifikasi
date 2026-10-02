export type LocalRole = 'admin' | 'user'

export const LOCAL_SESSION_KEY = 'after-gamifikasi-local-session-v1'

export function canUseLocalAccess(development: boolean, hostname: string) {
  return development && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname)
}

// Both conditions are required: a Vite development build and a loopback host.
export const localAccessEnabled = canUseLocalAccess(
  Boolean(import.meta.env?.DEV),
  typeof window === 'undefined' ? '' : window.location.hostname,
)

export function readLocalRole(): LocalRole | null {
  if (!localAccessEnabled) return null
  try {
    const role = sessionStorage.getItem(LOCAL_SESSION_KEY)
    return role === 'admin' || role === 'user' ? role : null
  } catch {
    return null
  }
}

export function getLocalUser(role: LocalRole) {
  return {
    uid: `local-preview-${role}-v1`,
    email: `${role}@local.test`,
    displayName: role === 'admin' ? 'Admin Lokal' : 'User Lokal',
    emailVerified: true,
  }
}
