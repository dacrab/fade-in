import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuth } from "#/hooks/useAuth"

const BUSINESS_ROLES = ["owner", "admin"] as const

export function useBusinessAuth() {
	const { user, loading } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!loading && user && !(BUSINESS_ROLES as readonly string[]).includes(user.role)) {
			navigate({ to: "/" })
		}
	}, [user, loading, navigate])

	return { user, loading }
}
