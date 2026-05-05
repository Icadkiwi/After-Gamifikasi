/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
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

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  resendVerificationEmail: () => Promise<void>
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    setUser(credential.user)

    return credential.user
  }

  async function register(email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    )

    await sendEmailVerification(credential.user)
    setUser(credential.user)

    return credential.user
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
  }

  async function resendVerificationEmail() {
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error('User belum login.')
    }

    await sendEmailVerification(currentUser)
  }

  async function refreshUser() {
    const currentUser = auth.currentUser

    if (!currentUser) {
      setUser(null)
      return null
    }

    await reload(currentUser)
    setUser(auth.currentUser)
    setRefreshCount((count) => count + 1)

    return auth.currentUser
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resendVerificationEmail,
    refreshUser,
    refreshCount,
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
