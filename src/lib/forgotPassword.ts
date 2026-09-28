import { FirebaseError } from 'firebase/app'
import type { Auth } from 'firebase/auth'

export const passwordResetSuccessMessage =
  'Link reset kata sandi sudah dikirim. Cek kotak masuk atau folder spam email kamu.'

export function normalizePasswordResetEmail(email: string) {
  return email.trim()
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function getFirebaseErrorMessage(error: unknown, fallback: string) {
  switch (getFirebaseErrorCode(error)) {
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return 'Masukkan alamat email dengan format yang valid.'
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
      return 'Email atau kata sandi salah. Periksa kembali data masuk kamu.'
    case 'auth/user-not-found':
      return 'Akun dengan email tersebut tidak ditemukan.'
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Silakan masuk atau gunakan fitur lupa kata sandi.'
    case 'auth/missing-password':
      return 'Masukkan kata sandi kamu.'
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.'
    case 'auth/password-does-not-meet-requirements':
      return 'Kata sandi belum memenuhi kebijakan keamanan. Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.'
    case 'auth/network-request-failed':
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Koneksi ke server terputus. Periksa koneksi internet lalu coba lagi.'
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan. Hubungi pengelola aplikasi.'
    case 'auth/user-token-expired':
    case 'auth/invalid-user-token':
    case 'auth/requires-recent-login':
    case 'auth/no-current-user':
    case 'unauthenticated':
      return 'Sesi kamu sudah berakhir. Silakan masuk kembali.'
    case 'auth/operation-not-allowed':
      return 'Masuk dengan email dan kata sandi belum diaktifkan. Hubungi pengelola aplikasi.'
    case 'auth/invalid-api-key':
    case 'auth/app-not-authorized':
    case 'auth/unauthorized-domain':
      return 'Konfigurasi autentikasi aplikasi bermasalah. Hubungi pengelola aplikasi.'
    case 'auth/expired-action-code':
      return 'Tautan sudah kedaluwarsa. Minta tautan baru lalu coba lagi.'
    case 'auth/invalid-action-code':
      return 'Tautan tidak valid atau sudah digunakan. Minta tautan baru.'
    case 'auth/request-in-progress':
      return 'Proses sebelumnya belum selesai. Tunggu sebentar.'
    case 'auth/verification-cooldown':
      return 'Tunggu hingga hitung mundur selesai sebelum mengirim ulang email.'
    case 'permission-denied':
      return 'Akses database ditolak. Hubungi pengelola aplikasi untuk memeriksa izin data akun kamu.'
    case 'resource-exhausted':
    case 'auth/quota-exceeded':
      return 'Batas layanan sementara tercapai. Coba lagi nanti.'
    default:
      return fallback
  }
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
