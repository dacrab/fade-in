import { useAction, useQuery } from "convex/react"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "#/hooks/useAuth"
import { formatDate, formatPrice } from "#/lib/format"
import type { Barber, Barbershop, Service } from "#/types"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog"
import { showToast } from "./ui/Toast"

type Step = 1 | 2 | 3 | 4 | 5

function clampStep(n: number): Step {
	if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n
	return n < 1 ? 1 : 5
}

export default function BookingModal({ shop, onClose }: { shop: Barbershop; onClose: () => void }) {
	const { t } = useTranslation()
	const { user } = useAuth()
	const [step, setStep] = useState<Step>(1)
	const [selectedServices, setSelectedServices] = useState<Id<"services">[]>([])
	const [selectedBarber, setSelectedBarber] = useState<Id<"barbers"> | null>(null)
	const [selectedDate, setSelectedDate] = useState("")
	const [selectedSlot, setSelectedSlot] = useState("")
	const [notes, setNotes] = useState("")
	const [loading, setLoading] = useState(false)

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
		selectedBarber && selectedDate
			? {
					barbershopId: shop._id,
					barberId: selectedBarber,
					date: selectedDate,
					durationMinutes: totalDuration,
				}
			: "skip",
	)

	const createCheckout = useAction(api.payments.createCheckoutSession)

	const minDate = (() => {
		const d = new Date()
		d.setDate(d.getDate() + 1)
		return d.toISOString().split("T")[0]
	})()

	const toggleService = (id: Id<"services">) =>
		setSelectedServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))

	const pickDate = (date: string) => {
		setSelectedDate(date)
		setSelectedSlot("")
	}

	const handleConfirm = async () => {
		if (!user) {
			showToast(t("booking.signInRequired"), "error")
			return
		}
		if (!(selectedBarber && selectedDate && selectedSlot)) return
		setLoading(true)
		try {
			const [startH, startM] = selectedSlot.split(":").map(Number)
			const endMinutes = (startH ?? 0) * 60 + (startM ?? 0) + totalDuration
			const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
			const result = await createCheckout({
				barbershopId: shop._id,
				barberId: selectedBarber,
				serviceIds: selectedServices,
				date: selectedDate,
				startTime: selectedSlot,
				endTime,
				notes: notes || undefined,
			})
			if (result.url) window.location.href = result.url
			else showToast(t("booking.failed"), "error")
		} catch {
			showToast(t("booking.failed"), "error")
		} finally {
			setLoading(false)
		}
	}

	const stepKeys = ["services", "barber", "date", "confirm", "done"] as const
	const stepLabels = stepKeys.map((k) => t(`booking.steps.${k}`))
	const canNext =
		(step === 1 && selectedServices.length > 0) ||
		(step === 2 && selectedBarber !== null) ||
		(step === 3 && selectedDate !== "" && selectedSlot !== "") ||
		step === 4

	const selectedBarberDoc = barbers?.find((b: Doc<"barbers">) => b._id === selectedBarber)

	const summaryRows: [string, string][] = [
		[t("booking.summaryFields.shop"), shop.name],
		[
			t("booking.summaryFields.services"),
			selectedServiceDocs.map((s: Doc<"services">) => s.name).join(", "),
		],
		[t("booking.summaryFields.barber"), selectedBarberDoc?.name ?? "—"],
		[t("booking.summaryFields.date"), formatDate(selectedDate)],
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
						{t("booking.step", { current: step, total: 5 })} — {stepLabels[step - 1]}
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
							<p className="text-sm text-(--text-muted) mb-4">{t("booking.selectServices")}</p>
							{!services ? (
								<p className="text-sm text-(--text-subtle)">{t("common.loading")}</p>
							) : services.length === 0 ? (
								<p className="text-sm text-(--text-subtle)">{t("booking.noServices")}</p>
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

					{step === 2 && (
						<div className="space-y-3">
							<p className="text-sm text-(--text-muted) mb-4">{t("booking.chooseBarber")}</p>
							{!barbers ? (
								<p className="text-sm text-(--text-subtle)">{t("common.loading")}</p>
							) : barbers.length === 0 ? (
								<p className="text-sm text-(--text-subtle)">{t("booking.noBarbers")}</p>
							) : (
								barbers.map((b: Barber) => {
									const selected = selectedBarber === b._id
									return (
										<button
											key={b._id}
											type="button"
											onClick={() => setSelectedBarber(b._id)}
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
												<div className="font-medium text-(--text) text-sm">{b.name}</div>
												{b.specializations.length > 0 && (
													<div className="text-xs text-(--text-subtle) mt-0.5">
														{b.specializations.join(", ")}
													</div>
												)}
											</div>
											{selected && (
												<div className="w-6 h-6 rounded-full flex items-center justify-center bg-(--gold)">
													<Check size={14} className="text-(--bg-card)" />
												</div>
											)}
										</button>
									)
								})
							)}
						</div>
					)}

					{step === 3 && (
						<div className="space-y-5">
							<div>
								<label className="block text-sm font-medium text-(--text) mb-2" htmlFor="booking-date">
									{t("booking.pickDate")}
								</label>
								<input
									id="booking-date"
									type="date"
									className="w-full rounded-lg border border-(--border) bg-(--bg-card) px-4 py-2.5 text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--gold)/30 focus:border-(--gold)"
									min={minDate}
									value={selectedDate}
									onChange={(e) => pickDate(e.target.value)}
								/>
							</div>
							{selectedDate && (
								<div>
									<p className="block text-sm font-medium text-(--text) mb-3">
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
								<label className="block text-sm font-medium text-(--text) mb-2" htmlFor="booking-notes">
									{t("booking.notes")}
								</label>
								<textarea
									id="booking-notes"
									className="w-full rounded-lg border border-(--border) bg-(--bg-card) px-4 py-2.5 text-sm text-(--text) placeholder:text-(--text-subtle) focus:outline-none focus:ring-2 focus:ring-(--gold)/30 focus:border-(--gold) resize-none"
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
									<span className="text-lg text-(--gold)">{formatPrice(totalPrice)}</span>
								</div>
							</div>
							{notes && <p className="text-sm text-(--text-muted)">{notes}</p>}
						</div>
					)}

					{step === 5 && (
						<div className="text-center py-10">
							<div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-(--success)/10 border-2 border-(--success)/20">
								<Check size={32} className="text-(--success)" />
							</div>
							<h3 className="text-xl font-bold text-(--text) mb-2">{t("booking.confirmed")}</h3>
							<p className="text-(--text-muted) text-sm mb-8">
								{t("booking.confirmedMessage", {
									name: shop.name,
									date: formatDate(selectedDate),
									time: selectedSlot,
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

				{step < 5 && (
					<div className="flex gap-3 px-6 py-5 border-t border-(--border)">
						{step > 1 && (
							<button
								type="button"
								onClick={() => setStep(clampStep(step - 1))}
								className="rounded-lg px-5 py-2.5 text-sm font-medium border border-(--border) text-(--text) hover:bg-(--bg-input) transition-all duration-200 flex items-center gap-1 cursor-pointer"
							>
								<ChevronLeft size={16} /> {t("common.back")}
							</button>
						)}
						<button
							type="button"
							onClick={() => (step === 4 ? void handleConfirm() : setStep(clampStep(step + 1)))}
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
				)}
			</DialogContent>
		</Dialog>
	)
}
