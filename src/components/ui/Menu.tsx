import { Menu as BaseMenu } from "@base-ui/react/menu"
import type * as React from "react"
import { cn } from "#/lib/cn"

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
					<BaseMenu.Popup className="popup min-w-[10rem]">
						{items.map((item, i) => {
							if (item.separator) {
								return (
									<BaseMenu.Separator
										// biome-ignore lint/suspicious/noArrayIndexKey: menu items have no stable id
										key={i}
										className="my-1 h-px mx-2"
										style={{ background: "var(--border)" }}
									/>
								)
							}
							return (
								<BaseMenu.Item
									// biome-ignore lint/suspicious/noArrayIndexKey: menu items have no stable id
									key={i}
									disabled={item.disabled}
									onClick={item.onClick}
									className={cn(
										"popup-item",
										item.danger && "danger",
										item.disabled && "opacity-40 cursor-not-allowed",
									)}
								>
									{item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
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
