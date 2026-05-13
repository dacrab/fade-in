import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import type { UserRole } from "#/types"
import { api } from "../../convex/_generated/api"

/**
 * Provides the current authenticated user and auth actions.
 * Returns `user: AuthUser | null`, `loading: boolean`, `isLoggedIn: boolean`,
 * and methods: `login`, `register`, `logout`, `signIn`, `signOut`.
 */
export function useAuth() {
	const { signIn, signOut } = useAuthActions()
	const viewer = useQuery(api.users.getViewer)

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
		isLoggedIn: !!user,
		signIn,
		signOut,
		login: (email: string, password: string) =>
			signIn("password", { email, password, flow: "signIn" }),
		register: (email: string, password: string, name: string, role: UserRole) =>
			signIn("password", { email, password, flow: "signUp", name, role }),
		logout: () => signOut(),
	}
}
