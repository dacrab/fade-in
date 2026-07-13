import { useForm } from "@tanstack/react-form"
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
	Scissors,
	User,
	XCircle,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Skeleton } from "#/components/ui/Skeleton"
import { withToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import { formatDate, formatPrice } from "#/lib/format"
import { type Appointment, isOwnerOrAdmin, STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/booking/$id")({ component: BookingPage })

const rescheduleSchema = z.object({
	date: z.string().min(1, "Date is required"),
	startTime: z.string().min(1, "Time is required"),
	endTime: z.string().min(1, "End time is required"),
})

function BookingPage() {
	const { t } = useTranslation()
	const { id } = Route.useParams()
	const { user } = useAuth()
	const searchParams = new URLSearchParams(
		typeof window !== "undefined" ? window.location.search : "",
	)
	const payment = searchParams.get("payment")

	const appointment = useQuery(api.appointments.getById, { id: id as Id<"appointments"> })
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
	const minDate = (() => {
		const d = new Date()
		d.setDate(d.getDate() + 1)
		return d.toISOString().split("T")[0]
	})()

	const rescheduleForm = useForm({
		defaultValues: { date: "", startTime: "", endTime: "" },
		validators: { onChange: rescheduleSchema },
		onSubmit: async ({ value }) => {
			await withToast(
				() =>
					reschedule({
						id: id as Id<"appointments">,
						date: value.date,
						startTime: value.startTime,
						endTime: value.endTime,
					}),
				t("booking.rescheduled"),
				t("errors.rescheduleFailed"),
			)
			setShowReschedule(false)
			rescheduleForm.reset()
		},
	})

	const handleCancel = () =>
		void withToast(
			() => updateStatus({ id: id as Id<"appointments">, status: "cancelled" }),
			t("status.cancelled"),
			t("errors.updateStatusFailed"),
		)

	const isLoading = appointment === undefined
	const appt = appointment as Appointment | null

	const selectedServices =
		appt && services ? services.filter((s: Doc<"services">) => appt.serviceIds.includes(s._id)) : []

	return (
		<main className="page-main">
			<div className="page-wrap max-w-2xl py-8">
				<Link
					to={isOwnerOrAdmin(user) ? "/business/appointments" : "/dashboard/overview"}
					className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) hover:text-(--gold) transition-colors mb-6"
				>
					<ArrowLeft size={15} />
					{t("common.back")}
				</Link>

				{isLoading ? (
					<BookingSkeleton />
				) : !appt ? (
					<div className="text-center py-16">
						<XCircle size={48} className="mx-auto mb-4 text-(--text-subtle)" />
						<h1 className="text-xl font-bold text-(--text) mb-2">{t("booking.notFound")}</h1>
						<p className="text-sm text-(--text-muted) mb-6">{t("booking.notFoundMessage")}</p>
						<Link to="/" className="btn btn-primary">
							{t("errors.backHome")}
						</Link>
					</div>
				) : (
					<>
						{/* Payment status banner */}
						{payment === "success" && (
							<div className="rounded-xl border border-(--success)/20 bg-(--success)/5 p-4 mb-6 flex items-center gap-3">
								<CheckCircle size={20} className="text-(--success) shrink-0" />
								<p className="text-sm text-(--text) font-medium">{t("booking.paymentSuccess")}</p>
							</div>
						)}
						{payment === "canceled" && (
							<div className="rounded-xl border border-(--gold)/20 bg-(--gold)/5 p-4 mb-6 flex items-center gap-3">
								<AlertCircle size={20} className="text-(--gold) shrink-0" />
								<p className="text-sm text-(--text) font-medium">{t("booking.paymentCanceled")}</p>
							</div>
						)}

						<div className="rounded-2xl border border-(--border) bg-(--bg-card) overflow-hidden">
							{/* Header */}
							<div className="p-6 pb-4 border-b border-(--border)">
								<div className="flex items-center gap-4 mb-3">
									<div className="w-12 h-12 rounded-xl bg-(--gold)/10 flex items-center justify-center">
										<Scissors size={22} className="text-(--gold)" />
									</div>
									<div>
										<h1 className="text-lg font-bold text-(--text)">{shop?.name ?? "—"}</h1>
										{shop && (
											<p className="text-xs text-(--text-muted) flex items-center gap-1 mt-0.5">
												<MapPin size={11} />
												{shop.address}, {shop.city}
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<span
										className={`badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[appt.status]}`}
									>
										{appt.status === "confirmed" && <CheckCircle size={11} />}
										{appt.status === "completed" && <CheckCircle size={11} />}
										{appt.status === "cancelled" && <XCircle size={11} />}
										{appt.status === "pending" && <Clock size={11} />}
										{t(`status.${appt.status}`)}
									</span>
									{appt.paymentStatus && (
										<span
											className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
												appt.paymentStatus === "paid"
													? "bg-(--success)/10 text-(--success)"
													: "bg-(--gold)/10 text-(--gold)"
											}`}
										>
											<CreditCard size={11} />
											{appt.paymentStatus === "paid" ? t("booking.paid") : t("booking.unpaid")}
										</span>
									)}
								</div>
							</div>

							{/* Details */}
							<div className="p-6 space-y-5">
								<div className="grid grid-cols-2 gap-5">
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">{t("booking.summaryFields.date")}</p>
										<p className="text-sm font-medium text-(--text) flex items-center gap-1.5">
											<Calendar size={14} className="text-(--text-subtle)" />
											{formatDate(appt.date)}
										</p>
									</div>
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">{t("booking.summaryFields.time")}</p>
										<p className="text-sm font-medium text-(--text) flex items-center gap-1.5">
											<Clock size={14} className="text-(--text-subtle)" />
											{appt.startTime} – {appt.endTime}
										</p>
									</div>
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">
											{t("booking.summaryFields.barber")}
										</p>
										<p className="text-sm font-medium text-(--text) flex items-center gap-1.5">
											<User size={14} className="text-(--text-subtle)" />
											{barber?.name ?? "—"}
										</p>
									</div>
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">
											{t("booking.summaryFields.total")}
										</p>
										<p className="text-sm font-bold text-(--gold)">{formatPrice(appt.totalPrice)}</p>
									</div>
								</div>

								{selectedServices.length > 0 && (
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-2">
											{t("booking.summaryFields.services")}
										</p>
										<div className="flex flex-wrap gap-1.5">
											{selectedServices.map((s: Doc<"services">) => (
												<span
													key={s._id}
													className="px-2.5 py-1 rounded-full bg-(--gold)/8 text-(--gold) text-xs font-medium"
												>
													{s.name}
												</span>
											))}
										</div>
									</div>
								)}

								{appt.notes && (
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">{t("booking.notes")}</p>
										<p className="text-sm text-(--text-muted) bg-(--bg-input) rounded-lg px-3 py-2">
											{appt.notes}
										</p>
									</div>
								)}

								{shop?.phone && (
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">{t("form.phoneLabel")}</p>
										<a
											href={`tel:${shop.phone}`}
											className="text-sm text-(--gold) hover:underline flex items-center gap-1.5"
										>
											<Phone size={14} />
											{shop.phone}
										</a>
									</div>
								)}
							</div>

							{/* Actions */}
							{(appt.status === "pending" || appt.status === "confirmed") && (
								<div className="px-6 py-4 border-t border-(--border) bg-(--bg-input)/30 flex items-center gap-3">
									{appt.customerId === user?.id && (
										<>
											<button
												type="button"
												onClick={() => setShowReschedule(!showReschedule)}
												className="btn btn-secondary text-xs gap-1.5"
											>
												<RefreshCw size={13} />
												{t("booking.reschedule")}
											</button>
											<button
												type="button"
												onClick={() => void handleCancel()}
												className="px-4 py-2 rounded-full border border-(--error)/20 text-xs text-(--error) hover:bg-(--error)/5 transition-colors"
											>
												{t("business.appointments.cancel")}
											</button>
										</>
									)}
									{isOwnerOrAdmin(user) && shop?.ownerId === user?.id && (
										<button
											type="button"
											onClick={() => setShowReschedule(!showReschedule)}
											className="btn btn-secondary text-xs gap-1.5"
										>
											<RefreshCw size={13} />
											{t("booking.reschedule")}
										</button>
									)}
								</div>
							)}
						</div>

						{/* Reschedule form */}
						{showReschedule && (
							<div className="mt-4 rounded-xl border border-(--border) bg-(--bg-card) p-5">
								<h3 className="text-sm font-semibold text-(--text) mb-4">{t("booking.rescheduleTitle")}</h3>
								<form
									onSubmit={(e) => {
										e.preventDefault()
										e.stopPropagation()
										void rescheduleForm.handleSubmit()
									}}
									className="space-y-4"
								>
									<rescheduleForm.Field name="date">
										{(field) => (
											<div>
												<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="reschedule-date">
													{t("booking.pickDate")}
												</label>
												<input
													id="reschedule-date"
													type="date"
													className="input w-full text-sm"
													min={minDate}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
												/>
											</div>
										)}
									</rescheduleForm.Field>
									<div className="grid grid-cols-2 gap-4">
										<rescheduleForm.Field name="startTime">
											{(field) => (
												<div>
													<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="reschedule-start">
														{t("booking.startTime")}
													</label>
													<input
														id="reschedule-start"
														type="time"
														className="input w-full text-sm"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
													/>
												</div>
											)}
										</rescheduleForm.Field>
										<rescheduleForm.Field name="endTime">
											{(field) => (
												<div>
													<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="reschedule-end">
														{t("booking.endTime")}
													</label>
													<input
														id="reschedule-end"
														type="time"
														className="input w-full text-sm"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
													/>
												</div>
											)}
										</rescheduleForm.Field>
									</div>
									<div className="flex gap-3">
										<rescheduleForm.Subscribe selector={(state) => [state.isSubmitting]}>
											{([isSubmitting]) => (
												<button type="submit" disabled={isSubmitting} className="btn btn-primary text-xs">
													{isSubmitting ? t("common.loading") : t("booking.rescheduleConfirm")}
												</button>
											)}
										</rescheduleForm.Subscribe>
										<button
											type="button"
											onClick={() => {
												setShowReschedule(false)
												rescheduleForm.reset()
											}}
											className="px-4 py-2 rounded-full border border-(--border) text-xs text-(--text-muted)"
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
		<div className="rounded-2xl border border-(--border) bg-(--bg-card) overflow-hidden">
			<div className="p-6 border-b border-(--border)">
				<div className="flex items-center gap-4 mb-3">
					<Skeleton className="w-12 h-12 rounded-xl" />
					<div>
						<Skeleton className="h-5 w-40 mb-1" />
						<Skeleton className="h-3 w-56" />
					</div>
				</div>
			</div>
			<div className="p-6 space-y-5">
				<div className="grid grid-cols-2 gap-5">
					<Skeleton className="h-14 rounded-lg" />
					<Skeleton className="h-14 rounded-lg" />
					<Skeleton className="h-14 rounded-lg" />
					<Skeleton className="h-14 rounded-lg" />
				</div>
				<Skeleton className="h-8 w-48 rounded-full" />
				<Skeleton className="h-16 rounded-lg" />
			</div>
		</div>
	)
}
