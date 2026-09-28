import assert from 'node:assert/strict'
import { test } from 'node:test'

import { FirebaseError } from 'firebase/app'

import {
  createForgotPasswordDebugContext,
  getFirebaseErrorCode,
  normalizePasswordResetEmail,
  passwordResetSuccessMessage,
} from '../src/lib/forgotPassword.ts'

test('normalizes password reset email before sending', () => {
  assert.equal(
    normalizePasswordResetEmail('  user@example.com  '),
    'user@example.com',
  )
})

test('extracts Firebase error code for the UI', () => {
  const error = new FirebaseError('auth/invalid-email', 'Invalid email')

  assert.equal(getFirebaseErrorCode(error), 'auth/invalid-email')
})

test('creates safe debug context without logging the full email', () => {
  const auth = {
    app: {
      options: {
        authDomain: 'after-gamification.firebaseapp.com',
        projectId: 'after-gamification',
      },
    },
  }

  const context = createForgotPasswordDebugContext(auth, 'person@example.com')

  assert.equal(context.projectId, 'after-gamification')
  assert.equal(context.authDomain, 'after-gamification.firebaseapp.com')
  assert.equal(context.emailDomain, 'example.com')
  assert.notEqual(context.email, 'person@example.com')
})

test('keeps requested success message stable', () => {
  assert.equal(
    passwordResetSuccessMessage,
    'Link reset kata sandi sudah dikirim. Cek kotak masuk atau folder spam email kamu.',
  )
})
