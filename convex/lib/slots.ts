interface ExistingAppt {
	startTime: string
	endTime: string
}

/**
 * Slot-generation config. Tune these to change the shop's operating hours
 * and slot resolution across all shops.
 */
export const SLOT_CONFIG = {
	/** First slot can start at this hour (inclusive). */
	START_HOUR: 9,
	/** No slots start at or after this hour. */
	END_HOUR: 19,
	/** Granularity of slot start times, in minutes. */
	INTERVAL_MINUTES: 30,
} as const

const CLOSING_MINUTES = SLOT_CONFIG.END_HOUR * 60

export function generateSlots(durationMinutes: number, existing: ExistingAppt[]): string[] {
	const slots: string[] = []

	for (let h = SLOT_CONFIG.START_HOUR; h < SLOT_CONFIG.END_HOUR; h++) {
		for (let m = 0; m < 60; m += SLOT_CONFIG.INTERVAL_MINUTES) {
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
