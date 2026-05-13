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

				{/* Step indicator dots */}
				<div className="flex items-center justify-center px-5 py-4 gap-3">
					{stepLabels.map((label, i) => (
						<div
							key={label}
							className="flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-300"
							style={{
								width: 28,
								height: 28,
								backgroundColor: i + 1 <= state.step ? "var(--gold)" : "#f0ebe5",
								color: i + 1 <= state.step ? "#fff" : "#9c8b7a",
							}}
						>
							{i + 1 < state.step ? <Check size={14} /> : i + 1}
						</div>
					))}
				</div>

				<div className="px-6 pb-2 max-h-[55vh] overflow-y-auto">
					{state.step === 1 && (
						<div className="space-y-3">
							<p className="text-sm text-(--text-muted) mb-4">{t("booking.selectServices")}</p>
							{!services ? (
								<p className="text-sm text-(--text-subtle)">{t("common.loading")}</p>
							) : services.length === 0 ? (
								<p className="text-sm text-(--text-subtle)">{t("booking.noServices")}</p>
							) : (
								services.map((svc: Service) => {
									const selected = state.selectedServices.includes(svc._id)
									return (
										<button
											key={svc._id}
											type="button"
											onClick={() => dispatch({ type: "TOGGLE_SERVICE", id: svc._id })}
											className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
												selected
													? "bg-(--gold)/5 border-(--gold)/40"
													: "bg-white border-(--border) hover:border-stone-300"
											}`}
										>
											<div
												className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
													selected ? "bg-(--gold)" : "border-2 border-stone-300"
												}`}
											>
												{selected && <Check size={12} color="#fff" />}
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-(--text) text-sm">{svc.name}</div>
												<div className="text-xs text-(--text-subtle) mt-0.5">{svc.durationMinutes} min</div>
											</div>
											<div className="font-semibold text-sm text-(--gold)">{formatPrice(svc.price)}</div>
										</button>
									)
								})
							)}
						</div>
					)}

					{state.step === 2 && (
						<div className="space-y-3">
							<p className="text-sm text-(--text-muted) mb-4">{t("booking.chooseBarber")}</p>
							{!barbers ? (
								<p className="text-sm text-(--text-subtle)">{t("common.loading")}</p>
							) : barbers.length === 0 ? (
								<p className="text-sm text-(--text-subtle)">{t("booking.noBarbers")}</p>
							) : (
								barbers.map((b: Barber) => {
									const selected = state.selectedBarber === b._id
									return (
										<button
											key={b._id}
											type="button"
											onClick={() => dispatch({ type: "SET_BARBER", id: b._id })}
											className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
												selected
													? "bg-(--gold)/5 border-(--gold)/40"
													: "bg-white border-(--border) hover:border-stone-300"
											}`}
										>
											<div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-(--gold)/10 text-(--gold)">
												{b.avatarUrl ? (
													<img
														src={b.avatarUrl}
														alt={b.name}
														className="w-full h-full object-cover rounded-full"
													/>
												) : (
													<span className="text-sm font-semibold">{b.name.charAt(0)}</span>
												)}
											</div>
											<div className="flex-1">
												<div className="font-medium text-(--text) text-sm">{b.name}</div>
												{b.specializations.length > 0 && (
													<div className="text-xs text-(--text-subtle) mt-0.5">
														{b.specializations.join(", ")}
													</div>
												)}
											</div>
											{selected && (
												<div className="w-6 h-6 rounded-full flex items-center justify-center bg-(--gold)">
													<Check size={14} color="#fff" />
												</div>
											)}
										</button>
									)
								})
							)}
						</div>
					)}

					{state.step === 3 && (
						<div className="space-y-5">
							<div>
								<label className="block text-sm font-medium text-stone-700 mb-2" htmlFor="booking-date">
									{t("booking.pickDate")}
								</label>
								<input
									id="booking-date"
									type="date"
									className="w-full rounded-lg border border-(--border) bg-white px-4 py-2.5 text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--gold)/30 focus:border-(--gold)"
									min={minDate}
									value={state.selectedDate}
									onChange={(e) => dispatch({ type: "SET_DATE", date: e.target.value })}
								/>
							</div>
							{state.selectedDate && (
								<div>
									<p className="block text-sm font-medium text-stone-700 mb-3">
										{t("booking.availableSlots")}
									</p>
									{slots === undefined ? (
										<p className="text-sm text-(--text-subtle)">{t("booking.loadingSlots")}</p>
									) : slots.length === 0 ? (
										<p className="text-sm text-(--text-subtle)">{t("booking.noSlots")}</p>
									) : (
										<div className="grid grid-cols-4 gap-2">
											{slots.map((slot: string) => (
												<button
													key={slot}
													type="button"
													onClick={() => dispatch({ type: "SET_SLOT", slot })}
													className={`py-2.5 px-2 text-xs rounded-full font-medium transition-all duration-200 border cursor-pointer ${
														state.selectedSlot === slot
															? "bg-(--gold) border-(--gold) text-white"
															: "bg-white border-(--border) text-stone-700 hover:border-(--gold)/40"
													}`}
												>
													{slot}
												</button>
											))}
										</div>
									)}
								</div>
							)}
							<div>
								<label className="block text-sm font-medium text-stone-700 mb-2" htmlFor="booking-notes">
									{t("booking.notes")}
								</label>
								<textarea
									id="booking-notes"
									className="w-full rounded-lg border border-(--border) bg-white px-4 py-2.5 text-sm text-(--text) placeholder:text-(--text-subtle) focus:outline-none focus:ring-2 focus:ring-(--gold)/30 focus:border-(--gold) resize-none"
									rows={3}
									placeholder={t("booking.notesPlaceholder")}
									value={state.notes}
									onChange={(e) => dispatch({ type: "SET_NOTES", notes: e.target.value })}
								/>
							</div>
						</div>
					)}

					{state.step === 4 && (
						<div className="space-y-5">
							<h3 className="font-semibold text-(--text)">{t("booking.summary")}</h3>
							<div className="rounded-xl p-5 space-y-3 bg-white border border-(--border)">
								{summaryRows.map(([label, val]) => (
									<div key={label} className="flex justify-between text-sm">
										<span className="text-(--text-muted)">{label}</span>
										<span className="font-medium text-(--text) text-right max-w-[60%]">{val}</span>
									</div>
								))}
								<div className="my-3 h-px bg-(--bg-input)" />
								<div className="flex justify-between font-bold">
									<span className="text-(--text)">{t("booking.summaryFields.total")}</span>
									<span className="text-lg text-(--gold)">{formatPrice(totalPrice)}</span>
								</div>
							</div>
							{state.notes && <p className="text-sm text-(--text-muted)">{state.notes}</p>}
						</div>
					)}

					{state.step === 5 && (
						<div className="text-center py-10">
							<div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-emerald-50 border-2 border-emerald-200">
								<Check size={32} className="text-emerald-500" />
							</div>
							<h3 className="text-xl font-bold text-(--text) mb-2">{t("booking.confirmed")}</h3>
							<p className="text-(--text-muted) text-sm mb-8">
								{t("booking.confirmedMessage", {
									name: shop.name,
									date: formatDate(state.selectedDate),
									time: state.selectedSlot,
								})}
							</p>
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-8 py-2.5 font-medium text-white text-sm transition-all duration-200 bg-(--gold) hover:bg-(--gold-dark) cursor-pointer"
							>
								{t("common.done")}
							</button>
						</div>
					)}
				</div>

				{state.step < 5 && (
					<div className="flex gap-3 px-6 py-5 border-t border-(--border)">
						{state.step > 1 && (
							<button
								type="button"
								onClick={() => dispatch({ type: "SET_STEP", step: (state.step - 1) as Step })}
								className="rounded-lg px-5 py-2.5 text-sm font-medium border border-(--border) text-stone-700 hover:bg-(--bg-card-hover) transition-all duration-200 flex items-center gap-1 cursor-pointer"
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
							className="rounded-lg flex-1 py-2.5 text-sm font-medium text-white transition-all duration-200 flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed bg-(--gold) hover:bg-(--gold-dark) cursor-pointer"
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
