import { useRef, useState, type FormEvent } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Link } from 'react-router-dom'

import { PageContainer } from '../components/PageContainer'
import {
  createForgotPasswordDebugContext,
  getFirebaseErrorCode,
  getFirebaseErrorMessage,
  isValidEmail,
  normalizePasswordResetEmail,
  passwordResetSuccessMessage,
} from '../lib/forgotPassword'
import { auth } from '../lib/firebase'

export function ForgotPasswordPage() {
  const submitPending = useRef(false)
  const [emailInput, setEmailInput] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitPending.current) return
    setError('')
    setSuccess('')

    const email = normalizePasswordResetEmail(emailInput)

    if (!isValidEmail(email)) {
      setError('Masukkan email yang valid.')
      return
    }

    const debugContext = createForgotPasswordDebugContext(auth, email)
    submitPending.current = true
    setIsSubmitting(true)

    try {
      console.info('[forgot-password] Sending password reset request.', debugContext)
      await sendPasswordResetEmail(auth, email)
      console.info(
        '[forgot-password] Firebase accepted password reset request.',
        debugContext,
      )
      setSuccess(passwordResetSuccessMessage)
    } catch (error) {
      const errorCode = getFirebaseErrorCode(error)

      console.error('[forgot-password] Password reset request failed.', {
        ...debugContext,
        errorCode,
      })

      setError(getFirebaseErrorMessage(error, 'Gagal mengirim link reset kata sandi. Coba lagi.'))
    } finally {
      submitPending.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer
      title="Lupa Kata Sandi"
      description="Masukkan email akun kamu untuk menerima link reset kata sandi."
    >
      <form
        className="grid w-full max-w-md gap-5 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:p-6"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isSubmitting}
      >
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            disabled={isSubmitting}
            placeholder="nama@email.com"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            required
            className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base font-normal text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim link reset kata sandi'}
        </button>

        <Link className="text-sm font-medium text-emerald-700" to="/login">
          Kembali ke halaman masuk
        </Link>
      </form>
    </PageContainer>
  )
}
