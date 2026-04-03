import { Tabs as BaseTabs } from "@base-ui/react/tabs"
import { cn } from "#/lib/cn"

interface Tab {
	value: string
	label: React.ReactNode
	content: React.ReactNode
}

interface TabsProps {
	tabs: Tab[]
	defaultValue?: string
	value?: string
	onValueChange?: (value: string | null) => void
	className?: string
}

export function Tabs({ tabs, defaultValue, value, onValueChange, className }: TabsProps) {
	return (
		<BaseTabs.Root
			defaultValue={defaultValue ?? tabs[0]?.value}
			value={value}
			onValueChange={onValueChange}
			className={cn("w-full", className)}
		>
			<BaseTabs.List
				className="flex gap-1 rounded-xl p-1 mb-4"
				style={{ background: "var(--bg-card)" }}
			>
				{tabs.map((tab) => (
					<BaseTabs.Tab
						key={tab.value}
						value={tab.value}
						className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer outline-none text-[var(--text-muted)] hover:text-[var(--text)] data-[selected]:text-[var(--gold)] data-[selected]:bg-[var(--bg-card-hover)]"
						style={{ border: "none", background: "transparent" }}
					>
						{tab.label}
					</BaseTabs.Tab>
				))}
			</BaseTabs.List>
			{tabs.map((tab) => (
				<BaseTabs.Panel key={tab.value} value={tab.value}>
					{tab.content}
				</BaseTabs.Panel>
			))}
		</BaseTabs.Root>
	)
}
