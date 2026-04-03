import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ShopCardSkeleton, Skeleton } from "./Skeleton"

describe("Skeleton", () => {
	it("renders a div with the pulse animation class", () => {
		const { container } = render(<Skeleton />)
		const el = container.firstChild as HTMLElement
		expect(el.tagName).toBe("DIV")
		expect(el.className).toContain("skeleton")
	})

	it("forwards additional className props", () => {
		const { container } = render(<Skeleton className="h-12 w-full" />)
		const el = container.firstChild as HTMLElement
		expect(el.className).toContain("h-12")
		expect(el.className).toContain("w-full")
	})

	it("merges extra props correctly (no class duplication)", () => {
		const { container } = render(<Skeleton className="rounded-xl" />)
		const el = container.firstChild as HTMLElement
		// Should not repeat class names
		const classes = el.className.split(" ")
		const unique = new Set(classes)
		expect(classes.length).toBe(unique.size)
	})
})

describe("ShopCardSkeleton", () => {
	it("renders without crashing", () => {
		const { container } = render(<ShopCardSkeleton />)
		expect(container.firstChild).toBeTruthy()
	})

	it("renders multiple skeleton children", () => {
		const { container } = render(<ShopCardSkeleton />)
		// ShopCardSkeleton should contain more than one element
		const skeletons = container.querySelectorAll(".skeleton")
		expect(skeletons.length).toBeGreaterThan(1)
	})
})
