import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	CheckCircle,
	Clock,
	CreditCard,
	MapPin,
	Phone,
	RefreshCw,
	User,
	XCircle,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Skeleton } from "#/components/ui/Skeleton"
import { withToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import { useFormatters } from "#/hooks/useFormatters"
import { nextDayIso } from "#/lib/format"
import { isOwnerOrAdmin, parseId, STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"

const searchSchema = z.object({
	payment: z.enum(["success", "canceled"]).optional(),
})

export const Route = createFileRoute("/booking/$id")({
	validateSearch: searchSchema,
	component: BookingPage,
})

const STATUS_ICON = {
	pending: Clock,
	confirmed: CheckCircle,
	completed: CheckCircle,
	cancelled: XCircle,
} as const

interface RescheduleValues {
	date: string
	startTime: string
	endTime: string
}

const EMPTY_RESCHEDULE: RescheduleValues = { date: "", startTime: "", endTime: "" }

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: large linear JSX view component
function BookingPage() {
	const { t } = useTranslation()
	const f = useFormatters()
	const { id } = Route.useParams()
	const parsedId = parseId<"appointments">(id)
	const { user } = useAuth()
	const { payment } = Route.useSearch()

	// Invalid IDs (e.g. /booking/garbage) skip the query and render not-found
	// instead of leaving the Convex client erroring forever behind a spinner.
	const appointment = useQuery(api.appointments.getById, parsedId ? { id: parsedId } : "skip")
	const shop = useQuery(
		api.barbershops.getById,
		appointment ? { id: appointment.barbershopId } : "skip",
	)
	const services = useQuery(
		api.services.listByShop,
		appointment ? { barbershopId: appointment.barbershopId } : "skip",
	)
	const barber = useQuery(api.barbers.getById, appointment ? { id: appointment.barberId } : "skip")

	const updateStatus = useMutation(api.appointments.updateStatus)
	const reschedule = useMutation(api.appointments.reschedule)

	const [showReschedule, setShowReschedule] = useState(false)
	const [rescheduleValues, setRescheduleValues] = useState<RescheduleValues>(EMPTY_RESCHEDULE)
	const [rescheduling, setRescheduling] = useState(false)
	const minDate = nextDayIso()

	const handleReschedule = async () => {
		if (!parsedId) return
		setRescheduling(true)
		const result = await withToast(
			() =>
				reschedule({
					id: parsedId,
					date: rescheduleValues.date,
					startTime: rescheduleValues.startTime,
					endTime: rescheduleValues.endTime,
				}),
			t("booking.rescheduled"),
			t("errors.rescheduleFailed"),
		)
		setRescheduling(false)
		// Only clear the form on success so users can retry after a conflict.
		if (result.ok) {
			setShowReschedule(false)
			setRescheduleValues(EMPTY_RESCHEDULE)
		}
	}

	const setRescheduleField = (field: keyof RescheduleValues) => (value: string) =>
		setRescheduleValues((prev) => ({ ...prev, [field]: value }))

	const handleCancel = () => {
		if (!parsedId) return
		void withToast(
			() => updateStatus({ id: parsedId, status: "cancelled" }),
			t("status.cancelled"),
			t("errors.updateStatusFailed"),
		)
	}

	const isLoading = parsedId !== null && appointment === undefined
	const appt = appointment ?? null

	const selectedServices =
		appt && services ? services.filter((s: Doc<"services">) => appt.serviceIds.includes(s._id)) : []

	const StatusIcon = appt ? STATUS_ICON[appt.status] : Clock

	const isCustomer = appt?.customerId === user?.id
	const isShopOwner = isOwnerOrAdmin(user) && shop?.ownerId === user?.id
	const canReschedule = isCustomer || isShopOwner

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl px-5 py-10 md:px-8 md:py-14">
				<Link
					to={isOwnerOrAdmin(user) ? "/business/appointments" : "/dashboard/overview"}
					className="inline-flex items-center gap-1.5 text-[12px] font-medium text-(--text-muted) transition-colors hover:text-(--gold)"
				>
					<ArrowLeft size={14} />
					{t("common.back")}
				</Link>

				{isLoading ? (
					<BookingSkeleton />
				) : !appt ? (
					<div className="mt-10 flex flex-col items-center justify-center rounded-(--radius-lg) border border-(--border) bg-(--bg-card) px-6 py-16 text-center">
						<span className="font-serif text-6xl font-medium italic leading-none text-(--gold)/30">
							404
						</span>
						<h1 className="display mt-5 text-[2.1rem] text-(--text)">{t("booking.notFound")}</h1>
						<p className="mt-2 max-w-xs text-sm text-(--text-muted)">{t("booking.notFoundMessage")}</p>
						<Link to="/" className="btn btn-primary mt-7">
							{t("errors.backHome")}
						</Link>
					</div>
				) : (
					<>
						{payment === "success" && (
							<div className="mt-6 flex items-start gap-3 rounded-(--radius) border border-(--success)/20 bg-(--success)/5 p-4">
								<CheckCircle size={18} className="mt-0.5 shrink-0 text-(--success)" />
								<p className="main-sm font-medium">{t("booking.paymentSuccess")}</p>
							</div>
						)}
						{payment === "canceled" && (
							<div className="mt-6 flex items-start gap-3 rounded-(--radius) border border-(--gold)/20 bg-(--gold)/5 p-4">
								<AlertCircle size={18} className="mt-0.5 shrink-0 text-(--gold)" />
								<p className="main-sm font-medium">{t("booking.paymentCanceled")}</p>
							</div>
						)}

						<div className="mt-7 border-b border-(--border) pb-7">
							<p className="eyebrow">{t("booking.yourAppointment")}</p>
							<div className="mt-4 flex flex-wrap items-end justify-between gap-5">
								<div className="min-w-0">
									<h1 className="display text-[clamp(2.15rem,5vw,3.4rem)] text-(--text)">
										{shop?.name ?? "—"}
									</h1>
									{shop && (
										<p className="mt-2 flex items-center gap-1.5 text-[13px] text-(--text-muted)">
											<MapPin size={13} className="shrink-0 text-(--text-subtle)" />
											{shop.address}, {shop.city}
										</p>
									)}
								</div>
								<div className="flex flex-wrap items-center gap-2 pb-1">
									<span className={`badge ${STATUS_BADGE[appt.status]}`}>
										<StatusIcon size={10} />
										{t(`status.${appt.status}`)}
									</span>
									{appt.paymentStatus && (
										<span className={`badge ${appt.paymentStatus === "paid" ? "badge-green" : "badge-gold"}`}>
											<CreditCard size={10} />
											{appt.paymentStatus === "paid" ? t("booking.paid") : t("booking.unpaid")}
										</span>
									)}
								</div>
							</div>
						</div>

						<div className="mt-8 overflow-hidden rounded-(--radius-lg) border border-(--border) bg-(--bg-card)">
							<div className="grid gap-6 border-b border-(--border) p-6 md:grid-cols-2 md:p-8">
								<div>
									<p className="detail-label">{t("booking.summaryFields.date")}</p>
									<p className="mt-1.5 font-serif text-[1.6rem] font-medium leading-tight tracking-[-0.02em] text-(--text)">
										{f.formatDate(appt.date)}
									</p>
									<p className="mt-2 flex items-center gap-1.5 text-[13px] tabular-nums text-(--text-muted)">
										<Clock size={13} className="text-(--text-subtle)" />
										{appt.startTime} – {appt.endTime}
									</p>
								</div>
								<div>
									<p className="detail-label">{t("booking.summaryFields.total")}</p>
									<p className="mt-1.5 font-serif text-[1.6rem] font-medium leading-tight tracking-[-0.02em] text-(--gold)">
										{f.formatPrice(appt.totalPrice)}
									</p>
									<p className="mt-2 flex items-center gap-1.5 text-[13px] text-(--text-muted)">
										<User size={13} className="text-(--text-subtle)" />
										{barber?.name ?? "—"}
									</p>
								</div>
							</div>

							<div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
								{selectedServices.length > 0 && (
									<div>
										<p className="detail-label">{t("booking.summaryFields.services")}</p>
										<div className="mt-2 flex flex-wrap gap-1.5">
											{selectedServices.map((s: Doc<"services">) => (
												<span
													key={s._id}
													className="rounded-(--radius-sm) border border-(--gold)/15 bg-(--gold)/7 px-2 py-1 text-[11.5px] font-medium text-(--gold)"
												>
													{s.name}
												</span>
											))}
										</div>
									</div>
								)}

								{shop?.phone && (
									<div>
										<p className="detail-label">{t("form.phoneLabel")}</p>
										<a
											href={`tel:${shop.phone}`}
											className="mt-1.5 flex items-center gap-1.5 text-sm text-(--text) transition-colors hover:text-(--gold)"
										>
											<Phone size={13} className="text-(--text-subtle)" />
											{shop.phone}
										</a>
									</div>
								)}

								{appt.notes && (
									<div className="md:col-span-2">
										<p className="detail-label">{t("booking.notes")}</p>
										<p className="mt-1.5 rounded-(--radius) bg-(--bg-input) px-3.5 py-2.5 text-[13px] leading-relaxed text-(--text-muted)">
											{appt.notes}
										</p>
									</div>
								)}
							</div>

							{(appt.status === "pending" || appt.status === "confirmed") && (
								<div className="flex flex-wrap items-center gap-3 border-t border-(--border) bg-(--bg-input)/30 px-6 py-4 md:px-8">
									{canReschedule && (
										<button
											type="button"
											onClick={() => setShowReschedule(!showReschedule)}
											className="btn btn-secondary btn-sm"
										>
											<RefreshCw size={13} />
											{t("booking.reschedule")}
										</button>
									)}
									{isCustomer && (
										<button
											type="button"
											onClick={() => void handleCancel()}
											className="btn btn-ghost btn-sm text-(--error) hover:bg-(--error)/5"
										>
											{t("business.appointments.cancel")}
										</button>
									)}
									<span className="ml-auto hidden items-center gap-1.5 text-[11px] text-(--text-subtle) sm:flex">
										<Calendar size={12} />
										{t("booking.detailHint")}
									</span>
								</div>
							)}
						</div>

						{showReschedule && (
							<div className="mt-5 rounded-(--radius-lg) border border-(--border) bg-(--bg-card) p-6 fade-in">
								<p className="eyebrow">{t("booking.rescheduleTitle")}</p>
								<form
									onSubmit={(e) => {
										e.preventDefault()
										void handleReschedule()
									}}
									className="mt-5 space-y-4"
								>
									<div>
										<label className="field-label" htmlFor="reschedule-date">
											{t("booking.pickDate")}
										</label>
										<input
											id="reschedule-date"
											type="date"
											className="input"
											min={minDate}
											value={rescheduleValues.date}
											onChange={(e) => setRescheduleField("date")(e.target.value)}
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="field-label" htmlFor="reschedule-start">
												{t("booking.startTime")}
											</label>
											<input
												id="reschedule-start"
												type="time"
												className="input"
												value={rescheduleValues.startTime}
												onChange={(e) => setRescheduleField("startTime")(e.target.value)}
											/>
										</div>
										<div>
											<label className="field-label" htmlFor="reschedule-end">
												{t("booking.endTime")}
											</label>
											<input
												id="reschedule-end"
												type="time"
												className="input"
												value={rescheduleValues.endTime}
												onChange={(e) => setRescheduleField("endTime")(e.target.value)}
											/>
										</div>
									</div>
									<div className="flex flex-wrap gap-3 pt-1">
										<button type="submit" disabled={rescheduling} className="btn btn-primary btn-sm">
											{rescheduling ? t("common.loading") : t("booking.rescheduleConfirm")}
										</button>
										<button
											type="button"
											onClick={() => {
												setShowReschedule(false)
												setRescheduleValues(EMPTY_RESCHEDULE)
											}}
											className="btn btn-ghost btn-sm"
										>
											{t("common.cancel")}
										</button>
									</div>
								</form>
							</div>
						)}
					</>
				)}
			</div>
		</main>
	)
}

function BookingSkeleton() {
	return (
		<div className="mt-8">
			<div className="space-y-3 border-b border-(--border) pb-7">
				<Skeleton className="h-3 w-28" />
				<Skeleton className="h-11 w-80 max-w-full" />
				<Skeleton className="h-4 w-56" />
			</div>
			<div className="mt-8 overflow-hidden rounded-(--radius-lg) border border-(--border) bg-(--bg-card)">
				<div className="grid gap-6 border-b border-(--border) p-6 md:grid-cols-2 md:p-8">
					<div className="space-y-3">
						<Skeleton className="h-3 w-16" />
						<Skeleton className="h-7 w-40" />
						<Skeleton className="h-4 w-28" />
					</div>
					<div className="space-y-3">
						<Skeleton className="h-3 w-16" />
						<Skeleton className="h-7 w-28" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
					<Skeleton className="h-9 w-full" />
					<Skeleton className="h-9 w-3/4" />
				</div>
			</div>
		</div>
	)
}
