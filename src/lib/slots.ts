export interface ExistingAppt {
	startTime: string
	endTime: string
}

const START_HOUR = 9
const END_HOUR = 19
const INTERVAL_MINUTES = 30

/**
 * Generates available appointment start times for a given duration,
 * excluding slots that overlap with existing appointments.
 * Slots run from 09:00 to 19:00 in 30-minute increments.
 * Uses half-open interval logic: slotStart < apptEnd && slotEnd > apptStart.
 */
export function generateSlots(durationMinutes: number, existing: ExistingAppt[]): string[] {
	const slots: string[] = []

	for (let h = START_HOUR; h < END_HOUR; h++) {
		for (let m = 0; m < 60; m += INTERVAL_MINUTES) {
			const slotStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
			const slotEndMinutes = h * 60 + m + durationMinutes
			const slotEndH = Math.floor(slotEndMinutes / 60)
			const slotEndM = slotEndMinutes % 60
			if (slotEndH > END_HOUR) break
			const slotEnd = `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`
			const hasConflict = existing.some((a) => slotStart < a.endTime && slotEnd > a.startTime)
			if (!hasConflict) slots.push(slotStart)
		}
	}

	return slots
}
