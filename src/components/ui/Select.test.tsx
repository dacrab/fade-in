import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { Select } from "./Select"

// Select uses: value, onValueChange (not onChange), options: {value, label}[], placeholder

const options = [
	{ value: "haircut", label: "Haircut" },
	{ value: "beard", label: "Beard Trim" },
	{ value: "color", label: "Color" },
]

describe("Select", () => {
	it("renders the placeholder when no value is selected", () => {
		render(<Select value="" onValueChange={vi.fn()} options={options} placeholder="Pick a service" />)
		expect(screen.getByText("Pick a service")).toBeInTheDocument()
	})

	it("renders without crashing with an empty options array", () => {
		const { container } = render(
			<Select value="" onValueChange={vi.fn()} options={[]} placeholder="None" />,
		)
		expect(container.firstChild).toBeTruthy()
	})

	it("renders a trigger element (combobox role)", () => {
		render(<Select value="" onValueChange={vi.fn()} options={options} placeholder="Pick" />)
		// Base UI Select.Trigger renders with role="combobox"
		expect(screen.getByRole("combobox")).toBeInTheDocument()
	})

	it("opens the dropdown and shows all options on click", async () => {
		const user = userEvent.setup()
		render(<Select value="" onValueChange={vi.fn()} options={options} placeholder="Pick a service" />)
		const trigger = screen.getByRole("combobox")
		await user.click(trigger)
		expect(await screen.findByText("Haircut")).toBeInTheDocument()
		expect(await screen.findByText("Beard Trim")).toBeInTheDocument()
		expect(await screen.findByText("Color")).toBeInTheDocument()
	})

	it("calls onValueChange with the correct value when an option is selected", async () => {
		const onValueChange = vi.fn()
		const user = userEvent.setup()
		render(
			<Select value="" onValueChange={onValueChange} options={options} placeholder="Pick a service" />,
		)
		await user.click(screen.getByRole("combobox"))
		const option = await screen.findByText("Haircut")
		await user.click(option)
		expect(onValueChange).toHaveBeenCalledWith("haircut")
	})

	it("renders as disabled when disabled prop is true", () => {
		render(<Select value="" onValueChange={vi.fn()} options={options} placeholder="Pick" disabled />)
		const trigger = screen.getByRole("combobox")
		expect(trigger).toBeDisabled()
	})
})
