import { describe, expect, it } from "vitest"
import { cn } from "./cn"

describe("cn — className utility (clsx + tailwind-merge)", () => {
	it("merges two string class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar")
	})

	it("handles a single class name", () => {
		expect(cn("only")).toBe("only")
	})

	it("returns an empty string for no arguments", () => {
		expect(cn()).toBe("")
	})

	it("ignores false values", () => {
		expect(cn("base", false, "end")).toBe("base end")
	})

	it("ignores null values", () => {
		expect(cn("base", null, "end")).toBe("base end")
	})

	it("ignores undefined values", () => {
		expect(cn("base", undefined, "end")).toBe("base end")
	})

	it("ignores the number 0 (falsy)", () => {
		expect(cn("base", 0, "end")).toBe("base end")
	})

	it("includes keys whose value is true", () => {
		expect(cn({ active: true, hidden: false })).toBe("active")
	})

	it("combines object and string inputs", () => {
		expect(cn("base", { active: true })).toBe("base active")
	})

	it("flattens array inputs", () => {
		expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz")
	})

	it("flattens nested arrays", () => {
		expect(cn([["a", "b"], "c"])).toBe("a b c")
	})

	it("resolves conflicting padding classes — last wins", () => {
		expect(cn("p-4", "p-2")).toBe("p-2")
	})

	it("resolves conflicting text-size classes — last wins", () => {
		expect(cn("text-sm", "text-lg")).toBe("text-lg")
	})

	it("resolves conflicting background colours — last wins", () => {
		expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500")
	})

	it("does NOT merge non-conflicting classes", () => {
		const result = cn("flex", "items-center", "gap-4")
		expect(result).toContain("flex")
		expect(result).toContain("items-center")
		expect(result).toContain("gap-4")
	})

	it("preserves non-conflicting modifiers", () => {
		// hover and base padding don't conflict
		expect(cn("p-2", "hover:p-4")).toBe("p-2 hover:p-4")
	})

	it("handles the pattern used for variant buttons", () => {
		const isPrimary = true
		const result = cn("btn", isPrimary ? "btn-primary" : "btn-ghost")
		expect(result).toBe("btn btn-primary")
	})

	it("handles dynamic active state class", () => {
		const isActive = false
		expect(cn("nav-link", { active: isActive })).toBe("nav-link")
	})
})
