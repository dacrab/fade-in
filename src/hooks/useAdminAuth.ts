import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuth } from "./useAuth"

export function useAdminAuth() {
	const { user, loading } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!loading && user?.role !== "admin") {
			void navigate({ to: "/" })
		}
	}, [user, loading, navigate])

	return { user, loading }
}
