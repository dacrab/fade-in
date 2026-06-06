import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Check, ChevronLeft, ChevronRight, Clock, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { withToast } from "#/components/ui/Toast"
import { useBusinessAuth } from "#/hooks/useBusinessAuth"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { formatPrice } from "#/lib/format"
import type { AppointmentStatus } from "#/types"
import { STATUS_DOT } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/appointments")({ component: BusinessAppointments })

function BusinessAppointments() {
	const { t } = useTranslation()
	const { user } = useBusinessAuth()
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

	const shop = useOwnerShop(user?.id)
	const appointments = useQuery(
		api.appointments.listByShop,
		shop ? { barbershopId: shop._id, date: selectedDate || undefined } : "skip",
	)
	const updateStatus = useMutation(api.appointments.updateStatus)

	const handleStatus = (id: Id<"appointments">, status: AppointmentStatus) =>
		withToast(
			() => updateStatus({ id, status }),
			t(`status.${status}`),
			t("errors.updateStatusFailed"),
		)

	const pending = appointments?.filter((a) => a.status === "pending") ?? []
	const confirmed = appointments?.filter((a) => a.status === "confirmed") ?? []
	const completed = appointments?.filter((a) => a.status === "completed") ?? []

	return (
		<div className="px-8 py-8">
			<h1 className="text-lg font-medium text-(--text) tracking-tight mb-5">
				{t("business.appointments.title")}
			</h1>

			<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
				<div>
					<MiniCalendar selected={selectedDate} onSelect={setSelectedDate} />
					{selectedDate && (
						<button
							type="button"
							onClick={() => setSelectedDate("")}
							className="mt-3 text-xs text-(--text-muted) hover:text-(--gold) transition-colors w-full text-center"
						>
							{t("business.appointments.clearFilter")}
						</button>
					)}
				</div>

				<div>
					{appointments && appointments.length > 0 && (
						<div className="flex gap-4 mb-4 text-xs text-(--text-muted)">
							<span>{appointments.length} total</span>
							{pending.length > 0 && <span className="text-(--gold)">{pending.length} pending</span>}
							{confirmed.length > 0 && (
								<span className="text-(--success)">{confirmed.length} confirmed</span>
							)}
							{completed.length > 0 && (
								<span className="text-(--text-subtle)">{completed.length} done</span>
							)}
						</div>
					)}

					{!appointments ? (
						<div className="space-y-3">
							{[0, 1, 2, 3, 4].map((i) => (
								<Skeleton key={i} className="h-14 w-full" />
							))}
						</div>
					) : appointments.length === 0 ? (
						<div className="text-center py-12">
							<Clock size={24} className="mx-auto mb-2 text-(--text-subtle)" />
							<p className="text-sm text-(--text-muted)">{t("business.appointments.noAppointments")}</p>
						</div>
					) : (
						<div className="divide-y divide-(--border)">
							{[...appointments]
								.sort((a, b) => a.startTime.localeCompare(b.startTime))
								.map((appt) => (
									<div key={appt._id} className="flex items-center gap-4 py-3 group">
										<div className="w-16 shrink-0">
											<div className="text-sm font-mono font-medium text-(--text)">{appt.startTime}</div>
											<div className="text-[11px] font-mono text-(--text-subtle)">{appt.endTime}</div>
										</div>
										<span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[appt.status]}`} />
										<div className="flex-1 min-w-0">
											<div className="text-sm text-(--text) truncate">{appt.notes || "—"}</div>
											<div className="text-xs text-(--text-subtle)">{formatPrice(appt.totalPrice)}</div>
										</div>
										<div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
											{appt.status === "pending" && (
												<>
													<button
														type="button"
														onClick={() => void handleStatus(appt._id, "confirmed")}
														className="p-1.5 rounded-md bg-(--success)/10 text-(--success) hover:bg-(--success)/20 transition-colors"
														title={t("business.appointments.confirm")}
													>
														<Check size={13} />
													</button>
													<button
														type="button"
														onClick={() => void handleStatus(appt._id, "cancelled")}
														className="p-1.5 rounded-md bg-(--error)/10 text-(--error) hover:bg-(--error)/20 transition-colors"
														title={t("business.appointments.cancel")}
													>
														<X size={13} />
													</button>
												</>
											)}
											{appt.status === "confirmed" && (
												<button
													type="button"
													onClick={() => void handleStatus(appt._id, "completed")}
													className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-(--border) text-(--text-muted) hover:border-(--gold) hover:text-(--gold) transition-colors"
												>
													{t("business.appointments.complete")}
												</button>
											)}
										</div>
									</div>
								))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function MiniCalendar({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
	const [viewDate, setViewDate] = useState(() => {
		const d = selected ? new Date(selected) : new Date()
		return { year: d.getFullYear(), month: d.getMonth() }
	})

	const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate()
	const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay()
	const offset = firstDay === 0 ? 6 : firstDay - 1

	const today = new Date().toISOString().slice(0, 10)
	const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
	})

	const shift = (dir: 1 | -1) =>
		setViewDate((v) => {
			const m = v.month + dir
			return m < 0
				? { year: v.year - 1, month: 11 }
				: m > 11
					? { year: v.year + 1, month: 0 }
					: { ...v, month: m }
		})

	const toDateStr = (day: number) =>
		`${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

	return (
		<div className="card p-4">
			<div className="flex items-center justify-between mb-3">
				<button
					type="button"
					onClick={() => shift(-1)}
					className="p-1 rounded-md hover:bg-(--bg-input) text-(--text-muted) transition-colors"
				>
					<ChevronLeft size={16} />
				</button>
				<span className="text-sm font-medium text-(--text) capitalize">{monthLabel}</span>
				<button
					type="button"
					onClick={() => shift(1)}
					className="p-1 rounded-md hover:bg-(--bg-input) text-(--text-muted) transition-colors"
				>
					<ChevronRight size={16} />
				</button>
			</div>

			<div className="grid grid-cols-7 mb-1">
				{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
					<div key={d} className="text-[10px] text-(--text-subtle) text-center py-1 font-medium">
						{d}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-0.5">
				{Array.from({ length: offset }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: calendar empty cells
					<div key={i} />
				))}
				{Array.from({ length: daysInMonth }, (_, i) => {
					const day = i + 1
					const dateStr = toDateStr(day)
					const isSelected = dateStr === selected
					const isToday = dateStr === today
					return (
						<button
							key={day}
							type="button"
							onClick={() => onSelect(dateStr)}
							className={`w-8 h-8 rounded-md text-xs font-medium transition-colors mx-auto flex items-center justify-center ${isSelected ? "bg-(--gold) text-white" : isToday ? "border border-(--gold) text-(--gold)" : "text-(--text-muted) hover:bg-(--bg-input) hover:text-(--text)"}`}
						>
							{day}
						</button>
					)
				})}
			</div>
		</div>
	)
}
