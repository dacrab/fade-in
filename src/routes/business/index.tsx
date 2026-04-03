import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
	BarChart3,
	Calendar,
	Check,
	Clock,
	MessageSquare,
	PlusCircle,
	Scissors,
	Settings,
	Star,
	Users,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import EmptyState from "#/components/EmptyState"
import SkeletonList from "#/components/SkeletonList"
import { Skeleton } from "#/components/ui/Skeleton"
import { StarRating } from "#/components/ui/StarRating"
import { useRequireRole } from "#/hooks/useRequireRole"
import { formatPrice } from "#/lib/format"
import type { Appointment, Barbershop, Review } from "#/types"
import { STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/")({ component: BusinessDashboard })

// Nav links use translation inside component; define icons only
const NAV_LINK_DEFS = [
	{ to: "/business", key: "overview", icon: BarChart3 },
	{ to: "/business/appointments", key: "appointments", icon: Calendar },
	{ to: "/business/services", key: "services", icon: Scissors },
	{ to: "/business/barbers", key: "barbers", icon: Users },
	{ to: "/business/reviews", key: "reviews", icon: MessageSquare },
	{ to: "/business/profile", key: "profile", icon: Settings },
] as const

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: business dashboard has multiple data sources
function BusinessDashboard() {
	const { t } = useTranslation()
	const { user, loading } = useRequireRole(["owner", "admin"], "/login")

	const shopsRaw = useQuery(
		api.barbershops.listByOwner,
		user ? { ownerId: user.id as Id<"users"> } : "skip",
	)
	const shop = shopsRaw?.[0] as Barbershop | undefined

	const todayStr = new Date().toISOString().split("T")[0]
	const todayApptsRaw = useQuery(
		api.appointments.listByShop,
		shop ? { barbershopId: shop._id, date: todayStr } : "skip",
	)
	const allApptsRaw = useQuery(
		api.appointments.listByShop,
		shop ? { barbershopId: shop._id } : "skip",
	)
	const reviewsRaw = useQuery(api.reviews.listByShop, shop ? { barbershopId: shop._id } : "skip")

	const todayAppts = todayApptsRaw as Appointment[] | undefined
	const allAppts = allApptsRaw as Appointment[] | undefined
	const reviews = reviewsRaw as Review[] | undefined

	if (loading || !user) return <DashSkeleton />

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
									label: t("business.stats.totalBookings"),
									value: allAppts?.length ?? "—",
									icon: BarChart3,
								},
								{ label: t("business.stats.totalReviews"), value: reviews?.length ?? "—", icon: Star },
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
							<SkeletonList count={3} height="h-14" />
						) : todayAppts.length === 0 ? (
							<EmptyState icon={Clock} message={t("business.noToday")} />
						) : (
							<div className="space-y-2">
								{todayAppts.map((appt) => (
									<div
										key={appt._id}
										className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]"
										style={{ background: "var(--bg-input)" }}
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
