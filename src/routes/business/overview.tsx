import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { PlusCircle, Scissors } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { useBusinessAuth } from "#/hooks/useBusinessAuth"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { formatPrice } from "#/lib/format"
import type { Appointment, Barbershop, Review } from "#/types"
import { STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/business/overview")({ component: BusinessDashboard })

function BusinessDashboard() {
	const { t } = useTranslation()
	const { user } = useBusinessAuth()

	const shop = useOwnerShop(user?.id) as Barbershop | undefined

	const todayStr = new Date().toISOString().slice(0, 10)
	const todayAppts = useQuery(
		api.appointments.listByShop,
		shop ? { barbershopId: shop._id, date: todayStr } : "skip",
	) as Appointment[] | undefined
	// Use server-side stats instead of loading ALL appointments
	const stats = useQuery(api.appointments.getShopStats, shop ? { barbershopId: shop._id } : "skip")
	const reviewsResult = useQuery(
		api.reviews.listByShop,
		shop ? { barbershopId: shop._id, paginationOpts: { cursor: null, numItems: 50 } } : "skip",
	)
	const reviews = (reviewsResult?.page ?? undefined) as Review[] | undefined

	const completionRate =
		stats && stats.totalCount > 0 ? Math.round((stats.completedCount / stats.totalCount) * 100) : 0

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
							value: stats ? formatPrice(stats.totalRevenue) : "—",
						},
						{
							label: t("business.stats.monthRevenue"),
							value: stats ? formatPrice(stats.monthRevenue) : "—",
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
						{[0, 1, 2].map((i) => (
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
				{stats === undefined ? (
					<Skeleton className="h-24 w-full" />
				) : stats.totalCount === 0 ? (
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
										count: stats.completedCount,
										color: "text-emerald-400",
									},
									{
										label: t("business.revenue.pending"),
										count: stats.pendingCount,
										color: "text-(--gold)",
									},
									{
										label: t("business.revenue.cancelled"),
										count: stats.cancelledCount,
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
					{[0, 1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-16 rounded-lg" />
					))}
				</div>
				<Skeleton className="h-48 rounded-xl" />
			</div>
		</div>
	)
}
