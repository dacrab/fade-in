import { describe, expect, it } from "vitest"
import { capitalizeFirst, formatDateShort, formatPrice, formatTime, slugify } from "./format"

describe("formatPrice", () => {
	it("formats 100 cents as €1.00", () => {
		expect(formatPrice(100)).toBe("€1.00")
	})

	it("formats 1500 cents as €15.00", () => {
		expect(formatPrice(1500)).toBe("€15.00")
	})

	it("formats 0 cents as €0.00", () => {
		expect(formatPrice(0)).toBe("€0.00")
	})

	it("formats 50 cents as €0.50", () => {
		expect(formatPrice(50)).toBe("€0.50")
	})

	it("formats 99999 cents as €999.99", () => {
		expect(formatPrice(99999)).toBe("€999.99")
	})

	it("always starts with the euro sign", () => {
		expect(formatPrice(1)).toMatch(/^€/)
	})

	it("always produces two decimal places", () => {
		const result = formatPrice(200)
		// e.g. "€2.00" → after € there should be digits and a dot
		expect(result).toMatch(/^€\d+\.\d{2}$/)
	})
})

describe("formatTime", () => {
	it("converts midnight 00:00 → 12:00 AM", () => {
		expect(formatTime("00:00")).toBe("12:00 AM")
	})

	it("converts 01:00 → 1:00 AM", () => {
		expect(formatTime("01:00")).toBe("1:00 AM")
	})

	it("converts 09:30 → 9:30 AM", () => {
		expect(formatTime("09:30")).toBe("9:30 AM")
	})

	it("converts 11:59 → 11:59 AM", () => {
		expect(formatTime("11:59")).toBe("11:59 AM")
	})

	it("converts noon 12:00 → 12:00 PM", () => {
		expect(formatTime("12:00")).toBe("12:00 PM")
	})

	it("converts 12:01 → 12:01 PM", () => {
		expect(formatTime("12:01")).toBe("12:01 PM")
	})

	it("converts 14:45 → 2:45 PM", () => {
		expect(formatTime("14:45")).toBe("2:45 PM")
	})

	it("converts 23:59 → 11:59 PM", () => {
		expect(formatTime("23:59")).toBe("11:59 PM")
	})

})

describe("formatDateShort", () => {
	it("returns a non-empty string", () => {
		expect(formatDateShort("2026-04-03").length).toBeGreaterThan(0)
	})

	it("contains a numeric day component", () => {
		expect(formatDateShort("2026-04-15")).toMatch(/15/)
	})

	it("is consistent for the same input", () => {
		const a = formatDateShort("2026-01-01")
		const b = formatDateShort("2026-01-01")
		expect(a).toBe(b)
	})

	it("produces different output for different dates", () => {
		expect(formatDateShort("2026-01-01")).not.toBe(formatDateShort("2026-06-15"))
	})
})

describe("capitalizeFirst", () => {
	it("capitalizes the first letter of a lowercase word", () => {
		expect(capitalizeFirst("hello")).toBe("Hello")
	})

	it("leaves an already-capitalized word unchanged", () => {
		expect(capitalizeFirst("World")).toBe("World")
	})

	it("handles a single lowercase character", () => {
		expect(capitalizeFirst("a")).toBe("A")
	})

	it("handles an empty string", () => {
		expect(capitalizeFirst("")).toBe("")
	})

	it("only capitalizes the first character, not the rest", () => {
		expect(capitalizeFirst("hELLO")).toBe("HELLO")
	})

	it("handles strings with leading spaces", () => {
		// Space is not a letter; capitalizeFirst only uppercases index 0
		const result = capitalizeFirst(" hello")
		expect(result[0]).toBe(" ")
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
