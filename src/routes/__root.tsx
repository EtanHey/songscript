import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  Link,
} from "@tanstack/react-router";
import { lazy } from "react";

import Header from "../components/Header";

// Only load devtools in development
const TanStackDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-devtools").then((mod) => ({
        default: mod.TanStackDevtools,
      })),
    )
  : () => null;

const TanStackRouterDevtoolsPanel = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((mod) => ({
        default: mod.TanStackRouterDevtoolsPanel,
      })),
    )
  : () => null;

import { ConvexClientProvider } from "../providers/ConvexClientProvider";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="mb-4 text-6xl font-bold text-gray-400">404</h1>
      <p className="mb-8 text-xl text-gray-500">Page not found</p>
      <Link
        to="/"
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}

export const Route = createRootRoute({
  notFoundComponent: NotFoundComponent,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "SongScript",
      },
      {
        name: "description",
        content:
          "Learn songs in any language with transliteration, word-by-word breakdowns, and karaoke-style lyrics sync.",
      },
      {
        property: "og:title",
        content: "SongScript",
      },
      {
        property: "og:description",
        content:
          "Learn songs in any language with transliteration, word-by-word breakdowns, and karaoke-style lyrics sync.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary",
      },
      {
        name: "twitter:title",
        content: "SongScript",
      },
      {
        name: "twitter:description",
        content:
          "Learn songs in any language with transliteration and karaoke-style lyrics sync.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  return <Outlet />;
}

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
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
