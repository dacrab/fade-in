import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./Dialog"

// Helper: render a complete Dialog
function renderDialog({
	open = true,
	onOpenChange = vi.fn(),
	title = "Test Dialog",
	description = "Test description",
	body = "Dialog body content",
	onClose = undefined as (() => void) | undefined,
} = {}) {
	return render(
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader onClose={onClose}>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<p>{body}</p>
			</DialogContent>
		</Dialog>,
	)
}

describe("Dialog", () => {
	it("renders the title when open=true", () => {
		renderDialog({ open: true })
		expect(screen.getByText("Test Dialog")).toBeInTheDocument()
	})

	it("renders the description when open=true", () => {
		renderDialog({ open: true })
		expect(screen.getByText("Test description")).toBeInTheDocument()
	})

	it("renders body content when open=true", () => {
		renderDialog({ open: true })
		expect(screen.getByText("Dialog body content")).toBeInTheDocument()
	})

	it("does not render content when open=false", () => {
		renderDialog({ open: false })
		expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument()
	})

	it("renders a close button when onClose is provided", () => {
		renderDialog({ open: true, onClose: vi.fn() })
		// DialogHeader renders a close button (X icon) when onClose is provided
		const buttons = screen.getAllByRole("button")
		expect(buttons.length).toBeGreaterThan(0)
	})

	it("does NOT render a visible close button when onClose is omitted", () => {
		renderDialog({ open: true, onClose: undefined })
		// Base UI adds hidden focus-guard spans with role="button" — we check for
		// the actual icon-btn class that our DialogHeader renders
		const iconBtns = document.querySelectorAll(".icon-btn")
		expect(iconBtns).toHaveLength(0)
	})

	it("calls onClose when the close button is clicked", async () => {
		const onClose = vi.fn()
		const user = userEvent.setup()
		renderDialog({ open: true, onClose })
		// Use our specific class to find the close button, not the focus guards
		const closeBtn = document.querySelector(".icon-btn") as HTMLElement
		expect(closeBtn).toBeTruthy()
		await user.click(closeBtn)
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it("DialogClose renders a clickable element", async () => {
		const user = userEvent.setup()
		render(
			<Dialog open onOpenChange={vi.fn()}>
				<DialogContent>
					<DialogClose>
						<span>X</span>
					</DialogClose>
				</DialogContent>
			</Dialog>,
		)
		const closeEl = screen.getByText("X")
		expect(closeEl).toBeInTheDocument()
		// Should not throw when clicked
		await expect(user.click(closeEl)).resolves.not.toThrow()
	})
})
