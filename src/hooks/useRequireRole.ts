import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { useEffect } from "react"
import type { UserRole } from "#/types"
import { api } from "../../convex/_generated/api"
import { useAuth, type Viewer } from "./useAuth"

export const ADMIN_ROLES: readonly UserRole[] = ["admin"]
export const OWNER_ADMIN_ROLES: readonly UserRole[] = ["owner", "admin"]
export const CUSTOMER_ADMIN_ROLES: readonly UserRole[] = ["customer", "admin"]
export const BARBER_ADMIN_ROLES: readonly UserRole[] = ["barber", "admin"]

export function useRequireRole(
	roles: readonly UserRole[],
	allowShopOwnership = false,
): { user: Viewer | null; loading: boolean } {
	const { user, loading: authLoading } = useAuth()
	const navigate = useNavigate()
	const shops = useQuery(api.barbershops.listByOwner, allowShopOwnership && user ? {} : "skip")

	const loading = authLoading || (allowShopOwnership && user !== null && shops === undefined)

	useEffect(() => {
		if (loading) return
		if (!user) {
			void navigate({ to: "/" })
			return
		}
		const ownsShop = (shops?.length ?? 0) > 0
		if (!(roles.includes(user.role) || (allowShopOwnership && ownsShop))) {
			void navigate({ to: "/" })
		}
	}, [user, loading, roles, shops, allowShopOwnership, navigate])

	return { user, loading }
}
