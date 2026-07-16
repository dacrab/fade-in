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
				role: parseUserRole(viewer.role),
				avatarUrl: viewer.avatarUrl,
			}
		: null

	function parseUserRole(role: string | null | undefined): UserRole {
		if (role === "customer" || role === "owner" || role === "barber" || role === "admin") return role
		return "customer"
	}

	return {
		user,
		loading: viewer === undefined,
		signOut,
	}
}
