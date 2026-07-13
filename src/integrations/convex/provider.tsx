import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"

const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
	return (
		<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
			<ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
				{children}
			</ConvexProviderWithClerk>
		</ClerkProvider>
	)
}
