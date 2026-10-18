import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Calendar, CheckCircle, Clock, Heart, RefreshCw, Star, User, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { DashSkeleton } from "#/components/ui/DashSkeleton"
import { SkeletonRows } from "#/components/ui/Skeleton"
import { StatCard } from "#/components/ui/StatCard"
import { withToast } from "#/components/ui/Toast"
import { useFormatters } from "#/hooks/useFormatters"
import { CUSTOMER_ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"
import type { Appointment, Barbershop } from "#/types"
import { STATUS_DOT } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/overview")({ component: CustomerDashboard })

function CustomerDashboard() {
	const { t } = useTranslation()
	const { user } = useRequireRole(CUSTOMER_ADMIN_ROLES)

	const appointments = useQuery(api.appointments.listByCustomer, user ? {} : "skip")

	// Batch fetch all unique shops referenced by appointments (fixes N+1)
	const shopIds = useMemo(() => {
		if (!appointments) return [] as Id<"barbershops">[]
		return Array.from(new Set<Id<"barbershops">>(appointments.map((a) => a.barbershopId)))
	}, [appointments])
	const shopsRaw = useQuery(
		api.barbershops.listByIds,
		shopIds.length > 0 ? { ids: shopIds } : "skip",
	)
	const shopMap = useMemo(() => {
		const map = new Map<string, Barbershop>()
		if (shopsRaw) for (const s of shopsRaw) map.set(s._id, s)
		return map
	}, [shopsRaw])

	if (!user)
		return (
			<main className="page-main">
				<DashSkeleton className="page-wrap max-w-3xl py-8" />
			</main>
		)

	// Single pass over the appointments list (status-based buckets).
	const { upcoming, completed, cancelled, past } = (appointments ?? []).reduce(
		(
			acc: {
				upcoming: Doc<"appointments">[]
				completed: Doc<"appointments">[]
				cancelled: Doc<"appointments">[]
				past: Doc<"appointments">[]
			},
			appt: Doc<"appointments">,
		) => {
			if (appt.status === "pending" || appt.status === "confirmed") acc.upcoming.push(appt)
			if (appt.status === "completed") acc.completed.push(appt)
			if (appt.status === "cancelled") acc.cancelled.push(appt)
			if (appt.status === "completed" || appt.status === "cancelled") acc.past.push(appt)
			return acc
		},
		{ upcoming: [], completed: [], cancelled: [], past: [] },
	)

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl py-8">
				<div className="page-head">
					<div>
						<h1 className="page-title">{t("dashboard.title")}</h1>
						<p className="muted-sm">{t("dashboard.welcome", { name: user.name })}</p>
					</div>
					<div className="flex gap-2">
						<Link to="/dashboard/favorites" className="btn btn-secondary btn-sm">
							<Heart size={13} /> {t("dashboard.favorites")}
						</Link>
						<Link to="/dashboard/profile" className="btn btn-secondary btn-sm">
							<User size={13} /> {t("dashboard.profile")}
						</Link>
					</div>
				</div>

				<div className="grid grid-cols-4 gap-3 mb-6">
					{(
						[
							{ label: t("dashboard.stats.total"), value: appointments?.length ?? "—", icon: Calendar },
							{ label: t("dashboard.stats.upcoming"), value: upcoming.length, icon: Clock },
							{ label: t("dashboard.stats.completed"), value: completed.length, icon: CheckCircle },
							{
								label: t("dashboard.stats.cancelled"),
								value: cancelled.length,
								icon: XCircle,
							},
						] as const
					).map(({ label, value, icon }) => (
						<StatCard key={label} icon={icon} value={value} label={label} />
					))}
				</div>

				<section className="card p-5 mb-4">
					<h2 className="card-title">{t("dashboard.upcomingTitle")}</h2>
					{appointments === undefined ? (
						<SkeletonRows count={3} className="h-12" />
					) : upcoming.length === 0 ? (
						<div className="text-center py-6">
							<p className="muted-sm mb-3">{t("dashboard.noUpcoming")}</p>
							<Link to="/barbershops/listing" className="btn btn-primary btn-sm">
								{t("common.bookNow")}
							</Link>
						</div>
					) : (
						<div className="divide-y divide-(--border)">
							{upcoming.map((appt: Doc<"appointments">) => (
								<AppointmentRow
									key={appt._id}
									appt={appt}
									shop={shopMap.get(appt.barbershopId)}
									showActions
								/>
							))}
						</div>
					)}
				</section>

				{past.length > 0 && (
					<section className="card p-5">
						<h2 className="card-title">{t("dashboard.pastTitle")}</h2>
						<div className="divide-y divide-(--border)">
							{past.slice(0, 8).map((appt: Doc<"appointments">) => (
								<AppointmentRow key={appt._id} appt={appt} shop={shopMap.get(appt.barbershopId)} />
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
	shop,
	showActions,
}: {
	appt: Appointment
	shop?: Barbershop
	showActions?: boolean
}) {
	const { t } = useTranslation()
	const f = useFormatters()
	const updateStatus = useMutation(api.appointments.updateStatus)
	const hasReview = useQuery(api.reviews.hasReview, { appointmentId: appt._id })
	const createReview = useMutation(api.reviews.create)
	const [showForm, setShowForm] = useState(false)
	const [rating, setRating] = useState(5)
	const [comment, setComment] = useState("")
	const [submitting, setSubmitting] = useState(false)

	const handleCancel = () =>
		void withToast(
			() => updateStatus({ id: appt._id, status: "cancelled" }),
			t("status.cancelled"),
			t("errors.updateStatusFailed"),
		)

	const handleSubmitReview = async () => {
		if (comment.trim().length === 0) return
		setSubmitting(true)
		const { ok } = await withToast(
			() => createReview({ appointmentId: appt._id, rating, comment: comment.trim() }),
			t("dashboard.reviewAdded"),
			t("errors.reviewFailed"),
		)
		setSubmitting(false)
		if (ok) {
			setShowForm(false)
			setComment("")
			setRating(5)
		}
	}

	const statusColor = STATUS_DOT[appt.status]

	return (
		<div>
			<div className="flex items-center gap-3 py-3 group">
				<span className="text-xs font-mono text-(--text-muted) w-11 shrink-0">{appt.startTime}</span>
				<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
				<div className="flex-1 min-w-0">
					<span className="main-sm block truncate">{shop?.name ?? "…"}</span>
					<span className="subtle-xs">{f.formatDateShort(appt.date)}</span>
				</div>
				<span className="strong-sm tabular-nums">{f.formatPrice(appt.totalPrice)}</span>
				{showActions && (appt.status === "pending" || appt.status === "confirmed") && (
					<button
						type="button"
						onClick={() => void handleCancel()}
						className="text-xs text-(--error) opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
					>
						{t("common.cancel")}
					</button>
				)}
				{appt.status === "completed" && shop && (
					<Link
						to="/barbershops/$slug"
						params={{ slug: shop.slug }}
						className="text-xs text-(--gold) hover:underline opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity flex items-center gap-1"
					>
						<RefreshCw size={11} /> {t("dashboard.rebook")}
					</Link>
				)}
				{appt.status === "completed" && hasReview === false && (
					<button
						type="button"
						onClick={() => setShowForm(!showForm)}
						className="text-xs text-(--gold) hover:underline opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity flex items-center gap-1"
					>
						<Star size={11} /> {t("dashboard.leaveReview")}
					</button>
				)}
			</div>
			{showForm && (
				<div className="ml-14 mb-3 p-3 rounded-lg bg-(--bg-input) border border-(--border) space-y-2">
					<div className="flex items-center gap-1">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								onClick={() => setRating(star)}
								className="p-0.5 cursor-pointer"
								aria-label={`${star} / 5`}
								aria-pressed={star <= rating}
							>
								<Star
									size={16}
									className={star <= rating ? "text-(--gold) fill-(--gold)" : "text-(--border-hover)"}
								/>
							</button>
						))}
					</div>
					<textarea
						className="w-full rounded-lg border border-(--border) bg-(--bg-card) px-3 py-2 main-sm placeholder:text-(--text-subtle) focus:outline-none focus:ring-2 focus:ring-(--gold)/30 resize-none"
						rows={2}
						placeholder={t("dashboard.reviewPlaceholder")}
						aria-label={t("dashboard.reviewPlaceholder")}
						value={comment}
						onChange={(e) => setComment(e.target.value)}
					/>
					<div className="flex justify-end gap-2">
						<button type="button" onClick={() => setShowForm(false)} className="muted-xs px-3 py-1.5">
							{t("common.cancel")}
						</button>
						<button
							type="button"
							onClick={() => void handleSubmitReview()}
							disabled={submitting || comment.trim().length === 0}
							className="btn btn-primary btn-sm"
						>
							{t("common.save")}
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
