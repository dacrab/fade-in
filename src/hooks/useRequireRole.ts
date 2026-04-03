import { useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import type { UserRole } from "#/types"
import { useAuth } from "./useAuth"

/**
 * Redirects to `redirectTo` if the user is not authenticated or does not have
 * one of the allowed roles. Call at the top of any protected page component.
 */
export function useRequireRole(allowedRoles: UserRole[], redirectTo = "/"): { loading: boolean } {
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (loading) return
		if (!(user && allowedRoles.includes(user.role))) {
			void router.navigate({ to: redirectTo })
		}
	}, [user, loading, router, allowedRoles, redirectTo])

	return { loading }
}
