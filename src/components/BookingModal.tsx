import { useMutation, useQuery } from "convex/react"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { useReducer } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "#/hooks/useAuth"
import { formatDate, formatPrice } from "#/lib/format"
import type { Barber, Barbershop, Service } from "#/types"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog"
import { showToast } from "./ui/Toast"

interface Props {
	shop: Barbershop
	onClose: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

interface BookingState {
	step: Step
	selectedServices: Id<"services">[]
	selectedBarber: Id<"barbers"> | null
	selectedDate: string
	selectedSlot: string
	notes: string
	loading: boolean
}

type BookingAction =
	| { type: "SET_STEP"; step: Step }
	| { type: "TOGGLE_SERVICE"; id: Id<"services"> }
	| { type: "SET_BARBER"; id: Id<"barbers"> }
	| { type: "SET_DATE"; date: string }
	| { type: "SET_SLOT"; slot: string }
	| { type: "SET_NOTES"; notes: string }
	| { type: "SET_LOADING"; loading: boolean }

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
	switch (action.type) {
		case "SET_STEP":
			return { ...state, step: action.step }
		case "TOGGLE_SERVICE":
			return {
				...state,
				selectedServices: state.selectedServices.includes(action.id)
					? state.selectedServices.filter((s) => s !== action.id)
					: [...state.selectedServices, action.id],
			}
		case "SET_BARBER":
			return { ...state, selectedBarber: action.id }
		case "SET_DATE":
			return { ...state, selectedDate: action.date, selectedSlot: "" }
		case "SET_SLOT":
			return { ...state, selectedSlot: action.slot }
		case "SET_NOTES":
			return { ...state, notes: action.notes }
		case "SET_LOADING":
			return { ...state, loading: action.loading }
	}
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: booking wizard requires multiple step branches
export default function BookingModal({ shop, onClose }: Props) {
	const { t } = useTranslation()
	const { user } = useAuth()
	const [state, dispatch] = useReducer(bookingReducer, {
		step: 1,
		selectedServices: [],
		selectedBarber: null,
		selectedDate: "",
		selectedSlot: "",
		notes: "",
		loading: false,
	})

	const services = useQuery(api.services.listByShop, { barbershopId: shop._id })
	const barbers = useQuery(api.barbers.listByShop, { barbershopId: shop._id })

	const selectedServiceDocs =
		services?.filter((s: Doc<"services">) => state.selectedServices.includes(s._id)) ?? []
	const totalDuration =
		selectedServiceDocs.reduce((acc: number, s: Doc<"services">) => acc + s.durationMinutes, 0) || 30
	const totalPrice = selectedServiceDocs.reduce(
		(acc: number, s: Doc<"services">) => acc + s.price,
		0,
	)

	const slots = useQuery(
		api.appointments.getAvailableSlots,
		state.selectedBarber && state.selectedDate
			? {
					barbershopId: shop._id,
					barberId: state.selectedBarber,
					date: state.selectedDate,
					durationMinutes: totalDuration,
				}
			: "skip",
	)

	const createAppointment = useMutation(api.appointments.create)

	const minDate = (() => {
		const d = new Date()
		d.setDate(d.getDate() + 1)
		return d.toISOString().split("T")[0]
	})()

	const handleConfirm = async () => {
		if (!user) {
			showToast(t("booking.signInRequired"), "error")
			return
		}
		if (!(state.selectedBarber && state.selectedDate && state.selectedSlot)) return
		dispatch({ type: "SET_LOADING", loading: true })
		try {
			const [startH, startM] = state.selectedSlot.split(":").map(Number)
			const endMinutes = (startH ?? 0) * 60 + (startM ?? 0) + totalDuration
			const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
			await createAppointment({
				customerId: user.id as Id<"users">,
				barbershopId: shop._id,
				barberId: state.selectedBarber,
				serviceIds: state.selectedServices,
				date: state.selectedDate,
				startTime: state.selectedSlot,
				endTime,
				totalPrice,
				notes: state.notes || undefined,
			})
			dispatch({ type: "SET_STEP", step: 5 })
		} catch {
			showToast(t("booking.failed"), "error")
		} finally {
			dispatch({ type: "SET_LOADING", loading: false })
		}
	}

	const stepKeys = ["services", "barber", "date", "confirm", "done"] as const
	const stepLabels = stepKeys.map((k) => t(`booking.steps.${k}`))
	const canNext =
		(state.step === 1 && state.selectedServices.length > 0) ||
		(state.step === 2 && state.selectedBarber !== null) ||
		(state.step === 3 && state.selectedDate !== "" && state.selectedSlot !== "") ||
		state.step === 4

	const selectedBarberDoc = barbers?.find((b: Doc<"barbers">) => b._id === state.selectedBarber)

	const summaryRows: [string, string][] = [
		[t("booking.summaryFields.shop"), shop.name],
		[
			t("booking.summaryFields.services"),
			selectedServiceDocs.map((s: Doc<"services">) => s.name).join(", "),
		],
		[t("booking.summaryFields.barber"), selectedBarberDoc?.name ?? "—"],
		[t("booking.summaryFields.date"), formatDate(state.selectedDate)],
		[t("booking.summaryFields.time"), state.selectedSlot],
		[t("booking.summaryFields.duration"), t("booking.duration", { minutes: totalDuration })],
	]

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose()
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader onClose={onClose}>
					<DialogTitle>{t("booking.title", { name: shop.name })}</DialogTitle>
					<DialogDescription>
						{t("booking.step", { current: state.step, total: 5 })} — {stepLabels[state.step - 1]}
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center px-5 py-3 gap-1 border-b border-[var(--border)]">
					{stepLabels.map((label, i) => (
						<div key={label} className="flex items-center gap-1 flex-1">
							<div
								className={`step-dot flex-shrink-0 ${i + 1 < state.step ? "completed" : i + 1 === state.step ? "active" : ""}`}
							>
								{i + 1 < state.step ? <Check size={12} /> : i + 1}
							</div>
							{i < stepLabels.length - 1 && (
								<div
									className={`h-px flex-1 ${i + 1 < state.step ? "bg-app-success" : "bg-[var(--border)]"}`}
								/>
							)}
						</div>
					))}
				</div>

				<div className="p-5 max-h-[55vh] overflow-y-auto">
					{state.step === 1 && (
						<div className="space-y-2">
							<p className="text-sm text-[var(--text-muted)] mb-3">{t("booking.selectServices")}</p>
							{!services ? (
								<p className="text-sm text-[var(--text-muted)]">{t("common.loading")}</p>
							) : services.length === 0 ? (
								<p className="text-sm text-[var(--text-muted)]">{t("booking.noServices")}</p>
							) : (
								services.map((svc: Service) => {
									const selected = state.selectedServices.includes(svc._id)
									return (
										<button
											key={svc._id}
											type="button"
											onClick={() => dispatch({ type: "TOGGLE_SERVICE", id: svc._id })}
											className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
											style={{
												background: selected ? "rgba(245,158,11,0.08)" : "var(--bg-input)",
												borderColor: selected ? "rgba(245,158,11,0.4)" : "var(--border)",
												cursor: "pointer",
											}}
										>
											<div
												className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${selected ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[var(--border)]"}`}
											>
												{selected && <Check size={12} color="#000" />}
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-[var(--text)] text-sm">{svc.name}</div>
												<div className="text-xs text-[var(--text-muted)]">{svc.durationMinutes} min</div>
											</div>
											<div className="font-bold text-[var(--gold)] text-sm">{formatPrice(svc.price)}</div>
										</button>
									)
								})
							)}
						</div>
					)}

					{state.step === 2 && (
						<div className="space-y-3">
							<p className="text-sm text-[var(--text-muted)] mb-3">{t("booking.chooseBarber")}</p>
							{!barbers ? (
								<p className="text-sm text-[var(--text-muted)]">{t("common.loading")}</p>
							) : barbers.length === 0 ? (
								<p className="text-sm text-[var(--text-muted)]">{t("booking.noBarbers")}</p>
							) : (
								barbers.map((b: Barber) => {
									const selected = state.selectedBarber === b._id
									return (
										<button
											key={b._id}
											type="button"
											onClick={() => dispatch({ type: "SET_BARBER", id: b._id })}
											className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
											style={{
												background: selected ? "rgba(245,158,11,0.08)" : "var(--bg-input)",
												borderColor: selected ? "rgba(245,158,11,0.4)" : "var(--border)",
												cursor: "pointer",
											}}
										>
											<div className="avatar avatar-md bg-brand/10 text-[var(--gold)]">
												{b.avatarUrl ? (
													<img
														src={b.avatarUrl}
														alt={b.name}
														className="w-full h-full object-cover rounded-full"
													/>
												) : (
													b.name.charAt(0)
												)}
											</div>
											<div className="flex-1">
												<div className="font-medium text-[var(--text)] text-sm">{b.name}</div>
												{b.specializations.length > 0 && (
													<div className="text-xs text-[var(--text-muted)]">{b.specializations.join(", ")}</div>
												)}
											</div>
											{selected && <Check size={16} className="text-[var(--gold)]" />}
										</button>
									)
								})
							)}
						</div>
					)}

					{state.step === 3 && (
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-[var(--text)] mb-2" htmlFor="booking-date">
									{t("booking.pickDate")}
								</label>
								<input
									id="booking-date"
									type="date"
									className="input"
									min={minDate}
									value={state.selectedDate}
									onChange={(e) => dispatch({ type: "SET_DATE", date: e.target.value })}
								/>
							</div>
							{state.selectedDate && (
								<div>
									<p className="block text-sm font-medium text-[var(--text)] mb-2">
										{t("booking.availableSlots")}
									</p>
									{slots === undefined ? (
										<p className="text-sm text-[var(--text-muted)]">{t("booking.loadingSlots")}</p>
									) : slots.length === 0 ? (
										<p className="text-sm text-[var(--text-muted)]">{t("booking.noSlots")}</p>
									) : (
										<div className="grid grid-cols-4 gap-2">
											{slots.map((slot: string) => (
												<button
													key={slot}
													type="button"
													onClick={() => dispatch({ type: "SET_SLOT", slot })}
													className="py-2 px-1 text-xs rounded-lg border font-medium transition-all"
													style={{
														background: state.selectedSlot === slot ? "var(--gold)" : "var(--bg-input)",
														borderColor: state.selectedSlot === slot ? "var(--gold)" : "var(--border)",
														color: state.selectedSlot === slot ? "#000" : "var(--text)",
														cursor: "pointer",
													}}
												>
													{slot}
												</button>
											))}
										</div>
									)}
								</div>
							)}
							<div>
								<label
									className="block text-sm font-medium text-[var(--text)] mb-2"
									htmlFor="booking-notes"
								>
									{t("booking.notes")}
								</label>
								<textarea
									id="booking-notes"
									className="input resize-none"
									rows={3}
									placeholder={t("booking.notesPlaceholder")}
									value={state.notes}
									onChange={(e) => dispatch({ type: "SET_NOTES", notes: e.target.value })}
								/>
							</div>
						</div>
					)}

					{state.step === 4 && (
						<div className="space-y-4">
							<h3 className="font-semibold text-[var(--text)]">{t("booking.summary")}</h3>
							<div className="card p-4 space-y-3">
								{summaryRows.map(([label, val]) => (
									<div key={label} className="flex justify-between text-sm">
										<span className="text-[var(--text-muted)]">{label}</span>
										<span className="font-medium text-[var(--text)] text-right max-w-[60%]">{val}</span>
									</div>
								))}
								<hr className="divider" />
								<div className="flex justify-between font-bold">
									<span className="text-[var(--text)]">{t("booking.summaryFields.total")}</span>
									<span className="text-[var(--gold)] text-lg">{formatPrice(totalPrice)}</span>
								</div>
							</div>
							{state.notes && <p className="text-sm text-[var(--text-muted)]">{state.notes}</p>}
						</div>
					)}

					{state.step === 5 && (
						<div className="text-center py-8">
							<div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-500/15 border-2 border-green-500/30">
								<Check size={32} className="text-[var(--success)]" />
							</div>
							<h3 className="text-xl font-bold text-[var(--text)] mb-2">{t("booking.confirmed")}</h3>
							<p className="text-[var(--text-muted)] text-sm mb-6">
								{t("booking.confirmedMessage", {
									name: shop.name,
									date: formatDate(state.selectedDate),
									time: state.selectedSlot,
								})}
							</p>
							<button type="button" onClick={onClose} className="btn btn-primary">
								{t("common.done")}
							</button>
						</div>
					)}
				</div>

				{state.step < 5 && (
					<div className="flex gap-3 px-5 py-4 border-t border-[var(--border)]">
						{state.step > 1 && (
							<button
								type="button"
								onClick={() => dispatch({ type: "SET_STEP", step: (state.step - 1) as Step })}
								className="btn btn-secondary gap-1"
							>
								<ChevronLeft size={16} /> {t("common.back")}
							</button>
						)}
						<button
							type="button"
							onClick={() =>
								state.step === 4
									? void handleConfirm()
									: dispatch({ type: "SET_STEP", step: (state.step + 1) as Step })
							}
							disabled={!canNext || state.loading}
							className="btn btn-primary flex-1 justify-center gap-1"
						>
							{state.loading
								? t("booking.confirming")
								: state.step === 4
									? t("booking.confirmBooking")
									: t("common.next")}
							{state.step < 4 && !state.loading && <ChevronRight size={16} />}
						</button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
