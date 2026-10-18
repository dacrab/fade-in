import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "convex/react"
import { useTranslation } from "react-i18next"
import { DataTable, type features } from "#/components/ui/DataTable"
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

	const allUsers = useQuery(api.users.listAll)

	const columns: ColumnDef<typeof features, Doc<"users">>[] = [
		{
			header: t("admin.users.colName"),
			accessorFn: (row) => row.name ?? "",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="flex items-center gap-2 min-w-0">
					<div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-(--gold) text-black">
						{row.original.name?.charAt(0).toUpperCase() ?? "?"}
					</div>
					<span className="main-sm truncate">{row.original.name}</span>
				</div>
			),
		},
		{
			header: t("admin.users.colEmail"),
			accessorKey: "email",
			cell: ({ row }) => <span className="muted-sm truncate">{row.original.email}</span>,
		},
		{
			header: t("admin.users.colRole"),
			accessorFn: (row) => parseUserRole(row.role),
			enableSorting: true,
			cell: ({ row }) => {
				const role = parseUserRole(row.original.role)
				return <span className={`badge ${ROLE_BADGE[role]} w-fit`}>{t(`admin.roles.${role}`)}</span>
			},
		},
	]

	return (
		<main className="page-main">
			<div className="page-wrap max-w-4xl">
				<h1 className="page-title mb-6">{t("admin.users.title")}</h1>
				<DataTable
					columns={columns}
					data={allUsers ?? []}
					loading={!allUsers}
					searchable
					searchPlaceholder={t("admin.users.colName")}
					emptyMessage={t("admin.users.noUsers")}
				/>
			</div>
		</main>
	)
}
