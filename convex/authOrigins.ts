// Keep Better Auth validation and HTTP CORS on the same explicit allowlist.
export const trustedOrigins = [
  "http://localhost:3001",
  "https://songscript-ten.vercel.app",
  "https://songscript-eight.vercel.app",
  ...(process.env.SITE_URL ? [new URL(process.env.SITE_URL).origin] : []),
];
