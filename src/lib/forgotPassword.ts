import { FirebaseError } from 'firebase/app'
import type { Auth } from 'firebase/auth'

export const passwordResetSuccessMessage =
  'Link reset kata sandi sudah dikirim. Cek kotak masuk atau folder spam email kamu.'

export function normalizePasswordResetEmail(email: string) {
  return email.trim()
}

export function getFirebaseErrorCode(error: unknown) {
  if (error instanceof FirebaseError) {
    return error.code
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }

  return 'unknown-error'
}

export function createForgotPasswordDebugContext(auth: Auth, email: string) {
  const normalizedEmail = normalizePasswordResetEmail(email)
  const emailDomain = getEmailDomain(normalizedEmail)

  return {
    authDomain: auth.app.options.authDomain ?? 'unknown-auth-domain',
    email: maskEmail(normalizedEmail),
    emailDomain,
    projectId: auth.app.options.projectId ?? 'unknown-project',
  }
}

function getEmailDomain(email: string) {
  const domain = email.split('@')[1]

  return domain ? domain.toLowerCase() : 'unknown-domain'
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@')

  if (!localPart || !domain) {
    return '[invalid-email]'
  }

  const firstCharacter = localPart.slice(0, 1)
  const lastCharacter = localPart.length > 1 ? localPart.slice(-1) : ''

  return `${firstCharacter}***${lastCharacter}@${domain.toLowerCase()}`
}
