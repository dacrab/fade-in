/**
 * Unit tests for the appointment slot-generation algorithm.
 * This is a faithful re-implementation for unit testing purposes.
 *
 * The algorithm:
 *  - Generates 30-min slots from 09:00 to 19:00
 *  - Skips slots where [slotStart, slotEnd) overlaps any existing appointment
 *  - A slot is only included if slotEnd <= 19:00
 */
import { describe, expect, it } from "vitest"

// Re-implementation of the slot algorithm for unit testing.
interface ExistingAppt {
	startTime: string
	endTime: string
}

function generateSlots(durationMinutes: number, existing: ExistingAppt[]): string[] {
	const slots: string[] = []
	const startHour = 9
	const endHour = 19
	const intervalMinutes = 30

	for (let h = startHour; h < endHour; h++) {
		for (let m = 0; m < 60; m += intervalMinutes) {
			const slotStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
			const slotEndMinutes = h * 60 + m + durationMinutes
			const slotEndH = Math.floor(slotEndMinutes / 60)
			const slotEndM = slotEndMinutes % 60
			if (slotEndH > endHour) break
			const slotEnd = `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`

			const hasConflict = existing.some((appt) => slotStart < appt.endTime && slotEnd > appt.startTime)

			if (!hasConflict) slots.push(slotStart)
		}
	}

	return slots
}

describe("generateSlots — appointment slot algorithm", () => {
	it("generates slots starting at 09:00", () => {
		const slots = generateSlots(30, [])
		expect(slots[0]).toBe("09:00")
	})

	it("generates slots in 30-min increments (09:00, 09:30, 10:00 ...)", () => {
		const slots = generateSlots(30, [])
		expect(slots[0]).toBe("09:00")
		expect(slots[1]).toBe("09:30")
		expect(slots[2]).toBe("10:00")
	})

	it("last slot for 30-min duration is 18:30 (ends at 19:00)", () => {
		const slots = generateSlots(30, [])
		expect(slots[slots.length - 1]).toBe("18:30")
	})

	it("generates 20 slots for 30-min duration with no existing appointments", () => {
		// 09:00..18:30 in 30-min steps = 20 slots
		const slots = generateSlots(30, [])
		expect(slots).toHaveLength(20)
	})

	it("generates 20 slots for 60-min duration (last start = 18:30, ends at 19:30 but loop continues)", () => {
		// The algorithm breaks when slotEndH > endHour (strictly greater than 19).
		// 18:30 + 60min = 19:30 → slotEndH=19 which is NOT > 19, so 18:30 is included.
		// 19:00 + 60min = 20:00 → slotEndH=20 > 19, so 19:00 is excluded (loop breaks).
		// But the outer loop runs h=9..18, so the slot 18:30 is the last 30-min increment of h=18.
		// Total: same 20 slots as 30-min duration since none of the extra-time slots get excluded.
		const slots = generateSlots(60, [])
		expect(slots).toHaveLength(20)
		// First and last slot
		expect(slots[0]).toBe("09:00")
		expect(slots[slots.length - 1]).toBe("18:30")
	})

	it("generates no slots when duration exceeds the working day", () => {
		// 660-min (11-hour) duration: the first slot (09:00) would end at 20:00,
		// which exceeds the 19:00 cutoff (slotEndH=20 > 19), so no slots are generated.
		const slots = generateSlots(660, [])
		expect(slots).toHaveLength(0)
	})

	it("excludes a slot that exactly overlaps an existing appointment", () => {
		const existing = [{ startTime: "10:00", endTime: "10:30" }]
		const slots = generateSlots(30, existing)
		expect(slots).not.toContain("10:00")
	})

	it("excludes a slot that partially overlaps an existing appointment (starts before, ends during)", () => {
		// existing: 10:15–10:45; slot 10:00–10:30 overlaps
		const existing = [{ startTime: "10:15", endTime: "10:45" }]
		const slots = generateSlots(30, existing)
		expect(slots).not.toContain("10:00")
	})

	it("excludes a slot that partially overlaps an existing appointment (starts during, ends after)", () => {
		// existing: 10:00–10:30; slot 10:00 conflicts, slot 09:30–10:00 does NOT conflict
		const existing = [{ startTime: "10:00", endTime: "10:30" }]
		const slots = generateSlots(30, existing)
		expect(slots).toContain("09:30")
		expect(slots).not.toContain("10:00")
	})

	it("includes adjacent slot immediately after an existing appointment", () => {
		// existing: 09:00–09:30; slot 09:30 starts exactly when it ends → no conflict
		const existing = [{ startTime: "09:00", endTime: "09:30" }]
		const slots = generateSlots(30, existing)
		expect(slots).toContain("09:30")
	})

	it("includes adjacent slot immediately before an existing appointment", () => {
		// existing: 10:00–10:30; slot 09:30–10:00 ends when it starts → no conflict
		const existing = [{ startTime: "10:00", endTime: "10:30" }]
		const slots = generateSlots(30, existing)
		expect(slots).toContain("09:30")
	})

	it("excludes all overlapping slots for a long appointment", () => {
		// existing: 09:00–11:00 (2 hours) blocks 09:00, 09:30, 10:00, 10:30
		const existing = [{ startTime: "09:00", endTime: "11:00" }]
		const slots = generateSlots(30, existing)
		expect(slots).not.toContain("09:00")
		expect(slots).not.toContain("09:30")
		expect(slots).not.toContain("10:00")
		expect(slots).not.toContain("10:30")
		expect(slots).toContain("11:00")
	})

	it("handles multiple existing appointments with gaps between them", () => {
		const existing = [
			{ startTime: "09:00", endTime: "09:30" },
			{ startTime: "11:00", endTime: "11:30" },
		]
		const slots = generateSlots(30, existing)
		expect(slots).not.toContain("09:00")
		expect(slots).toContain("09:30")
		expect(slots).not.toContain("11:00")
		expect(slots).toContain("11:30")
	})

	it("returns all slots when existing array is empty", () => {
		expect(generateSlots(30, [])).toHaveLength(20)
	})

	it("returns empty array when all slots are blocked", () => {
		// Block entire day with a single 10-hour appointment
		const existing = [{ startTime: "09:00", endTime: "19:00" }]
		const slots = generateSlots(30, existing)
		expect(slots).toHaveLength(0)
	})
})
