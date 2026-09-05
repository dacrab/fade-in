interface ExistingAppt {
	startTime: string
	endTime: string
}

/**
 * Slot-generation config. Tune these to change the default operating hours
 * and slot resolution across all shops (shops may override via workingHours).
 */
export const SLOT_CONFIG = {
	/** First slot can start at this hour (inclusive). */
	START_HOUR: 9,
	/** No slots start at or after this hour. */
	END_HOUR: 19,
	/** Granularity of slot start times, in minutes. */
	INTERVAL_MINUTES: 30,
} as const

export interface DayWindow {
	startMinute: number
	endMinute: number
}

/**
 * Default operating window derived from SLOT_CONFIG — used both by slot
 * generation and by server-side bounds checks so they can't diverge.
 */
export const DEFAULT_WINDOW: DayWindow = {
	startMinute: SLOT_CONFIG.START_HOUR * 60,
	endMinute: SLOT_CONFIG.END_HOUR * 60,
}

export function timeToMinutes(time: string): number {
	const [h, m] = time.split(":").map(Number)
	return (h ?? 0) * 60 + (m ?? 0)
}

const DAY_NAMES = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const

export type DayName = (typeof DAY_NAMES)[number]

/** Weekday name ("monday".."sunday") for a YYYY-MM-DD date, parsed as local time. */
export function weekdayOf(dateStr: string): DayName {
	const [y, m, d] = dateStr.split("-").map(Number)
	return DAY_NAMES[new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getDay()] ?? "monday"
}

function toTime(minutes: number): string {
	return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
}

export function generateSlots(
	durationMinutes: number,
	existing: ExistingAppt[],
	window: DayWindow = DEFAULT_WINDOW,
): string[] {
	const slots: string[] = []

	for (
		let start = window.startMinute;
		start < window.endMinute;
		start += SLOT_CONFIG.INTERVAL_MINUTES
	) {
		const end = start + durationMinutes
		if (end > window.endMinute) break
		const hasConflict = existing.some((a) => toTime(start) < a.endTime && toTime(end) > a.startTime)
		if (!hasConflict) slots.push(toTime(start))
	}

	return slots
}
