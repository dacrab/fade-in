import type * as React from "react"
import { Menu as BaseMenu } from "@base-ui/react/menu"
import { cn } from "../../lib/cn"

export interface MenuItem {
	label: React.ReactNode
	onClick?: () => void
	danger?: boolean
	disabled?: boolean
	separator?: boolean
	icon?: React.ReactNode
}

interface MenuProps {
	trigger: React.ReactElement
	items: MenuItem[]
	align?: "start" | "end" | "center"
}

export function Menu({ trigger, items, align = "end" }: MenuProps) {
	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger render={trigger} />
			<BaseMenu.Portal>
				<BaseMenu.Positioner align={align} sideOffset={6}>
					<BaseMenu.Popup
						className="z-50 min-w-[10rem] overflow-hidden rounded-xl border border-[var(--border)] py-1 shadow-2xl"
						style={{ background: "var(--bg-card)" }}
					>
						{items.map((item, i) => {
							if (item.separator) {
								return (
									<BaseMenu.Separator
										key={i}
										className="my-1 h-px mx-2"
										style={{ background: "var(--border)" }}
									/>
								)
							}
							return (
								<BaseMenu.Item
									key={i}
									disabled={item.disabled}
									onClick={item.onClick}
									className={cn(
										"flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer outline-none transition-colors",
										"data-[highlighted]:bg-[var(--bg-card-hover)]",
										item.danger ? "text-[var(--error)]" : "text-[var(--text)]",
										item.disabled && "opacity-40 cursor-not-allowed",
									)}
								>
									{item.icon && (
										<span className="flex-shrink-0 opacity-70">{item.icon}</span>
									)}
									{item.label}
								</BaseMenu.Item>
							)
						})}
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	)
}
