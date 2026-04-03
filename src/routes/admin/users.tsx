import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import AsyncList from "#/components/AsyncList"
import PageHeader from "#/components/PageHeader"
import { useRequireRole } from "#/hooks/useRequireRole"
import type { User, UserRole } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/admin/users")({ component: AdminUsers })

const ROLE_BADGE: Record<UserRole, string> = {
	customer: "badge-gray",
	owner: "badge-gold",
	barber: "badge-green",
	admin: "badge-red",
}

function AdminUsers() {
	const { t } = useTranslation()
	useRequireRole(["admin"])
	const allUsers = useQuery(api.users.listAll) as User[] | undefined

	return (
		<main className="page-main">
			<div className="page-wrap max-w-4xl">
				<PageHeader back="/admin" backLabel={t("nav.admin")} title={t("admin.users.title")} />

				<AsyncList
					data={allUsers}
					skeleton={{ count: 6, height: "h-14" }}
					empty={{ icon: Users, message: t("admin.users.noUsers") }}
				>
					{(users) => (
						<div className="card overflow-hidden">
							<div className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
								<span>{t("admin.users.colName")}</span>
								<span>{t("admin.users.colEmail")}</span>
								<span>{t("admin.users.colRole")}</span>
							</div>
							{users.map((u, i) => (
								<div
									key={u._id}
									className={`grid grid-cols-3 gap-4 px-4 py-3 items-center ${i < users.length - 1 ? "border-b border-[var(--border)]" : ""}`}
								>
									<div className="flex items-center gap-2 min-w-0">
										<div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-[var(--gold)] text-black">
											{u.name.charAt(0).toUpperCase()}
										</div>
										<span className="text-sm text-[var(--text)] truncate">{u.name}</span>
									</div>
									<span className="text-sm text-[var(--text-muted)] truncate">{u.email}</span>
									<span className={`badge ${ROLE_BADGE[u.role]} w-fit`}>{u.role}</span>
								</div>
							))}
						</div>
					)}
				</AsyncList>
			</div>
		</main>
	)
}
