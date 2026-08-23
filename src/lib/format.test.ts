import { describe, expect, it } from "vitest"
import {
	formatDate,
	formatDateShort,
	formatPrice,
	formatRelative,
	nextDayIso,
	slugify,
	todayIso,
} from "./format"

describe("formatPrice", () => {
	it.each([
		[0, "€0.00"],
		[50, "€0.50"],
		[100, "€1.00"],
		[1500, "€15.00"],
		[99999, "€999.99"],
		[123456, "€1234.56"],
	])("formats %i cents as %s", (cents, expected) => {
		expect(formatPrice(cents)).toBe(expected)
	})

	it.each([0, 1, 50, 200, 99999, 123456])(
		"formats %i cents with a euro sign and exactly two decimals",
		(cents) => {
			expect(formatPrice(cents)).toMatch(/^€\d+\.\d{2}$/)
		},
	)
})

describe("formatDateShort", () => {
	it.each([
		["2026-04-15", "15 Apr 2026"],
		["2026-01-01", "1 Jan 2026"],
		["2026-12-31", "31 Dec 2026"],
	])("formats %s as %s", (input, expected) => {
		expect(formatDateShort(input)).toBe(expected)
	})

	it("matches the expected day-month-year structure", () => {
		expect(formatDateShort("2026-04-15")).toMatch(/^\d{1,2} [A-Za-z]{3} \d{4}$/)
	})

	it("produces different output for different dates", () => {
		expect(formatDateShort("2026-01-01")).not.toBe(formatDateShort("2026-06-15"))
	})
})

describe("formatDate", () => {
	it.each([
		["2026-04-15", "Wednesday, 15 April 2026"],
		["2026-01-01", "Thursday, 1 January 2026"],
		["2026-12-31", "Thursday, 31 December 2026"],
	])("formats %s as %s", (input, expected) => {
		expect(formatDate(input)).toBe(expected)
	})
})

describe("formatRelative", () => {
	it("describes a past timestamp with 'ago'", () => {
		const past = Date.now() - 3 * 60 * 60 * 1000
		expect(formatRelative(past)).toMatch(/ago$/)
	})

	it("describes a future timestamp with 'in'", () => {
		const future = Date.now() + 3 * 60 * 60 * 1000
		expect(formatRelative(future)).toMatch(/^in /)
	})
})

describe("todayIso / nextDayIso", () => {
	it("returns ISO dates in the expected shape", () => {
		expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
		expect(nextDayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
	})

	it("nextDayIso is exactly one day after todayIso", () => {
		const today = todayIso()
		const next = nextDayIso()
		const todayMs = new Date(`${today}T00:00:00`).getTime()
		const nextMs = new Date(`${next}T00:00:00`).getTime()
		expect(nextMs - todayMs).toBe(24 * 60 * 60 * 1000)
	})
})

describe("slugify", () => {
	it("lowercases and replaces spaces with hyphens", () => {
		expect(slugify("Hello World")).toBe("hello-world")
	})

	it("removes common special characters", () => {
		expect(slugify("Barbershop #1!")).toBe("barbershop-1")
	})

	it("collapses multiple consecutive spaces into one hyphen", () => {
		expect(slugify("a  b  c")).toBe("a-b-c")
	})

	it("trims leading and trailing hyphens", () => {
		expect(slugify("--test--")).toBe("test")
	})

	it("handles strings that are already slug-like", () => {
		expect(slugify("already-slugged")).toBe("already-slugged")
	})

	it("handles a single word with no special chars", () => {
		expect(slugify("Athens")).toBe("athens")
	})
})
