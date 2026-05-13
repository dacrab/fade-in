import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuth } from "#/hooks/useAuth"

export function useBusinessAuth() {
	const { user, loading } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!loading && user && user.role !== "owner" && user.role !== "admin") {
			void navigate({ to: "/" })
		}
	}, [user, loading, navigate])

	return { user, loading }
}
