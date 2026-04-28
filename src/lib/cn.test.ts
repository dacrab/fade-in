import { describe, expect, it } from "vitest"
import { cn } from "./cn"

describe("cn — className utility", () => {
	it("merges multiple class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar")
	})

	it("handles conditional classes", () => {
		expect(cn("foo", false, "baz")).toBe("foo baz")
	})

	it("deduplicates Tailwind classes", () => {
		expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
	})

	it("handles empty input", () => {
		expect(cn()).toBe("")
	})

	it("handles undefined and null", () => {
		expect(cn("foo", undefined, null, "bar")).toBe("foo bar")
	})

	it("merges conflicting Tailwind classes correctly", () => {
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
	})
})
