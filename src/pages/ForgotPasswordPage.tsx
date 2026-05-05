import { useState, type FormEvent } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Link } from 'react-router-dom'

import { PageContainer } from '../components/PageContainer'
import {
  createForgotPasswordDebugContext,
  getFirebaseErrorCode,
  normalizePasswordResetEmail,
  passwordResetSuccessMessage,
} from '../lib/forgotPassword'
import { auth } from '../lib/firebase'

export function ForgotPasswordPage() {
  const [emailInput, setEmailInput] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const email = normalizePasswordResetEmail(emailInput)

    if (!email) {
      setError('Masukkan email yang valid.')
      return
    }

    const debugContext = createForgotPasswordDebugContext(auth, email)
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
        error,
        errorCode,
      })

      setError(errorCode)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer
      title="Lupa Password"
      description="Masukkan email akun kamu untuk menerima link reset password."
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
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-base font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        {success && <p className="text-sm text-emerald-700">{success}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim link reset password'}
        </button>

        <Link className="text-sm font-medium text-emerald-700" to="/login">
          Kembali ke login
        </Link>
      </form>
    </PageContainer>
  )
}
