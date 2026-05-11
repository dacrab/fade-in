import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
	BarChart3,
	Calendar,
	Check,
	Clock,
	DollarSign,
	MessageSquare,
	PlusCircle,
	Scissors,
	Settings,
	Star,
	TrendingUp,
	Users,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { StarRating } from "#/components/ui/StarRating"
import { useBusinessAuth } from "#/hooks/useBusinessAuth"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { formatPrice } from "#/lib/format"
import type { Appointment, Barbershop, Review } from "#/types"
import { STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/business/overview")({ component: BusinessDashboard })

// Navigation links - icons defined here, labels from i18n
const NAV_LINK_DEFS = [
	{ to: "/business/overview", key: "overview", icon: BarChart3 },
	{ to: "/business/appointments", key: "appointments", icon: Calendar },
	{ to: "/business/services", key: "services", icon: Scissors },
	{ to: "/business/barbers", key: "barbers", icon: Users },
	{ to: "/business/reviews", key: "reviews", icon: MessageSquare },
	{ to: "/business/profile", key: "profile", icon: Settings },
] as const

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: business dashboard has multiple data sources
function BusinessDashboard() {
	const { t } = useTranslation()
	const { user } = useBusinessAuth()

	const shop = useOwnerShop(user?.id) as Barbershop | undefined

	const todayStr = new Date().toISOString().slice(0, 10)
	const thisMonthStr = new Date().toISOString().slice(0, 7) // YYYY-MM
	const todayAppts = useQuery(
		api.appointments.listByShop,
		shop ? { barbershopId: shop._id, date: todayStr } : "skip",
	) as Appointment[] | undefined
	const allAppts = useQuery(
		api.appointments.listByShop,
		shop ? { barbershopId: shop._id } : "skip",
	) as Appointment[] | undefined
	const reviews = useQuery(api.reviews.listByShop, shop ? { barbershopId: shop._id } : "skip") as
		| Review[]
		| undefined

	const completedAppts = allAppts?.filter((a) => a.status === "completed") ?? []
	const totalRevenue = completedAppts.reduce((sum, a) => sum + a.totalPrice, 0)
	const monthRevenue = completedAppts
		.filter((a) => a.date.startsWith(thisMonthStr))
		.reduce((sum, a) => sum + a.totalPrice, 0)
	const completionRate =
		allAppts && allAppts.length > 0 ? Math.round((completedAppts.length / allAppts.length) * 100) : 0

	// Deduplicate customers from appointments
	const customerMap = new Map<string, { visits: number; totalSpent: number; lastDate: string }>()
	for (const appt of allAppts ?? []) {
		const id = appt.customerId as string
		const existing = customerMap.get(id)
		if (existing) {
			existing.visits += 1
			existing.totalSpent += appt.totalPrice
			if (appt.date > existing.lastDate) existing.lastDate = appt.date
		} else {
			customerMap.set(id, { visits: 1, totalSpent: appt.totalPrice, lastDate: appt.date })
		}
	}
	const customerEntries = [...customerMap.entries()].sort((a, b) =>
		b[1].lastDate > a[1].lastDate ? 1 : -1,
	)

	if (!user) return <DashSkeleton />

	if (!shop) {
		return (
			<main className="page-main">
				<div className="page-wrap max-w-2xl text-center">
					<div className="card p-10">
						<Scissors size={48} className="mx-auto mb-4 text-[var(--gold)]" />
						<h1 className="text-2xl font-bold text-[var(--text)] mb-2">{t("business.setupTitle")}</h1>
						<p className="text-[var(--text-muted)] mb-6">{t("business.setupHint")}</p>
						<Link to="/business/profile" className="btn btn-primary inline-flex gap-2">
							<PlusCircle size={16} /> {t("business.createShop")}
						</Link>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main>
			<div className="dashboard-layout">
				<aside className="bg-card border-r border-[var(--border)] px-4 py-6 hidden md:block">
					<div className="mb-6">
						<h2 className="font-bold text-[var(--text)] truncate">{shop.name}</h2>
						<p className="text-xs text-[var(--text-muted)]">{shop.city}</p>
						{shop.isVerified && (
							<span className="badge badge-gold mt-1 text-[10px]">
								<Check size={9} /> {t("common.verified")}
							</span>
						)}
					</div>
					<nav className="space-y-1">
						{NAV_LINK_DEFS.map(({ to, key, icon: Icon }) => (
							<Link
								key={to}
								to={to}
								className="sidebar-link"
								activeProps={{ className: "sidebar-link active" }}
							>
								<Icon size={16} />
								{t(`business.nav.${key}`)}
							</Link>
						))}
					</nav>
				</aside>

				<div className="px-6 py-6 overflow-auto">
					<div className="mb-6">
						<h1 className="text-2xl font-bold text-[var(--text)]">{t("business.overviewTitle")}</h1>
						<p className="text-sm text-[var(--text-muted)]">
							{t("dashboard.welcome", { name: user.name })}
						</p>
					</div>

					<div className="stat-grid stat-grid-4">
						{(
							[
								{
									label: t("business.stats.todayBookings"),
									value: todayAppts?.length ?? "—",
									icon: Calendar,
								},
								{
									label: t("business.stats.totalRevenue"),
									value: allAppts ? formatPrice(totalRevenue) : "—",
									icon: DollarSign,
								},
								{
									label: t("business.stats.monthRevenue"),
									value: allAppts ? formatPrice(monthRevenue) : "—",
									icon: TrendingUp,
								},
								{
									label: t("business.stats.avgRating"),
									value: `${shop.rating.toFixed(1)} / 5`,
									icon: Star,
								},
							] as const
						).map(({ label, value, icon: Icon }) => (
							<div key={label} className="card p-4">
								<Icon size={18} className="text-[var(--gold)] mb-2" />
								<div className="text-2xl font-bold text-[var(--text)]">{value}</div>
								<div className="text-xs text-[var(--text-muted)]">{label}</div>
							</div>
						))}
					</div>

					{/* Today's appointments */}
					<div className="card p-5 mb-5">
						<div className="section-header">
							<h2 className="font-bold text-[var(--text)]">{t("business.todayTitle")}</h2>
							<Link to="/business/appointments" className="section-link">
								{t("common.viewAll")} →
							</Link>
						</div>
						{todayAppts === undefined ? (
							<div className="space-y-2">
								{Array.from({ length: 3 }).map((_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
									<Skeleton key={i} className="h-14 w-full rounded-xl" />
								))}
							</div>
						) : todayAppts.length === 0 ? (
							<div className="empty-state">
								<Clock size={32} className="mx-auto mb-2 opacity-30" />
								<p className="text-sm">{t("business.noToday")}</p>
							</div>
						) : (
							<div className="space-y-2">
								{todayAppts.map((appt) => (
									<div
										key={appt._id}
										className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-input)]"
									>
										<div className="text-sm font-bold text-[var(--gold)] w-14">{appt.startTime}</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium text-[var(--text)] truncate">
												{appt.notes ?? t("business.defaultAppointmentNote")}
											</div>
											<div className="text-xs text-[var(--text-muted)]">
												{appt.endTime} · {formatPrice(appt.totalPrice)}
											</div>
										</div>
										<span className={`badge text-xs ${STATUS_BADGE[appt.status]}`}>{appt.status}</span>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Revenue Analytics */}
					<div className="card p-5 mb-5">
						<h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
							<TrendingUp size={16} className="text-[var(--gold)]" />
							{t("business.revenue.title")}
						</h2>
						{allAppts === undefined ? (
							<Skeleton className="h-24 w-full" />
						) : allAppts.length === 0 ? (
							<p className="text-sm text-[var(--text-muted)]">{t("business.revenue.noData")}</p>
						) : (
							<div className="space-y-3">
								<div>
									<div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
										<span>{t("business.stats.completionRate")}</span>
										<span className="font-bold text-[var(--text)]">{completionRate}%</span>
									</div>
									<div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
										<div
											className="h-full rounded-full bg-[var(--gold)] transition-all"
											style={{ width: `${completionRate}%` }}
										/>
									</div>
								</div>
								<div className="grid grid-cols-3 gap-3 pt-1">
									{(
										[
											{
												label: t("business.revenue.completed"),
												count: completedAppts.length,
												color: "text-green-400",
											},
											{
												label: t("business.revenue.pending"),
												count: allAppts.filter((a) => a.status === "pending" || a.status === "confirmed")
													.length,
												color: "text-[var(--gold)]",
											},
											{
												label: t("business.revenue.cancelled"),
												count: allAppts.filter((a) => a.status === "cancelled").length,
												color: "text-red-400",
											},
										] as const
									).map(({ label, count, color }) => (
										<div key={label} className="text-center p-2 rounded-xl bg-[var(--bg-input)]">
											<div className={`text-lg font-bold ${color}`}>{count}</div>
											<div className="text-xs text-[var(--text-muted)]">{label}</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* CRM: Customer list */}
					<div className="card p-5 mb-5">
						<h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
							<Users size={16} className="text-[var(--gold)]" />
							{t("business.crm.title")}
							{customerEntries.length > 0 && (
								<span className="ml-auto text-xs font-normal text-[var(--text-muted)]">
									{t("business.crm.totalCustomers")}: {customerEntries.length}
								</span>
							)}
						</h2>
						{allAppts === undefined ? (
							<div className="space-y-3">
								{Array.from({ length: 3 }).map((_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
									<Skeleton key={i} className="h-12 w-full rounded-xl" />
								))}
							</div>
						) : customerEntries.length === 0 ? (
							<div className="empty-state">
								<Users size={32} className="mx-auto mb-2 opacity-30" />
								<p className="text-sm">{t("business.crm.noCustomers")}</p>
							</div>
						) : (
							<div className="divide-y divide-[var(--border)]">
								{customerEntries.slice(0, 10).map(([customerId, data]) => (
									<div key={customerId} className="flex items-center justify-between py-3 gap-4">
										<div className="w-8 h-8 rounded-full bg-[rgba(245,158,11,0.1)] flex items-center justify-center flex-shrink-0">
											<Users size={14} className="text-[var(--gold)]" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-xs text-[var(--text-muted)]">
												{t("business.crm.visits", { count: data.visits })}
											</div>
											<div className="text-xs text-[var(--text-subtle)]">
												{t("business.crm.lastVisit", { date: data.lastDate })}
											</div>
										</div>
										<div className="text-sm font-bold text-[var(--gold)] flex-shrink-0">
											{formatPrice(data.totalSpent)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Recent reviews */}
					<div className="card p-5">
						<div className="section-header">
							<h2 className="font-bold text-[var(--text)]">{t("business.recentReviews")}</h2>
							<Link to="/business/reviews" className="section-link">
								{t("common.viewAll")} →
							</Link>
						</div>
						{reviews === undefined ? (
							<Skeleton className="h-24 w-full" />
						) : reviews.length === 0 ? (
							<p className="text-sm text-[var(--text-muted)]">{t("business.noReviewsYet")}</p>
						) : (
							<div className="space-y-3">
								{reviews.slice(0, 3).map((r) => (
									<div key={r._id} className="border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
										<StarRating rating={r.rating} size={14} />
										<p className="text-sm text-[var(--text-muted)] line-clamp-2">{r.comment}</p>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	)
}

function DashSkeleton() {
	return (
		<main className="page-main">
			<div className="page-wrap space-y-6">
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
