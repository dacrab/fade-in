import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL as string
if (!CONVEX_URL) {
  console.error('Missing VITE_CONVEX_URL environment variable')
}

const convexClient = new ConvexReactClient(CONVEX_URL)

export default function AppConvexProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConvexAuthProvider client={convexClient}>
      {children}
    </ConvexAuthProvider>
  )
}
