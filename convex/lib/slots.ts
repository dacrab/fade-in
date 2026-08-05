interface ExistingAppt {
	startTime: string
	endTime: string
}

const START_HOUR = 9
const END_HOUR = 19
const INTERVAL_MINUTES = 30
const CLOSING_MINUTES = END_HOUR * 60

export function generateSlots(durationMinutes: number, existing: ExistingAppt[]): string[] {
	const slots: string[] = []

	for (let h = START_HOUR; h < END_HOUR; h++) {
		for (let m = 0; m < 60; m += INTERVAL_MINUTES) {
			const slotStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
			const slotStartMinutes = h * 60 + m
			const slotEndMinutes = slotStartMinutes + durationMinutes
			if (slotEndMinutes > CLOSING_MINUTES) break
			const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, "0")}:${String(slotEndMinutes % 60).padStart(2, "0")}`
			const hasConflict = existing.some((a) => slotStart < a.endTime && slotEnd > a.startTime)
			if (!hasConflict) slots.push(slotStart)
		}
	}

	return slots
}
