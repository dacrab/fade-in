import { ClerkProvider, useAuth as useClerkAuth, useUser } from "@clerk/tanstack-react-start"
import { ConvexReactClient, useMutation } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useEffect } from "react"
import { api } from "../../../convex/_generated/api"

const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

function SessionSync() {
	const { isLoaded, user } = useUser()
	const ensureCurrentUser = useMutation(api.users.ensureCurrentUser)

	useEffect(() => {
		if (isLoaded && user) void ensureCurrentUser()
	}, [isLoaded, user, ensureCurrentUser])

	return null
}

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
	return (
		<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
			<ConvexProviderWithClerk client={convexClient} useAuth={useClerkAuth}>
				<SessionSync />
				{children}
			</ConvexProviderWithClerk>
		</ClerkProvider>
	)
}
