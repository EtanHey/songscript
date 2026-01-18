import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="border-b border-border bg-card">
      <nav className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-foreground">
          SongScript
        </Link>
      </nav>
    </header>
  )
}
