import { describe, expect, it } from "vitest"
import { cn } from "./cn"

describe("cn — className utility", () => {
	it.each([
		[["foo", "bar"], "foo bar"],
		[["foo", false, "baz"], "foo baz"],
		[["foo", undefined, null, "bar"], "foo bar"],
	])("normalizes %j to %s", (inputs, expected) => {
		expect(cn(...inputs)).toBe(expected)
	})

	it("deduplicates conflicting Tailwind classes (last wins)", () => {
		expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
	})

	it("handles empty input", () => {
		expect(cn()).toBe("")
	})

	it("merges truthy keys from conditional objects", () => {
		expect(cn("a", { b: true, c: false })).toBe("a b")
	})

	it("flattens nested class arrays", () => {
		expect(cn(["x", "y"], "z")).toBe("x y z")
	})
})
