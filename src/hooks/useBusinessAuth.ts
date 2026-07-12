import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuth } from "#/hooks/useAuth"
import { isOwnerOrAdmin } from "#/types"

export function useBusinessAuth() {
	const { user, loading } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!loading && user && !isOwnerOrAdmin(user)) {
			navigate({ to: "/" })
		}
	}, [user, loading, navigate])

	return { user, loading }
}
