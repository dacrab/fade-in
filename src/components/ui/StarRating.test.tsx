import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { StarRating } from "./StarRating"

describe("StarRating", () => {
	it("renders 5 stars by default (max=5)", () => {
		render(<StarRating rating={3} />)
		expect(screen.getAllByRole("button")).toHaveLength(5)
	})

	it("renders a custom number of stars via max prop", () => {
		render(<StarRating rating={2} max={3} />)
		expect(screen.getAllByRole("button")).toHaveLength(3)
	})

	it("renders with a rating of 0 without crashing", () => {
		render(<StarRating rating={0} />)
		expect(screen.getAllByRole("button")).toHaveLength(5)
	})

	it("renders with a rating equal to max without crashing", () => {
		render(<StarRating rating={5} max={5} />)
		expect(screen.getAllByRole("button")).toHaveLength(5)
	})

	it("applies pointer-events-none when not interactive", () => {
		render(<StarRating rating={3} />)
		for (const btn of screen.getAllByRole("button")) {
			expect(btn.className).toContain("pointer-events-none")
		}
	})

	it("does NOT call onRate when non-interactive and clicked", async () => {
		const onRate = vi.fn()
		const user = userEvent.setup()
		render(<StarRating rating={3} onRate={onRate} />)
		await user.click(screen.getAllByRole("button")[0])
		expect(onRate).not.toHaveBeenCalled()
	})

	it("applies cursor-pointer when interactive", () => {
		render(<StarRating rating={0} interactive />)
		for (const btn of screen.getAllByRole("button")) {
			expect(btn.className).toContain("cursor-pointer")
		}
	})

	it("calls onRate with correct rating (1-indexed) when a star is clicked", async () => {
		const onRate = vi.fn()
		const user = userEvent.setup()
		render(<StarRating rating={0} interactive onRate={onRate} />)
		const buttons = screen.getAllByRole("button")
		await user.click(buttons[2]) // 3rd star → rating 3
		expect(onRate).toHaveBeenCalledTimes(1)
		expect(onRate).toHaveBeenCalledWith(3)
	})

	it("calls onRate with 1 when the first star is clicked", async () => {
		const onRate = vi.fn()
		const user = userEvent.setup()
		render(<StarRating rating={0} interactive onRate={onRate} />)
		await user.click(screen.getAllByRole("button")[0])
		expect(onRate).toHaveBeenCalledWith(1)
	})

	it("calls onRate with max when the last star is clicked", async () => {
		const onRate = vi.fn()
		const user = userEvent.setup()
		render(<StarRating rating={0} max={5} interactive onRate={onRate} />)
		const buttons = screen.getAllByRole("button")
		await user.click(buttons[4]) // last star → rating 5
		expect(onRate).toHaveBeenCalledWith(5)
	})

	it("calls onRate each time a different star is clicked", async () => {
		const onRate = vi.fn()
		const user = userEvent.setup()
		render(<StarRating rating={2} interactive onRate={onRate} />)
		const buttons = screen.getAllByRole("button")
		await user.click(buttons[0])
		await user.click(buttons[4])
		expect(onRate).toHaveBeenCalledTimes(2)
		expect(onRate).toHaveBeenNthCalledWith(1, 1)
		expect(onRate).toHaveBeenNthCalledWith(2, 5)
	})

	it("does not throw when onRate is not provided and interactive", async () => {
		const user = userEvent.setup()
		render(<StarRating rating={0} interactive />)
		// Should not throw
		await expect(user.click(screen.getAllByRole("button")[0])).resolves.not.toThrow()
	})
})
