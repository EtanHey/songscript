import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-gray-900">
      <nav className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold iran-gradient">
          SongScript
        </Link>
      </nav>
    </header>
  )
}
