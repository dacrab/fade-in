import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import type { UserRole } from "#/types"
import { useAuth } from "./useAuth"

export function useRequireRole(roles: UserRole[]) {
	const { user, loading } = useAuth()
	const navigate = useNavigate()
	const roleKey = roles.join(",")

	useEffect(() => {
		if (!loading && (user === null || !roleKey.split(",").includes(user.role))) {
			void navigate({ to: "/" })
		}
	}, [user, loading, roleKey, navigate])

	return { user, loading }
}
