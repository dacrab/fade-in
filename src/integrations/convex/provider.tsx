import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { ConvexReactClient } from "convex/react"

const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
	return <ConvexAuthProvider client={convexClient}>{children}</ConvexAuthProvider>
}
