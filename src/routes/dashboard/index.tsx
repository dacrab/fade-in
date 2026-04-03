import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Calendar, CheckCircle, Clock, Heart, Scissors, User, XCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import SkeletonList from "#/components/SkeletonList"
import StatsGrid from "#/components/StatsGrid"
import { Skeleton } from "#/components/ui/Skeleton"
import { useRequireRole } from "#/hooks/useRequireRole"
import { formatDateShort, formatPrice } from "#/lib/format"
import { type Appointment, type Barbershop, STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/")({ component: CustomerDashboard })

function CustomerDashboard() {
	const { t } = useTranslation()
	const { user, loading } = useRequireRole(["customer", "admin"], "/login")

	const appointments = useQuery(
		api.appointments.listByCustomer,
		user ? { customerId: user.id as Id<"users"> } : "skip",
	)

	if (loading || !user) return <DashSkeleton />

	const upcoming =
		appointments?.filter(
			(a: Doc<"appointments">) => a.status === "pending" || a.status === "confirmed",
		) ?? []
	const past =
		appointments?.filter(
			(a: Doc<"appointments">) => a.status === "completed" || a.status === "cancelled",
		) ?? []

	return (
		<main className="page-main">
			<div className="page-wrap max-w-4xl">
				<div className="section-header">
					<div>
						<h1 className="text-2xl font-bold text-[var(--text)]">{t("dashboard.title")}</h1>
						<p className="text-[var(--text-muted)] text-sm">
							{t("dashboard.welcome", { name: user.name })}
						</p>
					</div>
					<div className="flex gap-2">
						<Link to="/dashboard/favorites" className="btn btn-secondary gap-2 text-sm">
							<Heart size={15} /> {t("dashboard.favorites")}
						</Link>
						<Link to="/dashboard/profile" className="btn btn-secondary gap-2 text-sm">
							<User size={15} /> {t("dashboard.profile")}
						</Link>
					</div>
				</div>

				{/* Stats */}
				<div className="mb-8">
					<StatsGrid
						cols={4}
						stats={[
							{
								label: t("dashboard.stats.total"),
								value: appointments?.length ?? "—",
								icon: Calendar,
							},
							{ label: t("dashboard.stats.upcoming"), value: upcoming.length, icon: Clock },
							{
								label: t("dashboard.stats.completed"),
								value:
									appointments?.filter((a: Doc<"appointments">) => a.status === "completed").length ?? "—",
								icon: CheckCircle,
							},
							{
								label: t("dashboard.stats.cancelled"),
								value:
									appointments?.filter((a: Doc<"appointments">) => a.status === "cancelled").length ?? "—",
								icon: XCircle,
							},
						]}
					/>
				</div>

				{/* Upcoming */}
				<div className="card p-5 mb-5">
					<h2 className="font-bold text-[var(--text)] mb-4">{t("dashboard.upcomingTitle")}</h2>
					{appointments === undefined ? (
						<SkeletonList count={3} height="h-16" />
					) : upcoming.length === 0 ? (
						<div className="empty-state">
							<Calendar size={32} className="mx-auto mb-2 opacity-30" />
							<p className="text-sm">{t("dashboard.noUpcoming")}</p>
							<Link to="/barbershops" className="btn btn-primary mt-3 inline-flex text-sm">
								{t("common.bookNow")}
							</Link>
						</div>
					) : (
						<div className="space-y-3">
							{upcoming.map((appt: Doc<"appointments">) => (
								<AppointmentRow key={appt._id} appt={appt as Appointment} />
							))}
						</div>
					)}
				</div>

				{/* Past */}
				{past.length > 0 && (
					<div className="card p-5">
						<h2 className="font-bold text-[var(--text)] mb-4">{t("dashboard.pastTitle")}</h2>
						<div className="space-y-3">
							{past.slice(0, 5).map((appt: Doc<"appointments">) => (
								<AppointmentRow key={appt._id} appt={appt as Appointment} />
							))}
						</div>
					</div>
				)}
			</div>
		</main>
	)
}

function AppointmentRow({ appt }: { appt: Appointment }) {
	const { t } = useTranslation()
	const shop = useQuery(api.barbershops.getById, { id: appt.barbershopId }) as
		| Barbershop
		| null
		| undefined
	return (
		<div
			className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
			style={{ background: "var(--bg-input)" }}
		>
			<div
				className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
				style={{ background: "rgba(245,158,11,0.1)" }}
			>
				<Scissors size={18} className="text-[var(--gold)]" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="font-medium text-[var(--text)] text-sm truncate">{shop?.name ?? "..."}</div>
				<div className="text-xs text-[var(--text-muted)]">
					{formatDateShort(appt.date)} {t("common.at")} {appt.startTime}
				</div>
			</div>
			<div className="text-sm font-bold text-[var(--gold)]">{formatPrice(appt.totalPrice)}</div>
			<span className={`badge ${STATUS_BADGE[appt.status]}`}>{appt.status}</span>
		</div>
	)
}

function DashSkeleton() {
	return (
		<main className="page-main">
			<div className="page-wrap max-w-4xl space-y-6">
				<Skeleton className="h-10 w-48" />
				<div className="grid grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-64 rounded-2xl" />
			</div>
		</main>
	)
}
