import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { showToast, ToastContainer } from "./Toast"

describe("ToastContainer + showToast", () => {
	let unmount: () => void

	beforeEach(() => {
		const result = render(<ToastContainer />)
		unmount = result.unmount
	})

	afterEach(() => {
		unmount()
		vi.useRealTimers()
	})

	it("renders without crashing when no toasts are queued", () => {
		expect(document.body).toBeTruthy()
	})

	it("displays a success toast message", async () => {
		act(() => {
			showToast("Saved successfully", "success")
		})
		expect(await screen.findByText("Saved successfully")).toBeInTheDocument()
	})

	it("displays an error toast message", async () => {
		act(() => {
			showToast("An error occurred", "error")
		})
		expect(await screen.findByText("An error occurred")).toBeInTheDocument()
	})

	it("displays an info toast by default (no type argument)", async () => {
		act(() => {
			showToast("Just so you know")
		})
		expect(await screen.findByText("Just so you know")).toBeInTheDocument()
	})

	it("displays an info toast when type is 'info'", async () => {
		act(() => {
			showToast("FYI", "info")
		})
		expect(await screen.findByText("FYI")).toBeInTheDocument()
	})

	it("removes the toast when the close button is clicked", async () => {
		const user = userEvent.setup()
		act(() => {
			showToast("Close me", "info")
		})
		await screen.findByText("Close me")

		// There should be exactly one close button for our toast
		const closeBtn = screen.getByRole("button")
		await user.click(closeBtn)

		await waitFor(() => {
			expect(screen.queryByText("Close me")).not.toBeInTheDocument()
		})
	})

	it("toast is immediately visible after showToast", async () => {
		act(() => {
			showToast("Instant", "success")
		})
		// Use findByText to wait for React state flush
		const el = await screen.findByText("Instant")
		expect(el).toBeVisible()
	})

	it("can display multiple toasts at once", async () => {
		act(() => {
			showToast("First", "success")
			showToast("Second", "error")
		})
		expect(await screen.findByText("First")).toBeInTheDocument()
		expect(await screen.findByText("Second")).toBeInTheDocument()
	})
})
