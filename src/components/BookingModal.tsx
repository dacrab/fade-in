import { useAction, useMutation, useQuery } from "convex/react"
import { Check, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "#/hooks/useAuth"
import { useFormatters } from "#/hooks/useFormatters"
import { nextDayIso } from "#/lib/format"
import type { Barber, Barbershop, Service } from "#/types"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog"
import { showToast } from "./ui/Toast"

type Step = 1 | 2 | 3 | 4

type BookingPayload = {
	barbershopId: Id<"barbershops">
	barberId: Id<"barbers">
	serviceIds: Id<"services">[]
	date: string
	startTime: string
	endTime: string
	notes?: string
}

/** End time (HH:mm) for a slot lasting `durationMinutes`. */
function slotEndTime(startTime: string, durationMinutes: number): string {
	const [h, m] = startTime.split(":").map(Number)
	const end = (h ?? 0) * 60 + (m ?? 0) + durationMinutes
	return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: large linear JSX view component
export default function BookingModal({ shop, onClose }: { shop: Barbershop; onClose: () => void }) {
	const { t } = useTranslation()
	const f = useFormatters()
	const { user } = useAuth()
	const [step, setStep] = useState<Step>(1)
	const [selectedServices, setSelectedServices] = useState<Id<"services">[]>([])
	const [selectedBarber, setSelectedBarber] = useState<Id<"barbers"> | null>(null)
	const [selectedDate, setSelectedDate] = useState("")
	const [selectedSlot, setSelectedSlot] = useState("")
	const [notes, setNotes] = useState("")
	const [loading, setLoading] = useState(false)
	const [anyBarber, setAnyBarber] = useState(false)
	const [resolvedBarberId, setResolvedBarberId] = useState<Id<"barbers"> | null>(null)
	const [paymentMethod, setPaymentMethod] = useState<"onsite" | "online">("onsite")

	const services = useQuery(api.services.listByShop, { barbershopId: shop._id })
	const barbers = useQuery(api.barbers.listByShop, { barbershopId: shop._id })

	const selectedServiceDocs =
		services?.filter((s: Doc<"services">) => selectedServices.includes(s._id)) ?? []
	const totalDuration =
		selectedServiceDocs.reduce((acc: number, s: Doc<"services">) => acc + s.durationMinutes, 0) || 30
	const totalPrice = selectedServiceDocs.reduce(
		(acc: number, s: Doc<"services">) => acc + s.price,
		0,
	)

	const slots = useQuery(
		api.appointments.getAvailableSlots,
		selectedBarber && selectedDate && !anyBarber
			? {
					barbershopId: shop._id,
					barberId: selectedBarber,
					date: selectedDate,
					durationMinutes: totalDuration,
				}
			: "skip",
	)

	const shopSlots = useQuery(
		api.appointments.getAvailableSlotsForShop,
		anyBarber && selectedDate
			? {
					barbershopId: shop._id,
					date: selectedDate,
					durationMinutes: totalDuration,
				}
			: "skip",
	)

	const createCheckout = useAction(api.payments.createCheckoutSession)
	const createAppointment = useMutation(api.appointments.create)

	const minDate = nextDayIso()

	const toggleService = (id: Id<"services">) =>
		setSelectedServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))

	const pickDate = (date: string) => {
		setSelectedDate(date)
		setSelectedSlot("")
		setResolvedBarberId(null)
	}

	/** Persist the booking via the chosen payment path, returning which path ran. */
	const submitBooking = async (booking: BookingPayload): Promise<"online" | "onsite" | "failed"> => {
		if (paymentMethod === "online") {
			const result = await createCheckout(booking)
			if (!result.url) return "failed"
			window.location.href = result.url
			return "online"
		}
		await createAppointment(booking)
		return "onsite"
	}

	const handleConfirm = async () => {
		if (!user) {
			showToast(t("booking.signInRequired"), "error")
			return
		}
		const barberId = anyBarber ? resolvedBarberId : selectedBarber
		if (!(barberId && selectedDate && selectedSlot)) return
		setLoading(true)
		try {
			const outcome = await submitBooking({
				barbershopId: shop._id,
				barberId,
				serviceIds: selectedServices,
				date: selectedDate,
				startTime: selectedSlot,
				endTime: slotEndTime(selectedSlot, totalDuration),
				notes: notes || undefined,
			})
			if (outcome === "failed") showToast(t("booking.failed"), "error")
			if (outcome === "onsite") {
				showToast(t("booking.booked"), "success")
				onClose()
			}
		} catch {
			showToast(t("booking.failed"), "error")
		} finally {
			setLoading(false)
		}
	}

	const stepKeys = ["services", "barber", "date", "confirm"] as const
	const stepLabels = stepKeys.map((k) => t(`booking.steps.${k}`))
	const canNext =
		(step === 1 && selectedServices.length > 0) ||
		(step === 2 && (selectedBarber !== null || anyBarber)) ||
		(step === 3 &&
			selectedDate !== "" &&
			selectedSlot !== "" &&
			(anyBarber ? resolvedBarberId !== null : selectedBarber !== null)) ||
		step === 4

	const selectedBarberDoc = barbers?.find((b: Doc<"barbers">) => b._id === selectedBarber)

	const summaryRows: [string, string][] = [
		[t("booking.summaryFields.shop"), shop.name],
		[
			t("booking.summaryFields.services"),
			selectedServiceDocs.map((s: Doc<"services">) => s.name).join(", "),
		],
		[
			t("booking.summaryFields.barber"),
			anyBarber
				? (barbers?.find((b: Doc<"barbers">) => b._id === resolvedBarberId)?.name ??
					t("booking.anyBarber"))
				: (selectedBarberDoc?.name ?? "—"),
		],
		[t("booking.summaryFields.date"), f.formatDate(selectedDate)],
		[t("booking.summaryFields.time"), selectedSlot],
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
						{t("booking.step", { current: step, total: 4 })} — {stepLabels[step - 1]}
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center justify-center px-5 py-4 gap-3">
					{stepLabels.map((label, i) => (
						<div
							key={label}
							className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-300 ${i + 1 <= step ? "bg-(--gold) text-white" : "bg-(--bg-input) text-(--text-subtle)"}`}
						>
							{i + 1 < step ? <Check size={14} /> : i + 1}
						</div>
					))}
				</div>

				<div className="px-6 pb-2 max-h-[55vh] overflow-y-auto">
					{step === 1 && (
						<div className="space-y-3">
							<p className="muted-sm mb-4">{t("booking.selectServices")}</p>
							{!services ? (
								<p className="subtle-sm">{t("common.loading")}</p>
							) : services.length === 0 ? (
								<p className="subtle-sm">{t("booking.noServices")}</p>
							) : (
								services.map((svc: Service) => {
									const selected = selectedServices.includes(svc._id)
									return (
										<button
											key={svc._id}
											type="button"
											onClick={() => toggleService(svc._id)}
											className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer ${selected ? "bg-(--gold)/5 border-(--gold)/40" : "bg-(--bg-card) border-(--border) hover:border-(--border-hover)"}`}
										>
											<div
												className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${selected ? "bg-(--gold)" : "border-2 border-(--border)"}`}
											>
												{selected && <Check size={12} className="text-(--bg-card)" />}
											</div>
											<div className="flex-1 min-w-0">
												<div className="strong-sm">{svc.name}</div>
												<div className="field-hint">
													{t("booking.duration", { minutes: svc.durationMinutes })}
												</div>
											</div>
											<div className="font-semibold text-sm text-(--gold)">{f.formatPrice(svc.price)}</div>
										</button>
									)
								})
							)}
						</div>
					)}

					{step === 2 && (
						<div className="space-y-3">
							<p className="muted-sm mb-4">{t("booking.chooseBarber")}</p>
							{!barbers ? (
								<p className="subtle-sm">{t("common.loading")}</p>
							) : barbers.length === 0 ? (
								<p className="subtle-sm">{t("booking.noBarbers")}</p>
							) : (
								<>
									<button
										type="button"
										onClick={() => {
											setAnyBarber(true)
											setSelectedBarber(null)
											setSelectedSlot("")
											setResolvedBarberId(null)
										}}
										className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer ${anyBarber ? "bg-(--gold)/5 border-(--gold)/40" : "bg-(--bg-card) border-(--border) hover:border-(--border-hover)"}`}
									>
										<div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-(--gold)/10 text-(--gold)">
											<Users size={18} />
										</div>
										<div className="flex-1">
											<div className="strong-sm">{t("booking.anyBarber")}</div>
										</div>
										{anyBarber && (
											<div className="w-6 h-6 rounded-full flex items-center justify-center bg-(--gold)">
												<Check size={14} className="text-(--bg-card)" />
											</div>
										)}
									</button>
									{barbers.map((b: Barber) => {
										const selected = !anyBarber && selectedBarber === b._id
										return (
											<button
												key={b._id}
												type="button"
												onClick={() => {
													setAnyBarber(false)
													setSelectedBarber(b._id)
													setSelectedSlot("")
													setResolvedBarberId(b._id)
												}}
												className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer ${selected ? "bg-(--gold)/5 border-(--gold)/40" : "bg-(--bg-card) border-(--border) hover:border-(--border-hover)"}`}
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
													<div className="strong-sm">{b.name}</div>
													{b.specializations.length > 0 && (
														<div className="field-hint">{b.specializations.join(", ")}</div>
													)}
												</div>
												{selected && (
													<div className="w-6 h-6 rounded-full flex items-center justify-center bg-(--gold)">
														<Check size={14} className="text-(--bg-card)" />
													</div>
												)}
											</button>
										)
									})}
								</>
							)}
						</div>
					)}

					{step === 3 && (
						<div className="space-y-5">
							<div>
								<label className="block strong-sm mb-2" htmlFor="booking-date">
									{t("booking.pickDate")}
								</label>
								<input
									id="booking-date"
									type="date"
									className="input"
									min={minDate}
									value={selectedDate}
									onChange={(e) => pickDate(e.target.value)}
								/>
							</div>
							{selectedDate && (
								<div>
									<p className="block strong-sm mb-3">{t("booking.availableSlots")}</p>
									{anyBarber ? (
										shopSlots === undefined ? (
											<p className="subtle-sm">{t("booking.loadingSlots")}</p>
										) : shopSlots.length === 0 ? (
											<p className="subtle-sm">{t("booking.noSlots")}</p>
										) : (
											<div className="grid grid-cols-4 gap-2">
												{shopSlots.map((entry: { startTime: string; barberId: Id<"barbers"> }) => (
													<button
														key={entry.startTime}
														type="button"
														onClick={() => {
															setSelectedSlot(entry.startTime)
															setResolvedBarberId(entry.barberId)
														}}
														className={`py-2.5 px-2 text-xs rounded-full font-medium transition-all duration-200 border cursor-pointer ${selectedSlot === entry.startTime ? "bg-(--gold) border-(--gold) text-white" : "bg-(--bg-card) border-(--border) text-(--text) hover:border-(--gold)/40"}`}
													>
														{entry.startTime}
													</button>
												))}
											</div>
										)
									) : slots === undefined ? (
										<p className="subtle-sm">{t("booking.loadingSlots")}</p>
									) : slots.length === 0 ? (
										<p className="subtle-sm">{t("booking.noSlots")}</p>
									) : (
										<div className="grid grid-cols-4 gap-2">
											{slots.map((slot: string) => (
												<button
													key={slot}
													type="button"
													onClick={() => setSelectedSlot(slot)}
													className={`py-2.5 px-2 text-xs rounded-full font-medium transition-all duration-200 border cursor-pointer ${selectedSlot === slot ? "bg-(--gold) border-(--gold) text-white" : "bg-(--bg-card) border-(--border) text-(--text) hover:border-(--gold)/40"}`}
												>
													{slot}
												</button>
											))}
										</div>
									)}
								</div>
							)}
							<div>
								<label className="block strong-sm mb-2" htmlFor="booking-notes">
									{t("booking.notes")}
								</label>
								<textarea
									id="booking-notes"
									className="input resize-none"
									rows={3}
									placeholder={t("booking.notesPlaceholder")}
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>
						</div>
					)}

					{step === 4 && (
						<div className="space-y-5">
							<h3 className="font-semibold text-(--text)">{t("booking.summary")}</h3>
							<div className="rounded-xl p-5 space-y-3 bg-(--bg-card) border border-(--border)">
								{summaryRows.map(([label, val]) => (
									<div key={label} className="flex justify-between text-sm">
										<span className="text-(--text-muted)">{label}</span>
										<span className="font-medium text-(--text) text-right max-w-[60%]">{val}</span>
									</div>
								))}
								<div className="my-3 h-px bg-(--bg-input)" />
								<div className="flex justify-between font-bold">
									<span className="text-(--text)">{t("booking.summaryFields.total")}</span>
									<span className="text-lg text-(--gold)">{f.formatPrice(totalPrice)}</span>
								</div>
							</div>
							{notes && <p className="muted-sm">{notes}</p>}
							<div>
								<p className="block strong-sm mb-2">{t("booking.paymentMethod")}</p>
								<div className="grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() => setPaymentMethod("onsite")}
										className={`py-2.5 px-3 text-sm rounded-lg font-medium transition-all duration-200 border cursor-pointer ${paymentMethod === "onsite" ? "bg-(--gold)/5 border-(--gold)/40 text-(--text)" : "bg-(--bg-card) border-(--border) text-(--text) hover:border-(--border-hover)"}`}
									>
										{t("booking.payAtShop")}
									</button>
									<button
										type="button"
										onClick={() => setPaymentMethod("online")}
										className={`py-2.5 px-3 text-sm rounded-lg font-medium transition-all duration-200 border cursor-pointer ${paymentMethod === "online" ? "bg-(--gold)/5 border-(--gold)/40 text-(--text)" : "bg-(--bg-card) border-(--border) text-(--text) hover:border-(--border-hover)"}`}
									>
										{t("booking.payOnline")}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex gap-3 px-6 py-5 border-t border-(--border)">
					{step > 1 && (
						<button
							type="button"
							onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
							className="rounded-lg px-5 py-2.5 text-sm font-medium border border-(--border) text-(--text) hover:bg-(--bg-input) transition-all duration-200 flex items-center gap-1 cursor-pointer"
						>
							<ChevronLeft size={16} /> {t("common.back")}
						</button>
					)}
					<button
						type="button"
						onClick={() =>
							step === 4 ? void handleConfirm() : setStep((s) => (s < 4 ? ((s + 1) as Step) : s))
						}
						disabled={!canNext || loading}
						className="rounded-lg flex-1 py-2.5 text-sm font-medium text-white transition-all duration-200 flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed bg-(--gold) hover:bg-(--gold-dark) cursor-pointer"
					>
						{loading
							? t("booking.confirming")
							: step === 4
								? t("booking.confirmBooking")
								: t("common.next")}
						{step < 4 && !loading && <ChevronRight size={16} />}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
