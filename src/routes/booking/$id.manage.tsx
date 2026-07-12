import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	CheckCircle,
	Clock,
	RefreshCw,
	Scissors,
	User,
	XCircle,
} from "lucide-react"
import { useState } from "react"
import { Skeleton } from "#/components/ui/Skeleton"
import { withToast } from "#/components/ui/Toast"
import { formatDate, formatPrice } from "#/lib/format"
import { type Appointment, STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/booking/$id/manage")({ component: ManagePage })

function ManagePage() {
	const { id } = Route.useParams()
	const searchParams = new URLSearchParams(
		typeof window !== "undefined" ? window.location.search : "",
	)
	const token = searchParams.get("token") ?? ""

	const appointment = useQuery(api.appointments.getById, { id: id as Id<"appointments"> })
	const shop = useQuery(
		api.barbershops.getById,
		appointment ? { id: appointment.barbershopId } : "skip",
	)
	const barber = useQuery(api.barbers.getById, appointment ? { id: appointment.barberId } : "skip")

	const cancelByToken = useMutation(api.appointments.cancelByToken)
	const requestRescheduleByToken = useMutation(api.appointments.requestRescheduleByToken)

	const [rescheduleMessage, setRescheduleMessage] = useState("")
	const [showRescheduleForm, setShowRescheduleForm] = useState(false)

	const isTokenValid = token.length > 0
	const appt = appointment as Appointment | null

	const handleCancel = () =>
		void withToast(
			() => cancelByToken({ id: id as Id<"appointments">, token }),
			"Appointment cancelled",
			"Failed to cancel. Check your link.",
		)

	const handleRescheduleRequest = () =>
		void withToast(
			async () => {
				await requestRescheduleByToken({
					id: id as Id<"appointments">,
					token,
					message: rescheduleMessage || undefined,
				})
				setShowRescheduleForm(false)
				setRescheduleMessage("")
			},
			"Reschedule request sent. The shop will contact you.",
			"Failed to send request.",
		)

	return (
		<main className="page-main">
			<div className="page-wrap max-w-2xl py-8">
				<Link
					to="/"
					className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) hover:text-(--gold) transition-colors mb-6"
				>
					<ArrowLeft size={15} />
					Back to home
				</Link>

				{!isTokenValid && (
					<div className="rounded-xl border border-(--gold)/20 bg-(--gold)/5 p-4 mb-6 flex items-center gap-3">
						<AlertCircle size={20} className="text-(--gold) shrink-0" />
						<p className="text-sm text-(--text-muted)">
							No manage link provided. Check your email for the full link.
						</p>
					</div>
				)}

				{appointment === undefined ? (
					<ManageSkeleton />
				) : !appt ? (
					<div className="text-center py-16">
						<XCircle size={48} className="mx-auto mb-4 text-(--text-subtle)" />
						<h1 className="text-xl font-bold text-(--text) mb-2">Appointment not found</h1>
						<p className="text-sm text-(--text-muted) mb-6">
							This appointment doesn't exist or has been removed.
						</p>
						<Link to="/" className="btn btn-primary">
							Back to home
						</Link>
					</div>
				) : (
					<>
						<div className="rounded-2xl border border-(--border) bg-(--bg-card) overflow-hidden">
							<div className="p-6 pb-4 border-b border-(--border)">
								<div className="flex items-center gap-4 mb-3">
									<div className="w-12 h-12 rounded-xl bg-(--gold)/10 flex items-center justify-center">
										<Scissors size={22} className="text-(--gold)" />
									</div>
									<div>
										<h1 className="text-lg font-bold text-(--text)">{shop?.name ?? "Barbershop"}</h1>
										<p className="text-xs text-(--text-muted) mt-0.5">
											{shop?.address}, {shop?.city}
										</p>
									</div>
								</div>
								<span
									className={`badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[appt.status]}`}
								>
									{appt.status === "confirmed" || appt.status === "completed" ? (
										<CheckCircle size={11} />
									) : appt.status === "cancelled" ? (
										<XCircle size={11} />
									) : (
										<Clock size={11} />
									)}
									{appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
								</span>
							</div>

							<div className="p-6 space-y-5">
								<div className="grid grid-cols-2 gap-5">
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">Date</p>
										<p className="text-sm font-medium text-(--text) flex items-center gap-1.5">
											<Calendar size={14} className="text-(--text-subtle)" />
											{formatDate(appt.date)}
										</p>
									</div>
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">Time</p>
										<p className="text-sm font-medium text-(--text) flex items-center gap-1.5">
											<Clock size={14} className="text-(--text-subtle)" />
											{appt.startTime} – {appt.endTime}
										</p>
									</div>
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">Barber</p>
										<p className="text-sm font-medium text-(--text) flex items-center gap-1.5">
											<User size={14} className="text-(--text-subtle)" />
											{barber?.name ?? "—"}
										</p>
									</div>
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">Total</p>
										<p className="text-sm font-bold text-(--gold)">{formatPrice(appt.totalPrice)}</p>
									</div>
								</div>

								{shop?.phone && (
									<div>
										<p className="text-[11px] text-(--text-subtle) mb-1">Shop phone</p>
										<a href={`tel:${shop.phone}`} className="text-sm text-(--gold) hover:underline">
											{shop.phone}
										</a>
									</div>
								)}
							</div>

							{(appt.status === "pending" || appt.status === "confirmed") && isTokenValid && (
								<div className="px-6 py-4 border-t border-(--border) bg-(--bg-input)/30 flex flex-col gap-3">
									<div className="flex items-center gap-3">
										<button
											type="button"
											onClick={() => void handleCancel()}
											className="px-4 py-2 rounded-full border border-(--error)/20 text-xs text-(--error) hover:bg-(--error)/5 transition-colors"
										>
											Cancel appointment
										</button>
										<button
											type="button"
											onClick={() => setShowRescheduleForm(!showRescheduleForm)}
											className="btn btn-secondary text-xs gap-1.5"
										>
											<RefreshCw size={13} />
											Request reschedule
										</button>
									</div>
								</div>
							)}
						</div>

						{showRescheduleForm && (
							<div className="mt-4 rounded-xl border border-(--border) bg-(--bg-card) p-5">
								<h3 className="text-sm font-semibold text-(--text) mb-2">Request Reschedule</h3>
								<p className="text-xs text-(--text-muted) mb-4">
									Your reschedule request will be sent to the shop. They will contact you to arrange a new
									time.
								</p>
								<div className="space-y-3">
									<div>
										<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="reschedule-msg">
											Message (optional)
										</label>
										<textarea
											id="reschedule-msg"
											className="input w-full text-sm resize-none"
											rows={3}
											placeholder="Tell us your preferred dates/times..."
											value={rescheduleMessage}
											onChange={(e) => setRescheduleMessage(e.target.value)}
										/>
									</div>
									<div className="flex gap-3">
										<button
											type="button"
											onClick={() => void handleRescheduleRequest()}
											className="btn btn-primary text-xs"
										>
											Send request
										</button>
										<button
											type="button"
											onClick={() => setShowRescheduleForm(false)}
											className="px-4 py-2 rounded-full border border-(--border) text-xs text-(--text-muted)"
										>
											Cancel
										</button>
									</div>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</main>
	)
}

function ManageSkeleton() {
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
				<Skeleton className="h-16 rounded-lg" />
			</div>
		</div>
	)
}
