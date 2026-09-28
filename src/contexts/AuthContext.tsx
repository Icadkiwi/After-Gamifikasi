/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'

import { auth } from '../lib/firebase'
import { ensureUserDocument } from '../lib/firestore-finance'
import { getFirebaseErrorCode, getFirebaseErrorMessage } from '../lib/forgotPassword'

type AuthContextValue = {
  user: User | null
  loading: boolean
  initializing: boolean
  authError: string
  verificationError: string
  verificationCooldownUntil: number
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  resendVerificationEmail: () => Promise<void>
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const verificationCooldownMs = 60_000

async function prepareUser(currentUser: User) {
  await reload(currentUser)
  await currentUser.getIdToken(true)
  if (auth.currentUser !== currentUser) {
    throw new FirebaseError('auth/no-current-user', 'Sesi pengguna berubah.')
  }
  await ensureUserDocument(currentUser.uid, currentUser.email)
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<{
    user: User | null
    initializing: boolean
    error: string
  }>({ user: null, initializing: true, error: '' })
  const [busy, setBusy] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [verificationCooldownUntil, setVerificationCooldownUntil] = useState(0)
  const operationPending = useRef(false)
  const operationUser = useRef<User | null>(null)
  const publishedUser = useRef<User | null | undefined>(undefined)
  const revision = useRef(0)
  const cooldowns = useRef<Record<string, number>>({})

  function readCooldown(uid: string) {
    let storedUntil = 0
    try {
      storedUntil = Number(sessionStorage.getItem(`verification-cooldown-${uid}`)) || 0
    } catch {
      // Cooldown dalam memori tetap berlaku jika penyimpanan browser diblokir.
    }
    return Math.max(cooldowns.current[uid] ?? 0, storedUntil)
  }

  function startCooldown(uid: string) {
    const until = Date.now() + verificationCooldownMs
    cooldowns.current[uid] = until
    setVerificationCooldownUntil(until)
    try {
      sessionStorage.setItem(`verification-cooldown-${uid}`, String(until))
    } catch {
      // Pengiriman email tetap berhasil tanpa penyimpanan browser.
    }
  }

  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Login/registrasi memublikasikan sesi setelah seluruh tahapnya selesai.
      if (operationPending.current || auth.currentUser !== currentUser || publishedUser.current === currentUser) return
      const currentRevision = ++revision.current
      publishedUser.current = undefined
      setSession((previous) => ({ ...previous, initializing: true, error: '' }))
      setVerificationError('')
      setVerificationCooldownUntil(currentUser ? readCooldown(currentUser.uid) : 0)

      void (async () => {
        let error = ''
        try {
          if (currentUser) await prepareUser(currentUser)
        } catch (cause) {
          error = getFirebaseErrorMessage(cause, 'Gagal menyiapkan sesi dan profil akun. Coba lagi.')
        }
        if (!active || currentRevision !== revision.current || auth.currentUser !== currentUser) return
        publishedUser.current = currentUser
        setSession({ user: currentUser, initializing: false, error })
      })()
    }, (cause) => {
      if (!active || operationPending.current) return
      ++revision.current
      setSession({
        user: null,
        initializing: false,
        error: getFirebaseErrorMessage(cause, 'Gagal memuat sesi. Coba lagi.'),
      })
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  async function runOperation<T,>(operation: () => Promise<T>): Promise<T> {
    if (operationPending.current) {
      throw new FirebaseError('auth/request-in-progress', 'Proses autentikasi belum selesai.')
    }
    operationPending.current = true
    operationUser.current = auth.currentUser
    ++revision.current
    setBusy(true)
    try {
      return await operation()
    } finally {
      // Baca sesi terbaru agar hasil operasi lama tidak menghidupkan sesi yang sudah keluar.
      const currentUser = auth.currentUser
      const sessionChanged = currentUser !== operationUser.current
      publishedUser.current = currentUser
      if (sessionChanged) {
        setVerificationError('')
        setVerificationCooldownUntil(currentUser ? readCooldown(currentUser.uid) : 0)
      }
      setSession((previous) => ({
        ...previous,
        user: currentUser,
        initializing: false,
        error: !currentUser ? '' : sessionChanged
          ? 'Sesi akun berubah. Coba lagi untuk memuat sesi terbaru.'
          : previous.error,
      }))
      operationPending.current = false
      setBusy(false)
    }
  }

  async function prepareSession(currentUser: User) {
    try {
      await prepareUser(currentUser)
      setSession((previous) => ({ ...previous, error: '' }))
    } catch (cause) {
      setSession((previous) => ({
        ...previous,
        error: getFirebaseErrorMessage(cause, 'Gagal menyiapkan profil akun. Coba lagi.'),
      }))
      throw cause
    }
  }

  function login(email: string, password: string) {
    return runOperation(async () => {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      operationUser.current = credential.user
      setVerificationError('')
      setVerificationCooldownUntil(readCooldown(credential.user.uid))
      await prepareSession(credential.user)
      return credential.user
    })
  }

  async function sendVerification(currentUser: User) {
    if (Date.now() < readCooldown(currentUser.uid)) {
      throw new FirebaseError('auth/verification-cooldown', 'Tunggu sebelum mengirim ulang.')
    }
    try {
      await sendEmailVerification(currentUser)
      startCooldown(currentUser.uid)
      setVerificationError('')
    } catch (cause) {
      if (getFirebaseErrorCode(cause) === 'auth/too-many-requests') {
        startCooldown(currentUser.uid)
      }
      throw cause
    }
  }

  function register(email: string, password: string) {
    return runOperation(async () => {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      operationUser.current = credential.user
      setVerificationError('')
      setVerificationCooldownUntil(0)
      // Kedua tahap tetap dicoba: kegagalan profil tidak menghalangi email verifikasi.
      const [profile, verification] = await Promise.allSettled([
        ensureUserDocument(credential.user.uid, credential.user.email),
        sendVerification(credential.user),
      ])
      setSession((previous) => ({
        ...previous,
        error: profile.status === 'rejected'
          ? `Akun sudah dibuat, tetapi profil belum tersimpan. ${getFirebaseErrorMessage(profile.reason, 'Coba lagi untuk menyimpan profil.')}`
          : '',
      }))
      if (verification.status === 'rejected') {
        setVerificationError(`Akun sudah dibuat, tetapi email verifikasi belum terkirim. ${getFirebaseErrorMessage(verification.reason, 'Gunakan tombol kirim ulang untuk mencoba lagi.')}`)
      }
      return credential.user
    })
  }

  function logout() {
    return runOperation(async () => {
      await signOut(auth)
      operationUser.current = null
      setVerificationError('')
      setVerificationCooldownUntil(0)
    })
  }

  function resendVerificationEmail() {
    return runOperation(async () => {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new FirebaseError('auth/no-current-user', 'Pengguna belum masuk.')
      }
      await sendVerification(currentUser)
    })
  }

  function refreshUser() {
    return runOperation(async () => {
      const currentUser = auth.currentUser
      if (currentUser) await prepareSession(currentUser)
      return auth.currentUser
    })
  }

  const value = {
    user: session.user,
    loading: session.initializing || busy,
    initializing: session.initializing,
    authError: session.error,
    verificationError,
    verificationCooldownUntil,
    login,
    register,
    logout,
    resendVerificationEmail,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.')
  }

  return context
}
