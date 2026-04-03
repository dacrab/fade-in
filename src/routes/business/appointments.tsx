import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Calendar, Check, Clock, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import AsyncList from "#/components/AsyncList"
import PageHeader from "#/components/PageHeader"
import { withToast } from "#/components/ui/Toast"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { useRequireRole } from "#/hooks/useRequireRole"
import { formatDateShort, formatPrice } from "#/lib/format"
import { type Appointment, type AppointmentStatus, STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/appointments")({ component: BusinessAppointments })

function BusinessAppointments() {
	const { t } = useTranslation()
	useRequireRole(["owner", "admin"])
	const [selectedDate, setSelectedDate] = useState("")

	const shop = useOwnerShop()
	const appointments = useQuery(
		api.appointments.listByShop,
		shop ? { barbershopId: shop._id, date: selectedDate || undefined } : "skip",
	) as Appointment[] | undefined
	const updateStatus = useMutation(api.appointments.updateStatus)

	const handleStatus = (id: Id<"appointments">, status: AppointmentStatus) =>
		withToast(
			() => updateStatus({ id, status }),
			t(`status.${status}`),
			t("errors.updateStatusFailed"),
		)

	return (
		<main className="page-main">
			<div className="page-wrap max-w-4xl">
				<PageHeader
					back="/business"
					backLabel={t("nav.business")}
					title={t("business.appointments.title")}
				/>

				<div className="flex items-center gap-3 mb-6">
					<div className="relative">
						<Calendar
							size={16}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
						/>
						<input
							type="date"
							className="input pl-9 w-48"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
						/>
					</div>
					{selectedDate && (
						<button type="button" onClick={() => setSelectedDate("")} className="btn btn-ghost text-sm">
							{t("business.appointments.clearFilter")}
						</button>
					)}
				</div>

				<AsyncList
					data={appointments}
					skeleton={{ count: 5, height: "h-20" }}
					empty={{ icon: Clock, message: t("business.appointments.noAppointments") }}
				>
					{(appointments) => (
						<div className="space-y-3">
							{appointments.map((appt) => (
								<div key={appt._id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
									<div className="flex items-center gap-3 flex-1 min-w-0">
										<div className="text-center flex-shrink-0">
											<div className="text-lg font-bold text-[var(--gold)]">{appt.startTime}</div>
											<div className="text-xs text-[var(--text-muted)]">{formatDateShort(appt.date)}</div>
										</div>
										<div className="min-w-0">
											<div className="text-sm font-medium text-[var(--text)] truncate">
												{appt.notes ?? "—"}
											</div>
											<div className="text-xs text-[var(--text-muted)]">
												{appt.endTime} · {formatPrice(appt.totalPrice)}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2 flex-shrink-0">
										<span className={`badge ${STATUS_BADGE[appt.status]}`}>{t(`status.${appt.status}`)}</span>
										{appt.status === "pending" && (
											<>
												<button
													type="button"
													onClick={() => void handleStatus(appt._id, "confirmed")}
													className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
													title={t("business.appointments.confirm")}
												>
													<Check size={14} />
												</button>
												<button
													type="button"
													onClick={() => void handleStatus(appt._id, "cancelled")}
													className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
													title={t("business.appointments.cancel")}
												>
													<X size={14} />
												</button>
											</>
										)}
										{appt.status === "confirmed" && (
											<button
												type="button"
												onClick={() => void handleStatus(appt._id, "completed")}
												className="btn btn-secondary text-xs py-1 px-2"
											>
												{t("business.appointments.complete")}
											</button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</AsyncList>
			</div>
		</main>
	)
}
