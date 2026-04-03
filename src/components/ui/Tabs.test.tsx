import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { Tabs } from "./Tabs"

// Tabs uses { tabs: Tab[], defaultValue?, value?, onValueChange? }
// Tab shape: { value: string, label: ReactNode, content: ReactNode }

const tabItems = [
	{ value: "overview", label: "Overview", content: <div>Overview content</div> },
	{ value: "services", label: "Services", content: <div>Services content</div> },
	{ value: "reviews", label: "Reviews", content: <div>Reviews content</div> },
]

describe("Tabs", () => {
	it("renders all tab labels as tab roles", () => {
		render(<Tabs tabs={tabItems} defaultValue="overview" />)
		expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument()
		expect(screen.getByRole("tab", { name: "Services" })).toBeInTheDocument()
		expect(screen.getByRole("tab", { name: "Reviews" })).toBeInTheDocument()
	})

	it("shows the default tab content on mount", () => {
		render(<Tabs tabs={tabItems} defaultValue="overview" />)
		expect(screen.getByText("Overview content")).toBeInTheDocument()
	})

	it("does not render non-active tab panels on mount", () => {
		render(<Tabs tabs={tabItems} defaultValue="overview" />)
		// Non-active panels are hidden (not rendered or hidden from view)
		expect(screen.queryByText("Services content")).not.toBeInTheDocument()
		expect(screen.queryByText("Reviews content")).not.toBeInTheDocument()
	})

	it("shows the clicked tab's content and hides the previous", async () => {
		const user = userEvent.setup()
		render(<Tabs tabs={tabItems} defaultValue="overview" />)
		await user.click(screen.getByRole("tab", { name: "Services" }))
		expect(screen.getByText("Services content")).toBeInTheDocument()
		expect(screen.queryByText("Overview content")).not.toBeInTheDocument()
	})

	it("can navigate between all three tabs", async () => {
		const user = userEvent.setup()
		render(<Tabs tabs={tabItems} defaultValue="overview" />)

		await user.click(screen.getByRole("tab", { name: "Reviews" }))
		expect(screen.getByText("Reviews content")).toBeInTheDocument()

		await user.click(screen.getByRole("tab", { name: "Overview" }))
		expect(screen.getByText("Overview content")).toBeInTheDocument()
	})

	it("marks the active tab with aria-selected=true", () => {
		render(<Tabs tabs={tabItems} defaultValue="overview" />)
		expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true")
	})

	it("marks non-active tabs with aria-selected=false", () => {
		render(<Tabs tabs={tabItems} defaultValue="overview" />)
		expect(screen.getByRole("tab", { name: "Services" })).toHaveAttribute("aria-selected", "false")
		expect(screen.getByRole("tab", { name: "Reviews" })).toHaveAttribute("aria-selected", "false")
	})

	it("updates aria-selected after switching tabs", async () => {
		const user = userEvent.setup()
		render(<Tabs tabs={tabItems} defaultValue="overview" />)
		await user.click(screen.getByRole("tab", { name: "Services" }))
		expect(screen.getByRole("tab", { name: "Services" })).toHaveAttribute("aria-selected", "true")
		expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "false")
	})

	it("renders a single-tab list without crashing", () => {
		render(<Tabs tabs={[tabItems[0]]} defaultValue="overview" />)
		expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument()
		expect(screen.getByText("Overview content")).toBeInTheDocument()
	})
})
