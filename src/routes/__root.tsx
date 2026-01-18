import {
  HeadContent,
  Scripts,
  createRootRoute,
  Link,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import { ConvexClientProvider } from '../providers/ConvexClientProvider'

import appCss from '../styles.css?url'

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="mb-4 text-6xl font-bold text-gray-400">404</h1>
      <p className="mb-8 text-xl text-gray-500">Song not found</p>
      <Link
        to="/"
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
}

export const Route = createRootRoute({
  notFoundComponent: NotFoundComponent,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'SongScript',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexClientProvider>
          <Header />
          {children}
        </ConvexClientProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
