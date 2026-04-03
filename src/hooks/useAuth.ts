import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { UserRole, AuthUser } from "../types"

export type { UserRole, AuthUser }

export function useAuth() {
	const { signIn, signOut } = useAuthActions()
	const viewer = useQuery(api.users.getViewer)

	const user: AuthUser | null = viewer
		? {
				id: viewer._id,
				name: viewer.name,
				email: viewer.email,
				role: viewer.role as UserRole,
				avatarUrl: viewer.avatarUrl,
			}
		: null

	const loading = viewer === undefined

	return {
		user,
		loading,
		isLoggedIn: !!user,
		signIn,
		signOut,
		login: async (email: string, password: string) => {
			await signIn("password", { email, password, flow: "signIn" })
		},
		register: async (email: string, password: string, name: string, role: UserRole) => {
			await signIn("password", { email, password, flow: "signUp", name, role })
		},
		logout: () => signOut(),
	}
}
