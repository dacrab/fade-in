import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Calendar, Clock, Scissors } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { useAuth } from "#/hooks/useAuth"
import { formatDateShort, formatPrice } from "#/lib/format"
import type { Appointment, Barbershop } from "#/types"
import { STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/barber/overview")({ component: BarberDashboard })

function BarberDashboard() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const navigate = useNavigate()
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

	useEffect(() => {
		if (!user) return
		if (user.role !== "barber" && user.role !== "admin") navigate({ to: "/home" })
	}, [user, navigate])

	// TODO: Add barbers.getByUserId query to resolve current user's barber profile
	const appointments = useQuery(api.appointments.listByBarber, "skip") as Appointment[] | undefined

	if (!user) return <Skeleton className="h-64 m-8 rounded-2xl" />

	return (
		<main className="page-main">
			<div className="page-wrap max-w-4xl">
				<div className="section-header mb-6">
					<div>
						<h1 className="text-2xl font-bold text-[var(--text)]">{t("barber.title")}</h1>
						<p className="text-[var(--text-muted)] text-sm">{t("barber.subtitle")}</p>
					</div>
				</div>

				{/* Date selector */}
				<div className="card p-4 mb-6">
					<label className="form-label" htmlFor="date-select">
						{t("barber.selectDate")}
					</label>
					<input
						id="date-select"
						type="date"
						className="input max-w-xs"
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
					/>
				</div>

				{/* Appointments */}
				<div className="card p-5">
					<h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
						<Calendar size={18} className="text-[var(--gold)]" />
						{t("barber.schedule")} - {formatDateShort(selectedDate)}
					</h2>

					{appointments === undefined ? (
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
								<Skeleton key={i} className="h-20 w-full rounded-xl" />
							))}
						</div>
					) : appointments.length === 0 ? (
						<div className="empty-state">
							<Clock size={32} className="mx-auto mb-2 opacity-30" />
							<p className="text-sm">{t("barber.noAppointments")}</p>
						</div>
					) : (
						<div className="space-y-3">
							{appointments.map((appt) => (
								<AppointmentCard key={appt._id} appt={appt} />
							))}
						</div>
					)}
				</div>
			</div>
		</main>
	)
}

function AppointmentCard({ appt }: { appt: Appointment }) {
	const { t } = useTranslation()
	const shop = useQuery(api.barbershops.getById, { id: appt.barbershopId }) as
		| Barbershop
		| null
		| undefined

	return (
		<div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-input)]">
			<div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-[rgba(245,158,11,0.1)]">
				<Scissors size={20} className="text-[var(--gold)]" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="font-medium text-[var(--text)]">{shop?.name ?? "..."}</div>
				<div className="text-sm text-[var(--text-muted)]">
					{appt.startTime} - {appt.endTime}
				</div>
				{appt.notes && <div className="text-xs text-[var(--text-subtle)] mt-1">{appt.notes}</div>}
			</div>
			<div className="text-right">
				<div className="text-sm font-bold text-[var(--gold)]">{formatPrice(appt.totalPrice)}</div>
				<span className={`badge text-xs ${STATUS_BADGE[appt.status]}`}>
					{t(`status.${appt.status}`)}
				</span>
			</div>
		</div>
	)
}
