import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
]

export function RootLayout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const isLoggedIn = Boolean(user)
  const displayName = user?.displayName?.trim() || user?.email || 'User'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
      <header className="h-16 shrink-0 border-b border-zinc-200 bg-white">
        <nav className="flex h-full w-full items-center justify-between gap-2 px-4 sm:px-6">
          <NavLink to="/" className="shrink-0 text-base font-semibold sm:text-lg">
            After Gamifikasi
          </NavLink>

          <div className="flex min-w-0 items-center justify-end gap-2">
            {!isLoggedIn &&
              navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-md px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-zinc-950 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}

            {isLoggedIn && !loading && (
              <>
                <span className="w-20 truncate text-right text-sm font-medium text-zinc-600 sm:w-56">
                  {displayName}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
