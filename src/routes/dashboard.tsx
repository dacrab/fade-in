import { createFileRoute, Outlet } from "@tanstack/react-router"
import { Skeleton } from "#/components/ui/Skeleton"
import { CUSTOMER_ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout })

function DashboardLayout() {
	const { user } = useRequireRole(CUSTOMER_ADMIN_ROLES)

	if (!user) return <Skeleton className="h-64 m-8 rounded-(--radius-lg)" />

	return <Outlet />
}
