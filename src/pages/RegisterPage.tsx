import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { PageContainer } from '../components/PageContainer'
import { PasswordInput } from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await register(email, password)
      navigate('/verify-email')
    } catch {
      setError('Register gagal. Pastikan email valid dan password minimal 6 karakter.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer
      title="Register"
      description="Halaman awal untuk alur pendaftaran akun baru."
    >
      <form
        className="grid max-w-md gap-5 rounded-md border border-zinc-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Email
          <input
            type="email"
            name="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-base font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <div className="grid gap-2 text-sm font-medium text-zinc-800">
          <label htmlFor="register-password">Password</label>
          <PasswordInput
            id="register-password"
            name="password"
            placeholder="Buat password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
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
