import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Calendar, DollarSign, Scissors } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton, SkeletonRows } from "#/components/ui/Skeleton"
import { StatCard } from "#/components/ui/StatCard"
import { useFormatters } from "#/hooks/useFormatters"
import { useRequireRole } from "#/hooks/useRequireRole"
import { todayIso } from "#/lib/format"
import type { Appointment } from "#/types"
import { STATUS_DOT } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/barber/overview")({ component: BarberDashboard })

function BarberDashboard() {
	const { t } = useTranslation()
	const f = useFormatters()
	const { user } = useRequireRole(["barber", "admin"])
	const [selectedDate, setSelectedDate] = useState(todayIso())

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
				<div className="page-head">
					<div>
						<h1 className="page-title">{t("barber.title")}</h1>
						<p className="muted-sm">{t("barber.subtitle")}</p>
					</div>
					<input
						type="date"
						className="input w-auto"
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
					/>
				</div>

				<div className="grid grid-cols-3 gap-3 mb-6">
					<StatCard icon={Calendar} value={todayAppts.length} label={t("barber.schedule")} />
					<StatCard icon={Scissors} value={completedToday.length} label={t("status.completed")} />
					<StatCard
						icon={DollarSign}
						value={f.formatPrice(todayEarnings)}
						label={t("barber.earnings")}
					/>
				</div>

				{nextAppt && (
					<div className="card p-4 mb-4 border-l-2 border-l-(--gold)">
						<div className="text-[11px] text-(--gold) font-medium mb-1">{t("barber.nextUp")}</div>
						<div className="flex items-center gap-3">
							<span className="text-lg font-bold text-(--text) font-mono">{nextAppt.startTime}</span>
							<span className="muted-sm">→ {nextAppt.endTime}</span>
							<span className="ml-auto strong-sm">{f.formatPrice(nextAppt.totalPrice)}</span>
						</div>
						{nextAppt.notes && <p className="muted-xs mt-1">{nextAppt.notes}</p>}
					</div>
				)}

				<section className="card p-5">
					<h2 className="card-title">
						{t("barber.schedule")} — {f.formatDateShort(selectedDate)}
					</h2>
					{appointments === undefined ? (
						<SkeletonRows count={4} className="h-12" />
					) : todayAppts.length === 0 ? (
						<p className="muted-sm py-4 text-center">{t("barber.noAppointments")}</p>
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
	const f = useFormatters()
	const shop = useQuery(api.barbershops.getById, { id: appt.barbershopId })

	const statusColor = STATUS_DOT[appt.status]

	return (
		<div className="flex items-center gap-3 py-3">
			<span className="text-xs font-mono text-(--text-muted) w-20 shrink-0">
				{appt.startTime} – {appt.endTime}
			</span>
			<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
			<div className="flex-1 min-w-0">
				<span className="main-sm block truncate">{shop?.name ?? "…"}</span>
				{appt.notes && <span className="subtle-xs">{appt.notes}</span>}
			</div>
			<span className="strong-sm tabular-nums">{f.formatPrice(appt.totalPrice)}</span>
			<span className="muted-tiny">{t(`status.${appt.status}`)}</span>
		</div>
	)
}
