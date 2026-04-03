import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { Calendar, Users, Star, Scissors, PlusCircle, Settings, BarChart3, MessageSquare, Clock, Check } from "lucide-react"
import { Skeleton } from "../../components/ui/Skeleton"
import { formatPrice } from "../../lib/format"
import { StarRating } from "../../components/ui/StarRating"
import type { Barbershop, Appointment, Review } from "../../types"
import { STATUS_BADGE } from "../../types"
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

function BusinessDashboard() {
	const { t } = useTranslation()
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading && !user) { void router.navigate({ to: "/login" }); return }
		if (!loading && user && user.role !== "owner" && user.role !== "admin")
			void router.navigate({ to: "/" })
	}, [user, loading, router])

	const shopsRaw = useQuery(api.barbershops.listByOwner, user ? { ownerId: user.id as Id<"users"> } : "skip")
	const shop = shopsRaw?.[0] as Barbershop | undefined

	const todayStr = new Date().toISOString().split("T")[0]
	const todayApptsRaw = useQuery(api.appointments.listByShop, shop ? { barbershopId: shop._id, date: todayStr } : "skip")
	const allApptsRaw = useQuery(api.appointments.listByShop, shop ? { barbershopId: shop._id } : "skip")
	const reviewsRaw = useQuery(api.reviews.listByShop, shop ? { barbershopId: shop._id } : "skip")

	const todayAppts = todayApptsRaw as Appointment[] | undefined
	const allAppts = allApptsRaw as Appointment[] | undefined
	const reviews = reviewsRaw as Review[] | undefined

	if (loading || !user) return <DashSkeleton />

	if (!shop) {
		return (
			<main className="px-4 py-8">
				<div className="page-wrap max-w-2xl text-center">
					<div className="card p-10">
						<Scissors size={48} className="mx-auto mb-4 text-[var(--gold)]" />
						<h1 className="text-2xl font-bold text-[var(--text)] mb-2">Set up your barbershop</h1>
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
				<aside className="border-r border-[var(--border)] px-4 py-6 hidden md:block" style={{ background: "var(--bg-card)" }}>
					<div className="mb-6">
						<h2 className="font-bold text-[var(--text)] truncate">{shop.name}</h2>
						<p className="text-xs text-[var(--text-muted)]">{shop.city}</p>
						{shop.isVerified && <span className="badge badge-gold mt-1 text-[10px]"><Check size={9} /> {t("common.verified")}</span>}
					</div>
					<nav className="space-y-1">
						{NAV_LINK_DEFS.map(({ to, key, icon: Icon }) => (
							<Link key={to} to={to} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)]" activeProps={{ style: { color: "var(--gold)", background: "rgba(245,158,11,0.08)" } }}>
								<Icon size={16} />{t(`business.nav.${key}`)}
							</Link>
						))}
					</nav>
				</aside>

				<div className="px-6 py-6 overflow-auto">
					<div className="mb-6">
						<h1 className="text-2xl font-bold text-[var(--text)]">{t("business.overviewTitle")}</h1>
						<p className="text-sm text-[var(--text-muted)]">{t("dashboard.welcome", { name: user.name })}</p>
					</div>

					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						{(
							[
								{ label: t("business.stats.todayBookings"), value: todayAppts?.length ?? "—", icon: Calendar },
								{ label: t("business.stats.totalBookings"), value: allAppts?.length ?? "—", icon: BarChart3 },
								{ label: t("business.stats.totalReviews"), value: reviews?.length ?? "—", icon: Star },
								{ label: t("business.stats.avgRating"), value: `${shop.rating.toFixed(1)} / 5`, icon: Star },
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
						<div className="flex items-center justify-between mb-4">
							<h2 className="font-bold text-[var(--text)]">{t("business.todayTitle")}</h2>
							<Link to="/business/appointments" className="text-xs text-[var(--gold)] no-underline hover:underline">{t("common.viewAll")} →</Link>
						</div>
						{todayAppts === undefined ? (
							<div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
						) : todayAppts.length === 0 ? (
							<div className="text-center py-6 text-[var(--text-muted)]">
								<Clock size={28} className="mx-auto mb-2 opacity-30" />
								<p className="text-sm">{t("business.noToday")}</p>
							</div>
						) : (
							<div className="space-y-2">
								{todayAppts.map((appt) => (
									<div key={appt._id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]" style={{ background: "var(--bg-input)" }}>
										<div className="text-sm font-bold text-[var(--gold)] w-14">{appt.startTime}</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium text-[var(--text)] truncate">{appt.notes ?? "Appointment"}</div>
											<div className="text-xs text-[var(--text-muted)]">{appt.endTime} · {formatPrice(appt.totalPrice)}</div>
										</div>
										<span className={`badge text-xs ${STATUS_BADGE[appt.status]}`}>{appt.status}</span>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Recent reviews */}
					<div className="card p-5">
						<div className="flex items-center justify-between mb-4">
							<h2 className="font-bold text-[var(--text)]">{t("business.recentReviews")}</h2>
							<Link to="/business/reviews" className="text-xs text-[var(--gold)] no-underline hover:underline">{t("common.viewAll")} →</Link>
						</div>
						{reviews === undefined ? (
							<Skeleton className="h-24 w-full" />
						) : reviews.length === 0 ? (
							<p className="text-sm text-[var(--text-muted)]">No reviews yet.</p>
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
		<main className="px-4 py-8">
			<div className="page-wrap space-y-6">
				<Skeleton className="h-10 w-48" />
				<div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
				<Skeleton className="h-64 rounded-2xl" />
			</div>
		</main>
	)
}
