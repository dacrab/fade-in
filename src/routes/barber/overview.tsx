import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Calendar, DollarSign, Scissors } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { useAuth } from "#/hooks/useAuth"
import { formatDateShort, formatPrice } from "#/lib/format"
import type { Appointment } from "#/types"
import { STATUS_DOT } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/barber/overview")({ component: BarberDashboard })

function BarberDashboard() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const navigate = useNavigate()
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

	useEffect(() => {
		if (!user) return
		if (user.role !== "barber" && user.role !== "admin") void navigate({ to: "/" })
	}, [user, navigate])

	const barber = useQuery(api.barbers.getByUserId, user ? { userId: user.id } : "skip")
	const appointments = useQuery(
		api.appointments.listByBarber,
		barber ? { barberId: barber._id } : "skip",
	)

	if (!user) return <Skeleton className="h-64 m-8 rounded-xl" />

	const todayAppts = appointments?.filter((a: Doc<"appointments">) => a.date === selectedDate) ?? []
	const completedToday = todayAppts.filter((a: Doc<"appointments">) => a.status === "completed")
	const todayEarnings = completedToday.reduce(
		(sum: number, a: Doc<"appointments">) => sum + a.totalPrice,
		0,
	)
	const nextAppt = todayAppts
		.filter((a: Doc<"appointments">) => a.status === "pending" || a.status === "confirmed")
		.sort((a: Doc<"appointments">, b: Doc<"appointments">) =>
			a.startTime.localeCompare(b.startTime),
		)[0]

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl py-8">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold text-(--text)">{t("barber.title")}</h1>
						<p className="text-sm text-(--text-muted)">{t("barber.subtitle")}</p>
					</div>
					<input
						type="date"
						className="input w-auto"
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
					/>
				</div>

				{/* Quick stats for the day */}
				<div className="grid grid-cols-3 gap-3 mb-6">
					<div className="card p-3 flex items-center gap-3">
						<Calendar size={16} className="text-(--gold) shrink-0" />
						<div>
							<div className="text-lg font-bold text-(--text) tabular-nums">{todayAppts.length}</div>
							<div className="text-[11px] text-(--text-muted)">{t("barber.schedule")}</div>
						</div>
					</div>
					<div className="card p-3 flex items-center gap-3">
						<Scissors size={16} className="text-(--gold) shrink-0" />
						<div>
							<div className="text-lg font-bold text-(--text) tabular-nums">{completedToday.length}</div>
							<div className="text-[11px] text-(--text-muted)">{t("status.completed")}</div>
						</div>
					</div>
					<div className="card p-3 flex items-center gap-3">
						<DollarSign size={16} className="text-(--gold) shrink-0" />
						<div>
							<div className="text-lg font-bold text-(--text) tabular-nums">
								{formatPrice(todayEarnings)}
							</div>
							<div className="text-[11px] text-(--text-muted)">{t("barber.earnings")}</div>
						</div>
					</div>
				</div>

				{/* Next appointment highlight */}
				{nextAppt && (
					<div className="card p-4 mb-4 border-l-2 border-l-(--gold)">
						<div className="text-[11px] text-(--gold) font-medium mb-1">Next up</div>
						<div className="flex items-center gap-3">
							<span className="text-lg font-bold text-(--text) font-mono">{nextAppt.startTime}</span>
							<span className="text-sm text-(--text-muted)">→ {nextAppt.endTime}</span>
							<span className="ml-auto text-sm font-medium text-(--text)">
								{formatPrice(nextAppt.totalPrice)}
							</span>
						</div>
						{nextAppt.notes && <p className="text-xs text-(--text-muted) mt-1">{nextAppt.notes}</p>}
					</div>
				)}

				{/* Schedule list */}
				<section className="card p-5">
					<h2 className="text-sm font-semibold text-(--text) mb-3">
						{t("barber.schedule")} — {formatDateShort(selectedDate)}
					</h2>
					{appointments === undefined ? (
						<div className="space-y-2">
							{[0, 1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : todayAppts.length === 0 ? (
						<p className="text-sm text-(--text-muted) py-4 text-center">{t("barber.noAppointments")}</p>
					) : (
						<div className="divide-y divide-(--border)">
							{todayAppts
								.sort((a: Doc<"appointments">, b: Doc<"appointments">) =>
									a.startTime.localeCompare(b.startTime),
								)
								.map((appt: Doc<"appointments">) => (
									<AppointmentRow key={appt._id} appt={appt} />
								))}
						</div>
					)}
				</section>
			</div>
		</main>
	)
}

function AppointmentRow({ appt }: { appt: Appointment }) {
	const { t } = useTranslation()
	const shop = useQuery(api.barbershops.getById, { id: appt.barbershopId })

	const statusColor = STATUS_DOT[appt.status]

	return (
		<div className="flex items-center gap-3 py-3">
			<span className="text-xs font-mono text-(--text-muted) w-20 shrink-0">
				{appt.startTime} – {appt.endTime}
			</span>
			<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
			<div className="flex-1 min-w-0">
				<span className="text-sm text-(--text) block truncate">{shop?.name ?? "…"}</span>
				{appt.notes && <span className="text-xs text-(--text-subtle)">{appt.notes}</span>}
			</div>
			<span className="text-sm font-medium text-(--text) tabular-nums">
				{formatPrice(appt.totalPrice)}
			</span>
			<span className="text-[11px] text-(--text-muted)">{t(`status.${appt.status}`)}</span>
		</div>
	)
}
