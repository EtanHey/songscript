import { Link, useNavigate } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'

export default function Header() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const isLoggedIn = !!session?.user

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/' })
  }

  return (
    <header className="border-b border-gray-800 bg-gray-900">
      <nav className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="text-xl font-bold iran-gradient sm:text-2xl">
          SongScript
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {isPending ? (
            <span className="text-sm text-gray-500">...</span>
          ) : isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white sm:text-base"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white sm:text-base"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white sm:text-base"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
