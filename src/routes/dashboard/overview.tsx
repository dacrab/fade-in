import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Calendar, CheckCircle, Clock, Heart, RefreshCw, User, XCircle } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { withToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import { formatDateShort, formatPrice } from "#/lib/format"
import type { Appointment, Barbershop } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/overview")({ component: CustomerDashboard })

function CustomerDashboard() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!user) return
		if (user.role !== "customer" && user.role !== "admin") navigate({ to: "/" })
	}, [user, navigate])

	const appointments = useQuery(
		api.appointments.listByCustomer,
		user ? { customerId: user.id as Id<"users"> } : "skip",
	)

	if (!user) return <DashSkeleton />

	const upcoming =
		appointments?.filter(
			(a: Doc<"appointments">) => a.status === "pending" || a.status === "confirmed",
		) ?? []
	const completed = appointments?.filter((a: Doc<"appointments">) => a.status === "completed") ?? []
	const past =
		appointments?.filter(
			(a: Doc<"appointments">) => a.status === "completed" || a.status === "cancelled",
		) ?? []

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl py-8">
				{/* Header row */}
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold text-(--text)">{t("dashboard.title")}</h1>
						<p className="text-sm text-(--text-muted)">{t("dashboard.welcome", { name: user.name })}</p>
					</div>
					<div className="flex gap-2">
						<Link to="/dashboard/favorites" className="btn btn-secondary text-xs gap-1.5">
							<Heart size={13} /> {t("dashboard.favorites")}
						</Link>
						<Link to="/dashboard/profile" className="btn btn-secondary text-xs gap-1.5">
							<User size={13} /> {t("dashboard.profile")}
						</Link>
					</div>
				</div>

				{/* Stats row */}
				<div className="grid grid-cols-4 gap-3 mb-6">
					{[
						{ label: t("dashboard.stats.total"), value: appointments?.length ?? "—", icon: Calendar },
						{ label: t("dashboard.stats.upcoming"), value: upcoming.length, icon: Clock },
						{ label: t("dashboard.stats.completed"), value: completed.length, icon: CheckCircle },
						{
							label: t("dashboard.stats.cancelled"),
							value: past.length - completed.length,
							icon: XCircle,
						},
					].map(({ label, value, icon: Icon }) => (
						<div key={label} className="card p-3 flex items-center gap-3">
							<Icon size={16} className="text-(--gold) shrink-0" />
							<div>
								<div className="text-lg font-bold text-(--text) tabular-nums">{value}</div>
								<div className="text-[11px] text-(--text-muted)">{label}</div>
							</div>
						</div>
					))}
				</div>

				{/* Upcoming */}
				<section className="card p-5 mb-4">
					<h2 className="text-sm font-semibold text-(--text) mb-3">{t("dashboard.upcomingTitle")}</h2>
					{appointments === undefined ? (
						<div className="space-y-2">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton
									// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
									key={i}
									className="h-12 w-full"
								/>
							))}
						</div>
					) : upcoming.length === 0 ? (
						<div className="text-center py-6">
							<p className="text-sm text-(--text-muted) mb-3">{t("dashboard.noUpcoming")}</p>
							<Link to="/barbershops/listing" className="btn btn-primary text-xs">
								{t("common.bookNow")}
							</Link>
						</div>
					) : (
						<div className="divide-y divide-(--border)">
							{upcoming.map((appt: Doc<"appointments">) => (
								<AppointmentRow key={appt._id} appt={appt as Appointment} showActions />
							))}
						</div>
					)}
				</section>

				{/* Past appointments */}
				{past.length > 0 && (
					<section className="card p-5">
						<h2 className="text-sm font-semibold text-(--text) mb-3">{t("dashboard.pastTitle")}</h2>
						<div className="divide-y divide-(--border)">
							{past.slice(0, 8).map((appt: Doc<"appointments">) => (
								<AppointmentRow
									key={appt._id}
									appt={appt as Appointment}
									showRebook={appt.status === "completed"}
								/>
							))}
						</div>
					</section>
				)}
			</div>
		</main>
	)
}

function AppointmentRow({
	appt,
	showActions,
	showRebook,
}: {
	appt: Appointment
	showActions?: boolean
	showRebook?: boolean
}) {
	const { t } = useTranslation()
	const shop = useQuery(api.barbershops.getById, { id: appt.barbershopId }) as
		| Barbershop
		| null
		| undefined
	const updateStatus = useMutation(api.appointments.updateStatus)

	const handleCancel = () =>
		withToast(
			() => updateStatus({ id: appt._id, status: "cancelled" }),
			t("status.cancelled"),
			t("errors.updateStatusFailed"),
		)

	const statusColor =
		appt.status === "confirmed" || appt.status === "completed"
			? "bg-green-500"
			: appt.status === "cancelled"
				? "bg-red-400"
				: "bg-amber-400"

	return (
		<div className="flex items-center gap-3 py-3 group">
			<span className="text-xs font-mono text-(--text-muted) w-11 shrink-0">{appt.startTime}</span>
			<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
			<div className="flex-1 min-w-0">
				<span className="text-sm text-(--text) block truncate">{shop?.name ?? "…"}</span>
				<span className="text-xs text-(--text-subtle)">{formatDateShort(appt.date)}</span>
			</div>
			<span className="text-sm font-medium text-(--text) tabular-nums">
				{formatPrice(appt.totalPrice)}
			</span>
			{showActions && (appt.status === "pending" || appt.status === "confirmed") && (
				<button
					type="button"
					onClick={() => void handleCancel()}
					className="text-xs text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
				>
					{t("common.cancel")}
				</button>
			)}
			{showRebook && shop && (
				<Link
					to="/barbershops/$slug"
					params={{ slug: shop.slug }}
					className="text-xs text-(--gold) hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
				>
					<RefreshCw size={11} /> Rebook
				</Link>
			)}
		</div>
	)
}

function DashSkeleton() {
	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl py-8 space-y-4">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-4 gap-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
							key={i}
							className="h-16 rounded-xl"
						/>
					))}
				</div>
				<Skeleton className="h-48 rounded-xl" />
			</div>
		</main>
	)
}
