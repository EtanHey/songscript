import { createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Global loading component (like Next.js loading.tsx)
function DefaultPendingComponent() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
    </div>
  )
}

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Global loading component for all routes
    defaultPendingComponent: DefaultPendingComponent,
    defaultPendingMinMs: 200, // Show loading for at least 200ms to avoid flash
  })

  return router
}
