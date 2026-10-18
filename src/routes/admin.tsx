import { createFileRoute, Outlet } from "@tanstack/react-router"
import AdminNav from "#/components/AdminNav"
import { Skeleton } from "#/components/ui/Skeleton"
import { ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"

export const Route = createFileRoute("/admin")({ component: AdminLayout })

function AdminLayout() {
	const { user } = useRequireRole(ADMIN_ROLES)

	if (!user) return <Skeleton className="h-64 m-8 rounded-2xl" />

	return (
		<div className="dashboard-layout">
			<AdminNav />
			<Outlet />
		</div>
	)
}
