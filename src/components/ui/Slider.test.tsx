import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Slider } from "./Slider"

// Slider wraps @base-ui/react Slider.Root → Slider.Control → Slider.Track → Slider.Thumb
// The thumb element gets role="slider" and aria-valuenow from the library.

describe("Slider", () => {
	it("renders a slider role element", () => {
		render(<Slider value={3} min={0} max={5} onChange={vi.fn()} />)
		expect(screen.getByRole("slider")).toBeInTheDocument()
	})

	it("reflects aria-valuenow equal to the current value", () => {
		render(<Slider value={3} min={0} max={5} onChange={vi.fn()} />)
		const slider = screen.getByRole("slider")
		expect(slider.getAttribute("aria-valuenow")).toBe("3")
	})

	it("renders without crashing at min boundary", () => {
		const { container } = render(<Slider value={0} min={0} max={5} onChange={vi.fn()} />)
		expect(container.firstChild).toBeTruthy()
	})

	it("renders without crashing at max boundary", () => {
		const { container } = render(<Slider value={5} min={0} max={5} onChange={vi.fn()} />)
		expect(container.firstChild).toBeTruthy()
	})

	it("reflects aria-valuenow=0 when value is 0", () => {
		render(<Slider value={0} min={0} max={5} onChange={vi.fn()} />)
		expect(screen.getByRole("slider").getAttribute("aria-valuenow")).toBe("0")
	})

	it("reflects aria-valuenow=5 when value is at max", () => {
		render(<Slider value={5} min={0} max={5} onChange={vi.fn()} />)
		expect(screen.getByRole("slider").getAttribute("aria-valuenow")).toBe("5")
	})

	it("applies a custom className to the root element", () => {
		const { container } = render(
			<Slider value={3} min={0} max={5} onChange={vi.fn()} className="my-slider" />,
		)
		expect(container.firstChild).toHaveClass("my-slider")
	})

	it("slider element is a focusable form control", () => {
		render(<Slider value={2} min={0} max={10} onChange={vi.fn()} />)
		const slider = screen.getByRole("slider")
		// Should be keyboard focusable
		expect(slider.tabIndex).toBeGreaterThanOrEqual(0)
	})
})
