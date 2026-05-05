import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AuthGate } from '../components/AuthGate'
import { RootLayout } from '../layouts/RootLayout'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { GamePage } from '../pages/GamePage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { VerifyEmailPage } from '../pages/VerifyEmailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <AuthGate>
            <Navigate to="/game" replace />
          </AuthGate>
        ),
      },
      {
        path: 'game',
        element: (
          <AuthGate>
            <GamePage />
          </AuthGate>
        ),
      },
      {
        path: 'login',
        element: (
          <AuthGate guestOnly>
            <LoginPage />
          </AuthGate>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <AuthGate guestOnly>
            <ForgotPasswordPage />
          </AuthGate>
        ),
      },
      {
        path: 'register',
        element: (
          <AuthGate guestOnly>
            <RegisterPage />
          </AuthGate>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <AuthGate allowUnverified>
            <VerifyEmailPage />
          </AuthGate>
        ),
      },
    ],
  },
])
