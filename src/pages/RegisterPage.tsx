import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { PageContainer } from '../components/PageContainer'
import { PasswordInput } from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'
import { getFirebaseErrorMessage, isValidEmail } from '../lib/forgotPassword'

export function RegisterPage() {
  const { register, loading } = useAuth()
  const submitPending = useRef(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitPending.current || loading) return
    setError('')
    if (!isValidEmail(email)) {
      setError('Masukkan alamat email dengan format yang valid.')
      return
    }
    if (password.length < 6) {
      setError('Kata sandi harus terdiri dari minimal 6 karakter.')
      return
    }
    submitPending.current = true
    setIsSubmitting(true)

    try {
      await register(email.trim(), password)
    } catch (cause) {
      setError(getFirebaseErrorMessage(cause, 'Pendaftaran gagal. Coba lagi.'))
    } finally {
      submitPending.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer
      title="Daftar"
      description="Halaman awal untuk alur pendaftaran akun baru."
    >
      <form
        className="grid w-full max-w-md gap-5 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:p-6"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isSubmitting || loading}
      >
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            disabled={isSubmitting || loading}
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base font-normal text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <div className="grid gap-2 text-sm font-medium text-zinc-800">
          <label htmlFor="register-password">Kata Sandi</label>
          <PasswordInput
            id="register-password"
            name="password"
            autoComplete="new-password"
            disabled={isSubmitting || loading}
            placeholder="Buat kata sandi"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base font-normal text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="min-h-11 rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          {isSubmitting ? 'Memproses...' : 'Daftar'}
        </button>

        <Link className="text-sm font-medium text-emerald-700" to="/login">
          Sudah punya akun
        </Link>
      </form>
    </PageContainer>
  )
}
