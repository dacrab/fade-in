import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { SkeletonRows } from "#/components/ui/Skeleton"
import { useAdminAuth } from "#/hooks/useAdminAuth"
import type { UserRole } from "#/types"
import { parseUserRole } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/admin/users")({ component: AdminUsers })

const ROLE_BADGE: Record<UserRole, string> = {
	customer: "badge-gray",
	owner: "badge-gold",
	barber: "badge-green",
	admin: "badge-red",
}

function AdminUsers() {
	const { t } = useTranslation()
	useAdminAuth()

	const allUsers = useQuery(api.users.listAll)

	return (
		<main className="page-main">
			<div className="page-wrap max-w-4xl">
				<div className="page-head">
					<div className="page-header">
						<Link to="/admin/overview" className="breadcrumb-back">
							← {t("nav.admin")}
						</Link>
						<span className="breadcrumb-sep">/</span>
						<h1>{t("admin.users.title")}</h1>
					</div>
				</div>

				{!allUsers ? (
					<SkeletonRows count={6} className="h-14 rounded-xl" />
				) : allUsers.length === 0 ? (
					<div className="empty-state">
						<Users size={36} className="mx-auto mb-3 opacity-30" />
						<p className="text-sm">{t("admin.users.noUsers")}</p>
					</div>
				) : (
					<div className="card overflow-hidden">
						<div className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-(--border) text-xs font-semibold text-(--text-muted)">
							<span>{t("admin.users.colName")}</span>
							<span>{t("admin.users.colEmail")}</span>
							<span>{t("admin.users.colRole")}</span>
						</div>
						{allUsers.map((u: Doc<"users">, i: number) => (
							<div
								key={u._id}
								className={`grid grid-cols-3 gap-4 px-4 py-3 items-center ${i < allUsers.length - 1 ? "border-b border-(--border)" : ""}`}
							>
								<div className="flex items-center gap-2 min-w-0">
									<div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-(--gold) text-black">
										{u.name?.charAt(0).toUpperCase() ?? "?"}
									</div>
									<span className="main-sm truncate">{u.name}</span>
								</div>
								<span className="muted-sm truncate">{u.email}</span>
								<span className={`badge ${ROLE_BADGE[parseUserRole(u.role)]} w-fit`}>
									{t(`admin.roles.${parseUserRole(u.role)}`)}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
