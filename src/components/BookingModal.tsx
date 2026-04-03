import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { ChevronRight, ChevronLeft, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/Dialog"
import { useAuth } from "../hooks/useAuth"
import { showToast } from "./ui/Toast"
import { formatPrice, formatDate } from "../lib/format"
import type { Barbershop, Barber, Service } from "../types"
import type { Doc, Id } from "../../convex/_generated/dataModel"

interface Props {
	shop: Barbershop
	onClose: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

export default function BookingModal({ shop, onClose }: Props) {
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

	const totalDuration =
		services
			?.filter((s: Doc<"services">) => selectedServices.includes(s._id))
			.reduce((acc: number, s: Doc<"services">) => acc + s.durationMinutes, 0) ?? 30

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

	const totalPrice =
		services
			?.filter((s: Doc<"services">) => selectedServices.includes(s._id))
			.reduce((acc: number, s: Doc<"services">) => acc + s.price, 0) ?? 0

	const createAppointment = useMutation(api.appointments.create)

	const toggleService = (id: Id<"services">) => {
		setSelectedServices((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
		)
	}

	const getMinDate = () => {
		const d = new Date()
		d.setDate(d.getDate() + 1)
		return d.toISOString().split("T")[0]
	}

	const handleConfirm = async () => {
		if (!user) { showToast("Please sign in to book", "error"); return }
		if (!selectedBarber || !selectedDate || !selectedSlot) return
		setLoading(true)
		try {
			const [startH, startM] = selectedSlot.split(":").map(Number)
			const endMinutes = (startH ?? 0) * 60 + (startM ?? 0) + totalDuration
			const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
			await createAppointment({
				customerId: user.id as Id<"users">,
				barbershopId: shop._id,
				barberId: selectedBarber,
				serviceIds: selectedServices,
				date: selectedDate,
				startTime: selectedSlot,
				endTime,
				totalPrice,
				notes: notes || undefined,
			})
			setStep(5)
		} catch {
			showToast("Booking failed. Please try again.", "error")
		} finally {
			setLoading(false)
		}
	}

	const steps = ["Services", "Barber", "Date", "Confirm", "Done"]
	const canNext =
		(step === 1 && selectedServices.length > 0) ||
		(step === 2 && selectedBarber !== null) ||
		(step === 3 && selectedDate !== "" && selectedSlot !== "") ||
		step === 4

	const selectedServiceDocs = services?.filter((s: Doc<"services">) => selectedServices.includes(s._id)) ?? []
	const selectedBarberDoc = barbers?.find((b: Doc<"barbers">) => b._id === selectedBarber)

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader onClose={onClose}>
					<DialogTitle>{shop.name}</DialogTitle>
					<DialogDescription>
						Step {step} of 5 — {steps[step - 1]}
					</DialogDescription>
				</DialogHeader>

				{/* Step indicators */}
				<div className="flex items-center px-5 py-3 gap-1 border-b border-[var(--border)]">
					{steps.map((s, i) => (
						<div key={s} className="flex items-center gap-1 flex-1">
							<div
								className={`step-dot flex-shrink-0 ${i + 1 < step ? "completed" : i + 1 === step ? "active" : ""}`}
							>
								{i + 1 < step ? <Check size={12} /> : i + 1}
							</div>
							{i < steps.length - 1 && (
								<div
									className="h-px flex-1"
									style={{ background: i + 1 < step ? "var(--success)" : "var(--border)" }}
								/>
							)}
						</div>
					))}
				</div>

				{/* Content */}
				<div className="p-5 overflow-y-auto" style={{ maxHeight: "55vh" }}>
					{/* Step 1: Services */}
					{step === 1 && (
						<div className="space-y-2">
							<p className="text-sm text-[var(--text-muted)] mb-3">Select one or more services</p>
							{!services ? (
								<p className="text-sm text-[var(--text-muted)]">Loading...</p>
							) : services.length === 0 ? (
								<p className="text-sm text-[var(--text-muted)]">No services available.</p>
							) : (
								services.map((svc: Service) => (
									<ServiceRow
										key={svc._id}
										svc={svc}
										selected={selectedServices.includes(svc._id)}
										onToggle={() => toggleService(svc._id)}
									/>
								))
							)}
						</div>
					)}

					{/* Step 2: Barber */}
					{step === 2 && (
						<div className="space-y-3">
							<p className="text-sm text-[var(--text-muted)] mb-3">Choose your barber</p>
							{!barbers ? (
								<p className="text-sm text-[var(--text-muted)]">Loading...</p>
							) : barbers.length === 0 ? (
								<p className="text-sm text-[var(--text-muted)]">No barbers available.</p>
							) : (
								barbers.map((b: Barber) => (
									<BarberRow
										key={b._id}
										barber={b}
										selected={selectedBarber === b._id}
										onSelect={() => setSelectedBarber(b._id)}
									/>
								))
							)}
						</div>
					)}

					{/* Step 3: Date & Time */}
					{step === 3 && (
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-[var(--text)] mb-2">
									Pick a date
								</label>
								<input
									type="date"
									className="input"
									min={getMinDate()}
									value={selectedDate}
									onChange={(e) => {
										setSelectedDate(e.target.value)
										setSelectedSlot("")
									}}
								/>
							</div>
							{selectedDate && (
								<div>
									<label className="block text-sm font-medium text-[var(--text)] mb-2">
										Available time slots
									</label>
									{slots === undefined ? (
										<p className="text-sm text-[var(--text-muted)]">Loading slots...</p>
									) : slots.length === 0 ? (
										<p className="text-sm text-[var(--text-muted)]">
											No slots available for this date.
										</p>
									) : (
										<div className="grid grid-cols-4 gap-2">
											{slots.map((slot: string) => (
												<button
													key={slot}
													type="button"
													onClick={() => setSelectedSlot(slot)}
													className="py-2 px-1 text-xs rounded-lg border font-medium transition-all"
													style={{
														background:
															selectedSlot === slot ? "var(--gold)" : "var(--bg-input)",
														borderColor:
															selectedSlot === slot ? "var(--gold)" : "var(--border)",
														color: selectedSlot === slot ? "#000" : "var(--text)",
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
								<label className="block text-sm font-medium text-[var(--text)] mb-2">
									Notes (optional)
								</label>
								<textarea
									className="input resize-none"
									rows={3}
									placeholder="Any special requests?"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>
						</div>
					)}

					{/* Step 4: Confirm */}
					{step === 4 && (
						<div className="space-y-4">
							<h3 className="font-semibold text-[var(--text)]">Booking summary</h3>
							<div className="card p-4 space-y-3">
								{(
									[
										["Shop", shop.name],
										["Services", selectedServiceDocs.map((s: Doc<"services">) => s.name).join(", ")],
										["Barber", selectedBarberDoc?.name ?? "—"],
										["Date", formatDate(selectedDate)],
										["Time", selectedSlot],
										["Duration", `${totalDuration} min`],
									] as [string, string][]
								).map(([label, val]) => (
									<div key={label} className="flex justify-between text-sm">
										<span className="text-[var(--text-muted)]">{label}</span>
										<span className="font-medium text-[var(--text)] text-right max-w-[60%]">
											{val}
										</span>
									</div>
								))}
								<hr className="divider" />
								<div className="flex justify-between font-bold">
									<span className="text-[var(--text)]">Total</span>
									<span className="text-[var(--gold)] text-lg">{formatPrice(totalPrice)}</span>
								</div>
							</div>
							{notes && <p className="text-sm text-[var(--text-muted)]">Notes: {notes}</p>}
						</div>
					)}

					{/* Step 5: Done */}
					{step === 5 && (
						<div className="text-center py-8">
							<div
								className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
								style={{
									background: "rgba(34,197,94,0.15)",
									border: "2px solid rgba(34,197,94,0.3)",
								}}
							>
								<Check size={32} className="text-[var(--success)]" />
							</div>
							<h3 className="text-xl font-bold text-[var(--text)] mb-2">Booking confirmed!</h3>
							<p className="text-[var(--text-muted)] text-sm mb-6">
								Your appointment at {shop.name} is confirmed for {formatDate(selectedDate)} at{" "}
								{selectedSlot}.
							</p>
							<button type="button" onClick={onClose} className="btn btn-primary">
								Done
							</button>
						</div>
					)}
				</div>

				{/* Footer */}
				{step < 5 && (
					<div className="flex gap-3 px-5 py-4 border-t border-[var(--border)]">
						{step > 1 && (
							<button
								type="button"
								onClick={() => setStep((s) => (s - 1) as Step)}
								className="btn btn-secondary gap-1"
							>
								<ChevronLeft size={16} /> Back
							</button>
						)}
						<button
							type="button"
							onClick={() =>
								step === 4 ? handleConfirm() : setStep((s) => (s + 1) as Step)
							}
							disabled={!canNext || loading}
							className="btn btn-primary flex-1 justify-center gap-1"
						>
							{loading ? "Confirming..." : step === 4 ? "Confirm booking" : "Next"}
							{step < 4 && !loading && <ChevronRight size={16} />}
						</button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ServiceRow({
	svc,
	selected,
	onToggle,
}: {
	svc: Service
	selected: boolean
	onToggle: () => void
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
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
}

function BarberRow({
	barber,
	selected,
	onSelect,
}: {
	barber: Barber
	selected: boolean
	onSelect: () => void
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
			style={{
				background: selected ? "rgba(245,158,11,0.08)" : "var(--bg-input)",
				borderColor: selected ? "rgba(245,158,11,0.4)" : "var(--border)",
				cursor: "pointer",
			}}
		>
			<div
				className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-[var(--gold)]"
				style={{ background: "rgba(245,158,11,0.1)" }}
			>
				{barber.avatarUrl ? (
					<img src={barber.avatarUrl} alt={barber.name} className="w-full h-full object-cover" />
				) : (
					barber.name.charAt(0)
				)}
			</div>
			<div className="flex-1">
				<div className="font-medium text-[var(--text)] text-sm">{barber.name}</div>
				{barber.specializations.length > 0 && (
					<div className="text-xs text-[var(--text-muted)]">
						{barber.specializations.join(", ")}
					</div>
				)}
			</div>
			{selected && <Check size={16} className="text-[var(--gold)]" />}
		</button>
	)
}
