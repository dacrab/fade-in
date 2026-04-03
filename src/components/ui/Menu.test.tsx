import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { Menu } from "./Menu"

// Menu uses: trigger (ReactNode), items (MenuItem[]), align?
// MenuItem: { label: string, onClick: fn, icon?, danger?, separator? }

const basicItems = [
	{ label: "Profile", onClick: vi.fn() },
	{ label: "Settings", onClick: vi.fn() },
	{ separator: true as const, label: "" },
	{ label: "Sign out", onClick: vi.fn(), danger: true },
]

describe("Menu", () => {
	it("renders the trigger button", () => {
		render(<Menu trigger={<button type="button">Open Menu</button>} items={basicItems} />)
		expect(screen.getByRole("button", { name: "Open Menu" })).toBeInTheDocument()
	})

	it("menu items are NOT in the DOM before opening", () => {
		render(<Menu trigger={<button type="button">Open Menu</button>} items={basicItems} />)
		// Base UI menus render items in a Portal only when open
		expect(screen.queryByText("Profile")).toBeNull()
		expect(screen.queryByText("Settings")).toBeNull()
	})

	it("shows all menu item labels after trigger click", async () => {
		const user = userEvent.setup()
		render(<Menu trigger={<button type="button">Open Menu</button>} items={basicItems} />)
		await user.click(screen.getByRole("button", { name: "Open Menu" }))
		expect(await screen.findByText("Profile")).toBeInTheDocument()
		expect(await screen.findByText("Settings")).toBeInTheDocument()
		expect(await screen.findByText("Sign out")).toBeInTheDocument()
	})

	it("calls the item onClick handler when an item is clicked", async () => {
		const onClick = vi.fn()
		const user = userEvent.setup()
		render(
			<Menu trigger={<button type="button">Open</button>} items={[{ label: "Action", onClick }]} />,
		)
		await user.click(screen.getByRole("button", { name: "Open" }))
		await user.click(await screen.findByText("Action"))
		expect(onClick).toHaveBeenCalledTimes(1)
	})

	// ── separator ─────────────────────────────────────────────────────────
	it("renders a separator element between item groups", async () => {
		const user = userEvent.setup()
		render(<Menu trigger={<button type="button">Open Menu</button>} items={basicItems} />)
		await user.click(screen.getByRole("button", { name: "Open Menu" }))
		const separators = await screen.findAllByRole("separator")
		expect(separators.length).toBeGreaterThan(0)
	})

	it("applies danger styling to items marked danger:true", async () => {
		const user = userEvent.setup()
		render(<Menu trigger={<button type="button">Open Menu</button>} items={basicItems} />)
		await user.click(screen.getByRole("button", { name: "Open Menu" }))
		const signOut = await screen.findByText("Sign out")
		// Parent element should have danger class
		expect(signOut.closest("[class]")?.className ?? "").toContain("danger")
	})

	it("renders items with icon prop without crashing", async () => {
		const user = userEvent.setup()
		render(
			<Menu
				trigger={<button type="button">Open</button>}
				items={[{ label: "With Icon", onClick: vi.fn(), icon: <span data-testid="icon">★</span> }]}
			/>,
		)
		await user.click(screen.getByRole("button", { name: "Open" }))
		expect(await screen.findByTestId("icon")).toBeInTheDocument()
	})
})
