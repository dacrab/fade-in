/**
 * Unit tests for the appointment slot-generation algorithm.
 * Tests the shared generateSlots function from src/lib/slots.ts,
 * which is also used directly by the Convex appointments query.
 */
import { describe, expect, it } from "vitest"
import { generateSlots } from "./slots"

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
		expect(generateSlots(30, [])).toHaveLength(20)
	})

	it("generates 20 slots for 60-min duration", () => {
		const slots = generateSlots(60, [])
		expect(slots).toHaveLength(20)
		expect(slots[0]).toBe("09:00")
		expect(slots[slots.length - 1]).toBe("18:30")
	})

	it("generates no slots when duration exceeds the working day", () => {
		expect(generateSlots(660, [])).toHaveLength(0)
	})

	it("excludes an exactly-overlapping slot but keeps the adjacent free slot before it", () => {
		const existing = [{ startTime: "10:00", endTime: "10:30" }]
		const slots = generateSlots(30, existing)
		expect(slots).toContain("09:30")
		expect(slots).not.toContain("10:00")
	})

	it("excludes a slot that partially overlaps (starts before, ends during)", () => {
		const existing = [{ startTime: "10:15", endTime: "10:45" }]
		expect(generateSlots(30, existing)).not.toContain("10:00")
	})

	it("includes adjacent slot immediately after an existing appointment", () => {
		const existing = [{ startTime: "09:00", endTime: "09:30" }]
		expect(generateSlots(30, existing)).toContain("09:30")
	})

	it("includes adjacent slot immediately before an existing appointment", () => {
		const existing = [{ startTime: "10:00", endTime: "10:30" }]
		expect(generateSlots(30, existing)).toContain("09:30")
	})

	it("excludes all overlapping slots for a long appointment", () => {
		const existing = [{ startTime: "09:00", endTime: "11:00" }]
		const slots = generateSlots(30, existing)
		for (const blocked of ["09:00", "09:30", "10:00", "10:30"]) {
			expect(slots).not.toContain(blocked)
		}
		expect(slots).toContain("11:00")
	})

	it("handles multiple existing appointments with gaps", () => {
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

	it("returns empty array when all slots are blocked", () => {
		const existing = [{ startTime: "09:00", endTime: "19:00" }]
		expect(generateSlots(30, existing)).toHaveLength(0)
	})

	it("handles back-to-back appointments correctly", () => {
		const existing = [
			{ startTime: "09:00", endTime: "09:30" },
			{ startTime: "09:30", endTime: "10:00" },
			{ startTime: "10:00", endTime: "10:30" },
		]
		const slots = generateSlots(30, existing)
		expect(slots).not.toContain("09:00")
		expect(slots).not.toContain("09:30")
		expect(slots).not.toContain("10:00")
		expect(slots).toContain("10:30")
	})

	it("handles 90-minute duration correctly", () => {
		const slots = generateSlots(90, [])
		expect(slots[0]).toBe("09:00")
		expect(slots[slots.length - 1]).toBe("18:00") // 18:00 + 90min = 19:30, exceeds 19:00
	})

	it("handles appointments that start before working hours", () => {
		const existing = [{ startTime: "08:00", endTime: "09:30" }]
		const slots = generateSlots(30, existing)
		expect(slots).not.toContain("09:00")
		expect(slots).toContain("09:30")
	})

	it("handles appointments that end after working hours", () => {
		const existing = [{ startTime: "18:30", endTime: "20:00" }]
		const slots = generateSlots(30, existing)
		expect(slots).not.toContain("18:30")
		expect(slots).toContain("18:00")
	})
})
