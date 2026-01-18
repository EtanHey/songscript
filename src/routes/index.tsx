import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const { data: songs, isLoading } = useQuery(convexQuery(api.songs.list, {}))

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 iran-gradient">SongScript</h1>
        <p className="text-gray-400 mb-8">Learn to read and pronounce songs in any language</p>

        <h2 className="text-2xl font-semibold mb-4">Songs</h2>

        {isLoading ? (
          <div className="text-gray-400">Loading songs...</div>
        ) : songs && songs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => (
              <Link
                key={song._id}
                to="/song/$songId"
                params={{ songId: song._id }}
                className="block overflow-hidden bg-gray-900 rounded-lg border border-gray-800 hover:border-green-500 transition-colors"
              >
                {/* YouTube Thumbnail */}
                <div className="aspect-video w-full bg-gray-800">
                  <img
                    src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
                    alt={`${song.title} thumbnail`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-white mb-1">{song.title}</h3>
                  <p className="text-gray-400">{song.artist}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {song.sourceLanguage === 'fa' ? 'Persian' : song.sourceLanguage}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">No songs yet</div>
        )}
      </div>
    </div>
  )
}
