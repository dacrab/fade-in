import { createFileRoute, Outlet } from "@tanstack/react-router"
import AdminNav from "#/components/AdminNav"
import { Skeleton } from "#/components/ui/Skeleton"
import { ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"

export const Route = createFileRoute("/admin")({ component: AdminLayout })

function AdminLayout() {
	const { user } = useRequireRole(ADMIN_ROLES)

	if (!user) return <Skeleton className="m-8 h-64 rounded-(--radius-lg)" />

	return (
		<div className="flex flex-1 flex-col md:flex-row">
			<AdminNav />
			<div className="min-w-0 flex-1 overflow-auto">
				<Outlet />
			</div>
		</div>
	)
}
