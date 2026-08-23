import { createFileRoute, Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "convex/react"
import type { FunctionReference } from "convex/server"
import { Calendar, Euro, Scissors, Store, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DataTable } from "#/components/ui/DataTable"
import { ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"
import { formatPrice } from "#/lib/format"
import { isAppointmentStatus, STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"

type ListAllWithDetails = (typeof api.appointments)["listAllWithDetails"]
type AppointmentRow = Extract<
	ListAllWithDetails,
	FunctionReference<"query", "public">
>["_returnType"][number]

export const Route = createFileRoute("/admin/appointments")({ component: AdminAppointments })

function AdminAppointments() {
	const { t } = useTranslation()
	useRequireRole(ADMIN_ROLES)

	const data = useQuery(api.appointments.listAllWithDetails)

	const columns: ColumnDef<AppointmentRow>[] = [
		{
			header: t("admin.appointments.colCustomer"),
			accessorFn: (row) => row.customerName,
			cell: ({ row }) => (
				<div className="flex items-center gap-2 min-w-0">
					<User size={13} className="text-(--text-subtle) shrink-0" />
					<span className="main-sm truncate">{row.original.customerName}</span>
				</div>
			),
		},
		{
			header: t("admin.appointments.colShop"),
			accessorFn: (row) => row.shopName,
			cell: ({ row }) => (
				<div className="flex items-center gap-2 min-w-0">
					<Store size={13} className="text-(--text-subtle) shrink-0" />
					<span className="muted-sm truncate">{row.original.shopName}</span>
				</div>
			),
		},
		{
			header: t("admin.appointments.colBarber"),
			accessorFn: (row) => row.barberName,
			cell: ({ row }) => (
				<div className="flex items-center gap-2 min-w-0">
					<Scissors size={13} className="text-(--text-subtle) shrink-0" />
					<span className="muted-sm truncate">{row.original.barberName}</span>
				</div>
			),
		},
		{
			header: t("admin.appointments.colDate"),
			accessorKey: "date",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Calendar size={13} className="text-(--text-subtle) shrink-0" />
					<span className="main-sm">{row.original.date}</span>
					<span className="subtle-xs">
						{row.original.startTime} – {row.original.endTime}
					</span>
				</div>
			),
		},
		{
			header: t("admin.appointments.colStatus"),
			accessorKey: "status",
			enableSorting: true,
			cell: ({ row }) => {
				const status = row.original.status
				if (!isAppointmentStatus(status)) return null
				return <span className={`badge ${STATUS_BADGE[status]} w-fit`}>{t(`status.${status}`)}</span>
			},
		},
		{
			header: t("admin.appointments.colPayment"),
			accessorKey: "paymentStatus",
			cell: ({ row }) => {
				const ps = row.original.paymentStatus
				return ps ? (
					<span className={`badge w-fit ${ps === "paid" ? "badge-green" : "badge-gold"}`}>
						{ps === "paid" ? t("booking.paid") : t("booking.unpaid")}
					</span>
				) : (
					<span className="subtle-xs">—</span>
				)
			},
		},
		{
			header: t("admin.appointments.colPrice"),
			accessorKey: "totalPrice",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="flex items-center gap-1">
					<Euro size={13} className="text-(--text-subtle)" />
					<span className="strong-sm">{formatPrice(row.original.totalPrice)}</span>
				</div>
			),
		},
	]

	return (
		<main className="page-main">
			<div className="page-wrap max-w-6xl">
				<div className="page-head">
					<div className="page-header">
						<Link to="/admin/overview" className="breadcrumb-back">
							← {t("nav.admin")}
						</Link>
						<span className="breadcrumb-sep">/</span>
						<h1>{t("admin.appointments.title")}</h1>
					</div>
				</div>

				{!data ? (
					<DataTable columns={columns} data={[]} loading loadingRows={6} />
				) : data.length === 0 ? (
					<div className="empty-state">
						<Calendar size={36} className="mx-auto mb-3 opacity-30" />
						<p className="text-sm">{t("admin.appointments.noAppointments")}</p>
					</div>
				) : (
					<DataTable
						columns={columns}
						data={data}
						searchable
						searchPlaceholder={t("admin.appointments.colCustomer")}
					/>
				)}
			</div>
		</main>
	)
}
