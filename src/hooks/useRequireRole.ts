import { useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import type { UserRole } from "#/types"
import { useAuth } from "./useAuth"

/**
 * Redirects to `redirectTo` if the user is not authenticated or does not have
 * one of the allowed roles. Call at the top of any protected page component.
 */
export function useRequireRole(allowedRoles: UserRole[], redirectTo = "/") {
	const auth = useAuth()
	const router = useRouter()

	useEffect(() => {
		const isUnauthorized = !(auth.loading || (auth.user && allowedRoles.includes(auth.user.role)))
		if (isUnauthorized) {
			void router.navigate({ to: redirectTo })
		}
	}, [auth.user, auth.loading, router, allowedRoles, redirectTo])

	return auth
}
