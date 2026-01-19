import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'
import { WishlistButton } from '../components/WishlistButton'
import type { Doc } from '../../convex/_generated/dataModel'

// Type for song document from Convex
type Song = Doc<'songs'>

// Server function to fetch songs at request time (SSR)
const getSongs = createServerFn({ method: 'GET' }).handler(async () => {
  const convexUrl = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL
  if (!convexUrl) {
    console.error('CONVEX_URL not configured for SSR')
    return [] as Song[]
  }

  const client = new ConvexHttpClient(convexUrl)
  const songs = await client.query(api.songs.list, {})
  return songs
})

export const Route = createFileRoute('/')({
  loader: async () => {
    // Fetch songs on the server for SSR
    const songs = await getSongs()
    return { songs }
  },
  component: HomePage,
})

function HomePage() {
  // Get SSR-provided data from loader
  const loaderData = Route.useLoaderData()

  // Use TanStack Query for real-time updates, initialized with loader data
  const { data: songs, isLoading } = useQuery({
    ...convexQuery(api.songs.list, {}),
    initialData: loaderData.songs,
  })

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
                <div className="aspect-video w-full bg-gray-800 relative">
                  <img
                    src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
                    alt={`${song.title} thumbnail`}
                    className="h-full w-full object-cover"
                  />
                  {/* Wishlist button overlay */}
                  <div className="absolute top-2 right-2">
                    <WishlistButton songId={song._id} size="sm" />
                  </div>
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
