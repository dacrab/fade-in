import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { PlusCircle, Scissors, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { useBusinessAuth } from "#/hooks/useBusinessAuth"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { formatPrice } from "#/lib/format"
import type { Appointment, Barbershop, Review } from "#/types"
import { STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/business/overview")({ component: BusinessDashboard })

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
	const reviewsResult = useQuery(
		api.reviews.listByShop,
		shop ? { barbershopId: shop._id, paginationOpts: { cursor: null, numItems: 50 } } : "skip",
	)
	const reviews = (reviewsResult?.page ?? undefined) as Review[] | undefined

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
			<div className="flex-1 flex items-center justify-center px-6 py-8">
				<div className="max-w-md w-full text-center space-y-4">
					<div className="w-12 h-12 rounded-full bg-(--gold)/10 flex items-center justify-center mx-auto">
						<Scissors size={20} className="text-(--gold)" />
					</div>
					<h1 className="text-xl font-medium text-(--text) tracking-tight">
						{t("business.setupTitle")}
					</h1>
					<p className="text-sm text-(--text-muted) leading-relaxed">{t("business.setupHint")}</p>
					<Link to="/business/profile" className="btn btn-primary">
						<PlusCircle size={15} /> {t("business.createShop")}
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="px-8 py-8">
			<div className="mb-5">
				<h1 className="text-lg font-medium text-(--text) tracking-tight">
					{t("business.overviewTitle")}
				</h1>
				<p className="text-sm text-(--text-muted) mt-1">
					{t("dashboard.welcome", { name: user.name })}
				</p>
			</div>

			{/* Stat cards - horizontal with left border accent */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
				{(
					[
						{
							label: t("business.stats.todayBookings"),
							value: todayAppts?.length ?? "—",
						},
						{
							label: t("business.stats.totalRevenue"),
							value: allAppts ? formatPrice(totalRevenue) : "—",
						},
						{
							label: t("business.stats.monthRevenue"),
							value: allAppts ? formatPrice(monthRevenue) : "—",
						},
						{
							label: t("business.stats.avgRating"),
							value: `${shop.rating.toFixed(1)} / 5`,
						},
					] as const
				).map(({ label, value }) => (
					<div key={label} className="border-l-2 border-(--gold)/40 pl-4 py-3">
						<div className="text-2xl font-semibold text-(--text) tracking-tight">{value}</div>
						<div className="text-xs text-(--text-muted) mt-1">{label}</div>
					</div>
				))}
			</div>

			{/* Today's appointments */}
			<div className="mb-5">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xs font-medium text-(--text-muted)">{t("business.todayTitle")}</h2>
					<Link
						to="/business/appointments"
						className="text-xs text-(--gold) hover:text-(--gold-dark) transition-colors"
					>
						{t("common.viewAll")} →
					</Link>
				</div>
				{todayAppts === undefined ? (
					<div className="space-y-2">
						{Array.from({ length: 3 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
							<Skeleton key={i} className="h-12 w-full rounded-lg" />
						))}
					</div>
				) : todayAppts.length === 0 ? (
					<p className="text-sm text-(--text-subtle) py-4">{t("business.noToday")}</p>
				) : (
					<div className="divide-y divide-white/4">
						{todayAppts.map((appt) => (
							<div key={appt._id} className="flex items-center gap-4 py-3">
								<span className="font-mono text-sm font-medium text-(--gold) w-12">{appt.startTime}</span>
								<div className="flex-1 min-w-0">
									<div className="text-sm text-(--text-muted) truncate">
										{appt.notes ?? t("business.defaultAppointmentNote")}
									</div>
									<div className="text-xs text-(--text-subtle)">
										{appt.endTime} · {formatPrice(appt.totalPrice)}
									</div>
								</div>
								<span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGE[appt.status]}`}>
									{appt.status}
								</span>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Revenue Analytics */}
			<div className="rounded-xl border border-(--border) bg-(--bg-card) p-6 mb-5">
				<h2 className="text-xs font-medium text-(--text-muted) mb-5">{t("business.revenue.title")}</h2>
				{allAppts === undefined ? (
					<Skeleton className="h-24 w-full" />
				) : allAppts.length === 0 ? (
					<p className="text-sm text-(--text-subtle)">{t("business.revenue.noData")}</p>
				) : (
					<div className="space-y-4">
						<div>
							<div className="flex justify-between text-xs text-(--text-muted) mb-2">
								<span>{t("business.stats.completionRate")}</span>
								<span className="font-medium text-(--text-muted)">{completionRate}%</span>
							</div>
							<div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
								<div
									className="h-full rounded-full bg-(--gold) transition-all"
									style={{ width: `${completionRate}%` }}
								/>
							</div>
						</div>
						<div className="grid grid-cols-3 gap-4 pt-2">
							{(
								[
									{
										label: t("business.revenue.completed"),
										count: completedAppts.length,
										color: "text-emerald-400",
									},
									{
										label: t("business.revenue.pending"),
										count: allAppts.filter((a) => a.status === "pending" || a.status === "confirmed").length,
										color: "text-(--gold)",
									},
									{
										label: t("business.revenue.cancelled"),
										count: allAppts.filter((a) => a.status === "cancelled").length,
										color: "text-red-400",
									},
								] as const
							).map(({ label, count, color }) => (
								<div key={label}>
									<div className={`text-xl font-semibold ${color}`}>{count}</div>
									<div className="text-xs text-(--text-subtle) mt-0.5">{label}</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* CRM: Customer list */}
			<div className="mb-5">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xs font-medium text-(--text-muted)">{t("business.crm.title")}</h2>
					{customerEntries.length > 0 && (
						<span className="text-xs text-(--text-subtle)">
							{t("business.crm.totalCustomers")}: {customerEntries.length}
						</span>
					)}
				</div>
				{allAppts === undefined ? (
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
							<Skeleton key={i} className="h-10 w-full rounded-lg" />
						))}
					</div>
				) : customerEntries.length === 0 ? (
					<p className="text-sm text-(--text-subtle) py-4">{t("business.crm.noCustomers")}</p>
				) : (
					<div className="divide-y divide-white/4">
						{customerEntries.slice(0, 10).map(([customerId, data]) => (
							<div key={customerId} className="flex items-center justify-between py-3 gap-4">
								<div className="w-7 h-7 rounded-full bg-(--gold)/10 flex items-center justify-center flex-shrink-0">
									<Users size={12} className="text-(--gold)" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="text-xs text-(--text-muted)">
										{t("business.crm.visits", { count: data.visits })}
									</div>
									<div className="text-xs text-(--text-subtle)">
										{t("business.crm.lastVisit", { date: data.lastDate })}
									</div>
								</div>
								<div className="text-sm font-medium text-(--gold) flex-shrink-0">
									{formatPrice(data.totalSpent)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Recent reviews */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xs font-medium text-(--text-muted)">{t("business.recentReviews")}</h2>
					<Link
						to="/business/reviews"
						className="text-xs text-(--gold) hover:text-(--gold-dark) transition-colors"
					>
						{t("common.viewAll")} →
					</Link>
				</div>
				{reviews === undefined ? (
					<Skeleton className="h-24 w-full" />
				) : reviews.length === 0 ? (
					<p className="text-sm text-(--text-subtle)">{t("business.noReviewsYet")}</p>
				) : (
					<div className="space-y-3">
						{reviews.slice(0, 3).map((r) => (
							<div key={r._id} className="border-b border-(--border) pb-3 last:border-0 last:pb-0">
								<div className="flex items-center gap-2 mb-1">
									<span className="text-sm font-medium text-(--gold)">{r.rating.toFixed(1)}</span>
									<span className="text-xs text-(--text-subtle)">/ 5</span>
								</div>
								<p className="text-sm text-(--text-muted) line-clamp-2">{r.comment}</p>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

function DashSkeleton() {
	return (
		<div className="px-8 py-8 flex items-center justify-center flex-1">
			<div className="w-full max-w-4xl px-8 space-y-4">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
						<Skeleton key={i} className="h-16 rounded-lg" />
					))}
				</div>
				<Skeleton className="h-48 rounded-xl" />
			</div>
		</div>
	)
}
