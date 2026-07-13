import { useClerk, useUser } from "@clerk/tanstack-react-start"
import { useMutation, useQuery } from "convex/react"
import { useEffect } from "react"
import type { UserRole } from "#/types"
import { api } from "../../convex/_generated/api"

export function useAuth() {
	const { signOut } = useClerk()
	const { user: clerkUser, isLoaded } = useUser()
	const viewer = useQuery(api.users.getViewer)
	const ensureCurrentUser = useMutation(api.users.ensureCurrentUser)

	useEffect(() => {
		if (isLoaded && clerkUser) void ensureCurrentUser()
	}, [isLoaded, clerkUser, ensureCurrentUser])

	const user = viewer
		? {
				id: viewer._id,
				name: viewer.name ?? viewer.email,
				email: viewer.email,
				role: (viewer.role ?? "customer") as UserRole,
				avatarUrl: viewer.avatarUrl,
			}
		: null

	return {
		user,
		loading: viewer === undefined,
		signIn: async () => {},
		signOut,
		login: () => {
			throw new Error("Use Clerk's useSignIn hook directly")
		},
		register: () => {
			throw new Error("Use Clerk's useSignUp hook directly")
		},
	}
}
